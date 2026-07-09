import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, OPERATOR_COOKIE, checkSession } from "@/lib/auth/session";
import {
  detectLocale,
  isLocale,
  localePath,
  splitLocaleFromPath,
  LOCALE_COOKIE,
  type Locale,
} from "@/lib/i18n/locales";

/**
 * POCX route gate + locale router (Next 16: `proxy` replaces `middleware`;
 * Node runtime, so the DB-backed session check runs right here).
 *
 * Locale routing (pages live under app/[locale]):
 *  - /ja/…            → Japanese, served as-is (no cookie — viewing a link
 *                       is not a language choice; only the switcher pins).
 *  - /en/…            → redirected to the unprefixed canonical URL, and
 *                       pins en (the escape hatch from a stale ja cookie).
 *  - unprefixed       → locale = cookie ?? Accept-Language.
 *      · ja + top-level GET navigation → 307 to /ja/… (the auto-redirect)
 *      · ja + non-navigation (RSC/POST/server action) → rewrite to /ja/…
 *      · en → rewrite to /en/… (URLs stay clean for the default locale)
 *  - APIs, llms.txt/agents.md, /sdk assets and static files bypass all of it.
 *
 * Auth gating runs on the locale-stripped path:
 *  1. /dashboard, /api/dashboard → operator session required.
 *  2. /gate/[slug] + /api/gate   → per-PoC checks inside pages/handlers.
 *  3. /api/v1                    → SDK server-to-server auth in handlers.
 *  4. Everything else            → public.
 */

const STATIC_FILE =
  /\.(?:svg|png|jpg|jpeg|gif|ico|webp|avif|woff2?|ttf|css|js|map|txt|xml|webmanifest|pdf)$/i;

/** Full-page navigation (vs RSC payload fetch, server action, API call). */
function isDocumentNavigation(req: NextRequest): boolean {
  if (req.method !== "GET") return false;
  if (req.headers.get("rsc")) return false;
  const mode = req.headers.get("sec-fetch-mode");
  if (mode) return mode === "navigate";
  return (req.headers.get("accept") ?? "").includes("text/html");
}

export function proxy(req: NextRequest) {
  const rawPath = req.nextUrl.pathname;

  // www → apex, permanently (one canonical host). Build the target from
  // POCX_ORIGIN — req.nextUrl carries the proxy's internal port behind
  // Railway, which must never leak into the redirect.
  const origin = process.env.POCX_ORIGIN ?? "http://localhost:3000";
  const apexHost = new URL(origin).host;
  if (req.headers.get("host") === `www.${apexHost}`) {
    return NextResponse.redirect(
      new URL(rawPath + req.nextUrl.search, origin),
      308,
    );
  }

  // ── Locale-exempt surfaces ────────────────────────────────────────────
  const localeExempt =
    rawPath.startsWith("/api/") ||
    rawPath === "/llms.txt" ||
    rawPath === "/agents.md" ||
    rawPath.startsWith("/sdk/") ||
    rawPath.startsWith("/_next/") ||
    STATIC_FILE.test(rawPath);

  let locale: Locale;
  let path: string; // locale-stripped path — all gating logic uses this
  let localeResponse: NextResponse | null = null;

  if (localeExempt) {
    locale = "en";
    path = rawPath;
  } else {
    // /en/… → unprefixed canonical.
    if (rawPath === "/en" || rawPath.startsWith("/en/")) {
      const stripped = rawPath === "/en" ? "/" : rawPath.slice(3);
      const url = req.nextUrl.clone();
      url.pathname = stripped;
      const res = NextResponse.redirect(url, 308);
      res.cookies.set(LOCALE_COOKIE, "en", cookieOpts());
      return res;
    }

    [locale, path] = splitLocaleFromPath(rawPath);

    if (locale === "ja") {
      // /ja URL — serve directly. Deliberately does NOT set the locale
      // cookie: opening a shared /ja link is not a language choice, and
      // pinning it here used to trap visitors in Japanese for a year.
      // Only the manual switcher (and the /en escape hatch above) pins.
      localeResponse = NextResponse.next();
    } else {
      const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value;
      const preferred: Locale = isLocale(cookieLocale)
        ? cookieLocale
        : detectLocale(req.headers.get("accept-language"));

      if (preferred === "ja" && isDocumentNavigation(req)) {
        // Auto-redirect browsers that prefer Japanese to the /ja URL.
        // No cookie: detection re-runs per request (same answer), so the
        // visitor stays unpinned until they explicitly switch language.
        const url = req.nextUrl.clone();
        url.pathname = localePath("ja", path);
        return NextResponse.redirect(url, 307);
      }

      // Serve the preferred locale under the unprefixed URL (RSC fetches,
      // server-action POSTs, or plain English traffic).
      locale = preferred;
      const url = req.nextUrl.clone();
      url.pathname = `/${preferred}${path === "/" ? "" : path}`;
      localeResponse = NextResponse.rewrite(url);
    }
  }

  // ── Auth gating (on the locale-stripped path) ─────────────────────────

  // Owner ops console — its own realm; an operator/gate cookie never opens it.
  if (path.startsWith("/admin") || path.startsWith("/api/admin")) {
    const ADMIN_PUBLIC =
      path === "/admin/login" || path.startsWith("/api/admin/auth/");
    const ok = checkSession(req.cookies.get(ADMIN_COOKIE)?.value, {
      kind: "admin",
      idleHours: 2,
    }).ok;

    if (ADMIN_PUBLIC) {
      if (path === "/admin/login" && ok) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return localeResponse ?? NextResponse.next();
    }
    if (!ok) {
      if (path.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Admin authentication required" },
          { status: 401 },
        );
      }
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return localeResponse ?? NextResponse.next();
  }

  if (path.startsWith("/dashboard") || path.startsWith("/api/dashboard")) {
    const ok = checkSession(req.cookies.get(OPERATOR_COOKIE)?.value, {
      kind: "operator",
    }).ok;
    if (!ok) {
      if (path.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 },
        );
      }
      const login = new URL(localePath(locale, "/login"), req.url);
      if (path !== "/dashboard") login.searchParams.set("next", path);
      return NextResponse.redirect(login);
    }
    return localeResponse ?? NextResponse.next();
  }

  // Signed-in operators skip the auth pages.
  if (path === "/login" || path === "/signup") {
    const ok = checkSession(req.cookies.get(OPERATOR_COOKIE)?.value, {
      kind: "operator",
    }).ok;
    if (ok) {
      return NextResponse.redirect(
        new URL(localePath(locale, "/dashboard"), req.url),
      );
    }
  }

  return localeResponse ?? NextResponse.next();
}

function cookieOpts() {
  return {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax" as const,
  };
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
