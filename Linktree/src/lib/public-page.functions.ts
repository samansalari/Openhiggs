import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { isStoragePath, type PageData, type PublicQuiz } from "./page-types";
import { isBot, referrerDomain } from "./validation";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getPublicPage = createServerFn({ method: "GET" }).handler(async (): Promise<PageData> => {
  const sb = publicClient();
  const [profile, categories, links, socials, quiz, reveal] = await Promise.all([
    sb.from("profile").select("*").eq("id", 1).single(),
    sb.from("categories").select("*").order("position"),
    sb.from("links").select("*").eq("is_visible", true).order("position"),
    sb.from("social_links").select("*").order("position"),
    sb.from("quiz").select("*").eq("id", 1).maybeSingle(),
    sb.rpc("quiz_public_reveal"),
  ]);
  if (profile.error) throw new Error("Profile unavailable");

  const q = quiz.data?.is_enabled ? quiz.data : null;
  const paths = [
    profile.data.avatar_url,
    ...(links.data ?? []).map((l) => l.thumbnail_url),
    q?.video_url,
    q?.poster_url,
  ].filter(isStoragePath);
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data } = await sb.storage.from("avatars").createSignedUrls(paths, 60 * 60 * 24);
    data?.forEach((d) => d.path && d.signedUrl && signed.set(d.path, d.signedUrl));
  }
  const resolve = (v: string | null) => (isStoragePath(v) ? signed.get(v) ?? null : v);

  // Browser-facing storage URLs must use the public URL, not the sandbox-local server URL.
  const publicBase = process.env["VITE_SUPABASE_URL"];
  const serverBase = process.env["SUPABASE_URL"];
  const fix = (u: string | null) =>
    u && publicBase && serverBase && u.startsWith(serverBase) ? publicBase + u.slice(serverBase.length) : u;

  const r = reveal.data?.[0];
  const publicQuiz: PublicQuiz | null = q
    ? {
        ...q,
        video_url: fix(resolve(q.video_url)),
        poster_url: fix(resolve(q.poster_url)),
        reveal:
          r && (r.correct_option === "a" || r.correct_option === "b" || r.correct_option === "c")
            ? { correct: r.correct_option, votesA: r.votes_a ?? 0, votesB: r.votes_b ?? 0, votesC: r.votes_c ?? 0 }
            : null,
      }
    : null;

  return {
    profile: { ...profile.data, avatar_url: fix(resolve(profile.data.avatar_url)) },
    categories: categories.data ?? [],
    links: (links.data ?? []).map((l) => ({ ...l, thumbnail_url: fix(resolve(l.thumbnail_url)) })),
    socials: socials.data ?? [],
    quiz: publicQuiz,
  };
});

const trackInput = z.object({
  type: z.enum(["view", "click"]),
  linkId: z.string().uuid().optional(),
  referrer: z.string().max(2048).optional(),
});

const LIMITS = { view: 20, click: 60 } as const; // per visitor per hour

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function clientIp(req: Request) {
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export const trackEvent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => trackInput.parse(input))
  .handler(async ({ data }) => {
    const req = getRequest();
    if (isBot(req.headers.get("user-agent"))) return { ok: false };

    const ip = clientIp(req);
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    // Hash is salted per day and never stored alongside events; used only for rate limiting.
    const visitor = await sha256(`${ip}|${day}|${process.env["SUPABASE_URL"]}`);
    const hour = new Date(Math.floor(now.getTime() / 3_600_000) * 3_600_000).toISOString();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: count } = await supabaseAdmin.rpc("hit_rate_limit", {
      _key: `${data.type}:${visitor}`,
      _window_start: hour,
    });
    if ((count ?? 0) > LIMITS[data.type]) return { ok: false };

    await supabaseAdmin.from("analytics_events").insert({
      event_type: data.type,
      link_id: data.type === "click" ? data.linkId ?? null : null,
      referrer: referrerDomain(data.referrer),
    });
    return { ok: true };
  });

const voteInput = z.object({ choice: z.enum(["a", "b", "c"]) });

/** Anonymous quiz vote. One vote per visitor (hashed network + browser) per round; nothing identifying is stored. */
export const castQuizVote = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => voteInput.parse(input))
  .handler(async ({ data }) => {
    const req = getRequest();
    const ua = req.headers.get("user-agent");
    if (isBot(ua)) return { ok: false as const, correct: null };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: quiz } = await supabaseAdmin.from("quiz").select("round, is_enabled").eq("id", 1).maybeSingle();
    if (!quiz?.is_enabled) return { ok: false as const, correct: null };

    const ip = clientIp(req);
    const now = new Date();
    const hour = new Date(Math.floor(now.getTime() / 3_600_000) * 3_600_000).toISOString();
    const ipKey = await sha256(`vote|${ip}|${now.toISOString().slice(0, 10)}|${process.env["SUPABASE_URL"]}`);
    const { data: count } = await supabaseAdmin.rpc("hit_rate_limit", { _key: `vote:${ipKey}`, _window_start: hour });

    // The answer never ships to the browser; grading happens here, one tap at a time.
    const { data: answerRow } = await supabaseAdmin.from("quiz_answer").select("correct_option").eq("id", 1).maybeSingle();
    const answer = answerRow?.correct_option;
    const correct = answer === "a" || answer === "b" || answer === "c" ? data.choice === answer : null;
    // Floods still get feedback, but aren't recorded as votes.
    if ((count ?? 0) > 10) return { ok: true as const, correct };

    const voter = await sha256(`${quiz.round}|${ip}|${ua}|${process.env["SUPABASE_URL"]}`);
    // Unique voter_hash means repeat votes are ignored.
    await supabaseAdmin.from("quiz_votes").upsert({ choice: data.choice, voter_hash: voter }, { onConflict: "voter_hash", ignoreDuplicates: true });
    return { ok: true as const, correct };
  });
