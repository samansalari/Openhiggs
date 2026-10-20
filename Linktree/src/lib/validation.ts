import { z } from "zod";

const ALLOWED_PROTOCOLS = ["https:", "http:", "mailto:", "tel:"];

/** True only for http(s), mailto, tel and same-site paths like /cv. Blocks javascript:, data:, etc. */
export function isSafeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^\/[a-zA-Z0-9\-_/]*$/.test(trimmed) && !trimmed.startsWith("//")) return true;
  try {
    const url = new URL(trimmed);
    if (!ALLOWED_PROTOCOLS.includes(url.protocol)) return false;
    if ((url.protocol === "http:" || url.protocol === "https:") && !url.hostname.includes(".")) {
      return url.hostname === "localhost";
    }
    return true;
  } catch {
    return false;
  }
}

export const safeUrlSchema = z
  .string()
  .trim()
  .min(1, "URL is required")
  .max(2048)
  .refine(isSafeUrl, "Use a full link starting with https://, mailto: or tel:");

export const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #E7AC3B");

export const linkSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100),
  url: safeUrlSchema,
  description: z.string().trim().max(200).optional().or(z.literal("")),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  headline: z.string().trim().max(120),
  bio: z.string().trim().max(500),
  location: z.string().trim().max(80),
});

const BOT_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|headless|lighthouse|python-requests|curl|wget|httpclient|axios|node-fetch|go-http|java\/|monitor|pingdom|uptime/i;

/** Basic user-agent bot filter. Missing UA is treated as a bot. */
export function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent || userAgent.length < 10) return true;
  return BOT_PATTERN.test(userAgent);
}

/** Reduce a referrer to its hostname only (no paths or query strings). */
export function referrerDomain(ref: string | null | undefined): string | null {
  if (!ref) return null;
  try {
    return new URL(ref).hostname.replace(/^www\./, "").slice(0, 100) || null;
  } catch {
    return null;
  }
}
