import { describe, expect, it } from "vitest";
import { gateRequestLocale } from "@/lib/i18n/gate";
import {
  detectLocale,
  localePath,
  splitLocaleFromPath,
} from "@/lib/i18n/locales";

describe("locale path helpers", () => {
  it("prefixes ja and leaves en clean", () => {
    expect(localePath("en", "/pricing")).toBe("/pricing");
    expect(localePath("ja", "/pricing")).toBe("/ja/pricing");
    expect(localePath("ja", "/")).toBe("/ja");
    expect(localePath("en", "/")).toBe("/");
  });

  it("splits /ja prefixes without false positives", () => {
    expect(splitLocaleFromPath("/ja")).toEqual(["ja", "/"]);
    expect(splitLocaleFromPath("/ja/docs")).toEqual(["ja", "/docs"]);
    expect(splitLocaleFromPath("/docs")).toEqual(["en", "/docs"]);
    expect(splitLocaleFromPath("/jam")).toEqual(["en", "/jam"]); // not /ja
    expect(splitLocaleFromPath("/")).toEqual(["en", "/"]);
  });
});

describe("Accept-Language detection", () => {
  it("detects Japanese in various forms", () => {
    expect(detectLocale("ja")).toBe("ja");
    expect(detectLocale("ja-JP,ja;q=0.9,en-US;q=0.8")).toBe("ja");
    expect(detectLocale("en-US;q=0.8,ja;q=0.9")).toBe("ja"); // quality order
  });

  it("defaults to English", () => {
    expect(detectLocale("en-AU,en;q=0.9")).toBe("en");
    expect(detectLocale("fr-FR,de;q=0.8")).toBe("en"); // unsupported → default
    expect(detectLocale(null)).toBe("en");
    expect(detectLocale("")).toBe("en");
  });
});

const req = (opts: { cookie?: string; acceptLanguage?: string }) => ({
  cookies: {
    get: (name: string) =>
      name === "pocx_locale" && opts.cookie
        ? { value: opts.cookie }
        : undefined,
  },
  headers: {
    get: (name: string) =>
      name === "accept-language" ? (opts.acceptLanguage ?? null) : null,
  },
});

describe("gateRequestLocale", () => {
  it("falls back to Accept-Language, then English", () => {
    expect(gateRequestLocale(req({ acceptLanguage: "ja,en;q=0.8" }))).toBe("ja");
    expect(gateRequestLocale(req({}))).toBe("en");
  });

  it("prefers the cookie over Accept-Language", () => {
    expect(
      gateRequestLocale(req({ cookie: "ja", acceptLanguage: "en" })),
    ).toBe("ja");
  });

  it("lets the page the evaluator is actually reading win", () => {
    // The /ja/gate/… link case: Japanese page, English browser, no cookie.
    expect(gateRequestLocale(req({ acceptLanguage: "en-US" }), "ja")).toBe("ja");
    expect(gateRequestLocale(req({ cookie: "ja" }), "en")).toBe("en");
  });

  it("ignores junk from the client and re-resolves normally", () => {
    for (const junk of [undefined, null, "th", "", 42, { locale: "ja" }]) {
      expect(gateRequestLocale(req({ cookie: "ja" }), junk)).toBe("ja");
      expect(gateRequestLocale(req({ acceptLanguage: "en" }), junk)).toBe("en");
    }
  });
});
