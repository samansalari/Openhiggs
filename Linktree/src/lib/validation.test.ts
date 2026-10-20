import { describe, expect, it } from "vitest";
import { isBot, isSafeUrl, referrerDomain } from "./validation";

describe("isSafeUrl", () => {
  it("accepts https, mailto and tel links", () => {
    expect(isSafeUrl("https://example.com/a")).toBe(true);
    expect(isSafeUrl("mailto:hello@example.com")).toBe(true);
    expect(isSafeUrl("tel:+441234567890")).toBe(true);
  });
  it("rejects javascript: and data: links", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,<b>x</b>")).toBe(false);
  });
  it("rejects bare words without a protocol", () => {
    expect(isSafeUrl("example.com")).toBe(false);
  });
});

describe("isBot", () => {
  it("flags crawlers and missing user agents", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot("facebookexternalhit/1.1")).toBe(true);
    expect(isBot(null)).toBe(true);
  });
  it("allows a normal mobile browser", () => {
    expect(
      isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram"),
    ).toBe(false);
  });
});

describe("referrerDomain", () => {
  it("keeps only the hostname", () => {
    expect(referrerDomain("https://www.linkedin.com/feed?x=1")).toBe("linkedin.com");
  });
});

describe("isSafeUrl same-site paths", () => {
  it("accepts /cv but rejects protocol-relative //evil.com", () => {
    expect(isSafeUrl("/cv")).toBe(true);
    expect(isSafeUrl("//evil.com")).toBe(false);
  });
});
