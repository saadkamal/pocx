/**
 * i18n core. Two locales:
 *   en — default, served at unprefixed URLs (proxy rewrites to /en internally)
 *   ja — served at /ja/… URLs
 *
 * Resolution order (proxy): explicit /ja path → pocx_locale cookie →
 * Accept-Language header → en. Manual switching sets the cookie, so a
 * choice always beats browser detection.
 */

export const LOCALES = ["en", "ja"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "pocx_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "ja";
}

/** Prefix a path for a locale ("/pricing" → "/ja/pricing"; en unprefixed). */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return locale === "en" ? clean : `/ja${clean === "/" ? "" : clean}` || "/ja";
}

/** Strip a leading /ja from a pathname; returns [locale, strippedPath]. */
export function splitLocaleFromPath(pathname: string): [Locale, string] {
  if (pathname === "/ja") return ["ja", "/"];
  if (pathname.startsWith("/ja/")) return ["ja", pathname.slice(3) || "/"];
  return ["en", pathname];
}

/**
 * First supported language from an Accept-Language header, honouring the
 * client's order. "ja;q=0.9, en;q=0.8" → ja. Unknown/missing → en.
 */
export function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const tags = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number(q.slice(2)) : 1 };
    })
    .filter((t) => t.tag && !Number.isNaN(t.q))
    .sort((a, b) => b.q - a.q);
  for (const { tag } of tags) {
    if (tag === "ja" || tag.startsWith("ja-")) return "ja";
    if (tag === "en" || tag.startsWith("en-")) return "en";
  }
  return DEFAULT_LOCALE;
}
