import { createFileRoute } from "@tanstack/react-router";

// Stable public CV URL: redirects to a short-lived signed link for the uploaded PDF.
export const Route = createFileRoute("/cv")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { createClient } = await import("@supabase/supabase-js");
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const sb = createClient(process.env["SUPABASE_URL"]!, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const h = new Headers(init?.headers);
              if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
              h.set("apikey", key);
              return fetch(input, { ...init, headers: h });
            },
          },
        });
        const home = new URL("/", request.url).toString();
        const { data: p } = await sb.from("profile").select("cv_path").eq("id", 1).single();
        if (!p?.cv_path) return Response.redirect(home, 302);
        const { data } = await sb.storage.from("avatars").createSignedUrl(p.cv_path, 600, { download: "CV.pdf" });
        if (!data?.signedUrl) return Response.redirect(home, 302);
        const pub = process.env["VITE_SUPABASE_URL"], srv = process.env["SUPABASE_URL"]!;
        const url = pub && data.signedUrl.startsWith(srv) ? pub + data.signedUrl.slice(srv.length) : data.signedUrl;
        return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "no-store" } });
      },
    },
  },
});
