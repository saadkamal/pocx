import { describe, expect, it } from "vitest";
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
