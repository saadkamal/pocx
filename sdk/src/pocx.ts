/**
 * ============================================================================
 *  POCX SDK — protect a proof-of-concept app with your hosted POCX gate.
 *  Single file. Zero dependencies. Runs in Node AND edge runtimes.
 *
 *  (c) 2026 Saad Kamal · MIT licensed — vendor this file freely into any
 *  app, proprietary or otherwise. https://pocx.dev
 * ============================================================================
 *
 *  What this does:
 *   - Intercepts every request to your app (Next proxy/middleware or Express).
 *   - Unauthenticated visitors are redirected to your hosted POCX gate
 *     (email OTP allowlist login + e-signed Terms of Access).
 *   - The gate hands back a single-use grant; this SDK exchanges it
 *     server-to-server for a signed HS256 session token set as an
 *     HttpOnly cookie. The session itself never travels through the URL.
 *   - Every request verifies the token locally (crypto.subtle, no network)
 *     and revalidates the session with POCX at most once per 60s — so
 *     revocations, evaluator disables, PoC pauses and terms bumps
 *     propagate within a minute.
 *   - Optionally streams page_view audit events to your POCX audit trail.
 *   - Fails closed if the gate is unreachable and no config was ever
 *     fetched; fails open only for transient revalidation blips while the
 *     token is still cryptographically valid.
 *
 *  Quickstart — Next.js 16 (proxy.ts at the project root):
 *
 *      import { createPocxGate } from "./lib/pocx";
 *      const gate = createPocxGate();
 *      export default gate.nextProxy();
 *      export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
 *
 *  Next.js <= 15: identical, but the file is middleware.ts (edge runtime —
 *  this file is edge-safe: no node: imports, Web APIs only).
 *
 *  Express / any Node server:
 *
 *      import { createPocxGate } from "./lib/pocx";
 *      app.use(createPocxGate().expressMiddleware());
 *
 *  Environment variables (or pass them to createPocxGate()):
 *      POCX_URL          your POCX instance origin, e.g. https://pocx.example.com
 *      POCX_PROJECT_KEY  the PoC's public key (pocx_pk_…)
 *      POCX_SECRET       the PoC's secret (pocx_sk_…) — server-side only!
 *      POCX_LOG_EVENTS   "true" to stream page_view events to the audit trail
 *
 *  Docs: https://pocx.dev/docs
 *  This file is served by your POCX instance at {POCX_URL}/sdk/pocx.ts —
 *  vendor it with:  curl -o lib/pocx.ts {POCX_URL}/sdk/pocx.ts
 * ============================================================================
 */

/* ------------------------------------------------------------------------ */
/*  Public types                                                             */
/* ------------------------------------------------------------------------ */

export type PocxOptions = {
  /** POCX instance origin (default: env POCX_URL). */
  url?: string;
  /** PoC public key, pocx_pk_… (default: env POCX_PROJECT_KEY). */
  projectKey?: string;
  /** PoC secret, pocx_sk_… (default: env POCX_SECRET). Never expose client-side. */
  secret?: string;
  /** Session cookie name (default: "pocx_session"). */
  cookieName?: string;
  /** Path prefixes that bypass the gate entirely (e.g. ["/health"]). */
  publicPaths?: string[];
  /** Stream page_view audit events to POCX (default: env POCX_LOG_EVENTS === "true"). */
  logEvents?: boolean;
};

/** Claims inside the HS256 token the POCX service signs. */
export type PocxClaims = {
  iss: "pocx";
  sub: string; // evaluator email
  poc: string; // PoC slug
  sid: string; // gate session id
  tv: string; // terms version accepted
  iat: number;
  exp: number; // unix seconds — gate-session expiry
};

export type PocxVerifyResult =
  | { authenticated: true; email: string; sessionId: string }
  | { authenticated: false; reason: string };

type PocConfig = {
  slug: string;
  name: string;
  ownerEntity: string;
  status: string;
  termsVersion: string;
  sessionTtlHours: number;
  idleTimeoutHours: number;
  gateUrl: string;
  appUrl: string | null;
  callbackPath: string;
};

/* ------------------------------------------------------------------------ */
/*  Small helpers (edge-safe: no Buffer, no node: imports)                   */
/* ------------------------------------------------------------------------ */

/** Read an env var without requiring Node typings (safe in edge runtimes). */
function readEnv(name: string): string | undefined {
  const env = (
    globalThis as { process?: { env?: Record<string, string | undefined> } }
  ).process?.env;
  const value = env?.[name];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** base64url → bytes, without Buffer. Throws on malformed input. */
function b64urlDecode(input: string) {
  const b64 =
    input.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (input.length % 4)) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Extract a cookie value from a Cookie header. */
function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return undefined;
}

/** Full request URL, honouring reverse-proxy forwarding headers. */
function forwardedUrl(rawUrl: string, headers: Headers): string {
  const url = new URL(rawUrl);
  const proto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const host = headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (!proto && !host) return url.toString();
  const scheme = proto || url.protocol.replace(/:$/, "");
  return `${scheme}://${host || url.host}${url.pathname}${url.search}`;
}

/** `next` param must be a same-origin absolute path ("/x", never "//x"). */
function sanitizeNextPath(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\")) {
    return raw;
  }
  return "/";
}

const STATIC_FILE_RE =
  /\.(?:svg|png|jpg|jpeg|gif|ico|webp|avif|woff2?|ttf|css|js|map|txt|xml|webmanifest)$/i;

function isPrefetch(headers: Headers): boolean {
  if (headers.get("next-router-prefetch") !== null) return true;
  const purpose =
    headers.get("purpose") ??
    headers.get("x-purpose") ??
    headers.get("sec-purpose") ??
    "";
  return purpose.toLowerCase().includes("prefetch");
}

/* ------------------------------------------------------------------------ */
/*  Standalone JWT verification (HS256 via crypto.subtle — async)            */
/* ------------------------------------------------------------------------ */

export type PocxTokenCheck =
  | { ok: true; claims: PocxClaims }
  | { ok: false; reason: "malformed" | "bad_sig" | "expired" };

/**
 * Verify a POCX HS256 session token with the PoC secret. Checks the
 * signature, `iss === "pocx"` and expiry. Callers that know the PoC slug
 * should additionally check `claims.poc` (the gate does this for you).
 */
export async function verifyPocxToken(
  token: string,
  secret: string,
): Promise<PocxTokenCheck> {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [header, payload, sig] = parts;

  const decoded = (() => {
    try {
      return { sig: b64urlDecode(sig), payload: b64urlDecode(payload) };
    } catch {
      return null;
    }
  })();
  if (!decoded) return { ok: false, reason: "malformed" };

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    decoded.sig,
    enc.encode(`${header}.${payload}`),
  );
  if (!valid) return { ok: false, reason: "bad_sig" };

  let claims: PocxClaims;
  try {
    claims = JSON.parse(new TextDecoder().decode(decoded.payload)) as PocxClaims;
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (
    !claims ||
    claims.iss !== "pocx" ||
    typeof claims.sub !== "string" ||
    typeof claims.poc !== "string" ||
    typeof claims.sid !== "string" ||
    typeof claims.exp !== "number"
  ) {
    return { ok: false, reason: "malformed" };
  }
  if (Date.now() / 1000 > claims.exp) return { ok: false, reason: "expired" };
  return { ok: true, claims };
}

/* ------------------------------------------------------------------------ */
/*  The gate                                                                 */
/* ------------------------------------------------------------------------ */

const CONFIG_TTL_MS = 5 * 60_000; // config cache
const REVALIDATE_MS = 60_000; // per-session revalidation interval
const VALIDATION_CACHE_MAX = 1_000;

/**
 * Create a POCX gate for this app. Reads POCX_URL / POCX_PROJECT_KEY /
 * POCX_SECRET from the environment unless passed explicitly, and throws
 * immediately if any of the three is missing.
 */
export function createPocxGate(options: PocxOptions = {}) {
  const urlOpt = (options.url ?? readEnv("POCX_URL"))?.replace(/\/+$/, "");
  const keyOpt = options.projectKey ?? readEnv("POCX_PROJECT_KEY");
  const secretOpt = options.secret ?? readEnv("POCX_SECRET");
  const cookieName = options.cookieName ?? "pocx_session";
  const publicPaths = options.publicPaths ?? [];
  const logEvents = options.logEvents ?? readEnv("POCX_LOG_EVENTS") === "true";

  if (!urlOpt || !keyOpt || !secretOpt) {
    const missing = [
      !urlOpt && "url (env POCX_URL)",
      !keyOpt && "projectKey (env POCX_PROJECT_KEY)",
      !secretOpt && "secret (env POCX_SECRET)",
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `[pocx] createPocxGate: missing required option(s): ${missing}. ` +
        `Set the env vars or pass them to createPocxGate().`,
    );
  }
  // Re-bind so the narrowed string types flow into the closures below.
  const url: string = urlOpt;
  const projectKey: string = keyOpt;
  const secret: string = secretOpt;

  const authHeaders = (): Record<string, string> => ({
    "x-pocx-key": projectKey,
    authorization: `Bearer ${secret}`,
    "content-type": "application/json",
  });

  /* ---- Config cache: 5 min TTL, serve stale on failure ---------------- */

  let configCache: { at: number; poc: PocConfig } | null = null;
  let configInflight: Promise<PocConfig> | null = null;

  async function fetchConfig(): Promise<PocConfig> {
    const res = await fetch(`${url}/api/v1/config`, {
      method: "GET",
      headers: authHeaders(),
    });
    const data = (await res.json().catch(() => null)) as
      | { ok?: boolean; poc?: PocConfig; error?: string }
      | null;
    if (!res.ok || !data?.ok || !data.poc) {
      throw new Error(
        `[pocx] GET /api/v1/config failed (${res.status}): ${data?.error ?? "unknown error"}`,
      );
    }
    return data.poc;
  }

  async function getConfig(): Promise<PocConfig> {
    const now = Date.now();
    if (configCache && now - configCache.at < CONFIG_TTL_MS) {
      return configCache.poc;
    }
    if (!configInflight) {
      configInflight = fetchConfig().finally(() => {
        configInflight = null;
      });
    }
    try {
      const poc = await configInflight;
      configCache = { at: Date.now(), poc };
      return poc;
    } catch (err) {
      if (configCache) {
        // Stale-but-usable: keep serving the app on config-endpoint blips.
        console.warn(
          `[pocx] config refresh failed; serving cached config: ${String(err)}`,
        );
        return configCache.poc;
      }
      throw err; // never fetched → caller fails closed (503)
    }
  }

  /* ---- Session revalidation cache -------------------------------------- */

  const validationCache = new Map<
    string,
    { at: number; ok: boolean; reason?: string }
  >();

  function pruneValidationCache(now: number): void {
    if (validationCache.size <= VALIDATION_CACHE_MAX) return;
    for (const [sid, entry] of validationCache) {
      if (now - entry.at > CONFIG_TTL_MS) validationCache.delete(sid);
    }
  }

  /** POST /api/v1/validate at most once per 60s per session. */
  async function revalidateSession(
    sessionId: string,
  ): Promise<{ ok: boolean; reason?: string }> {
    const now = Date.now();
    const cached = validationCache.get(sessionId);
    if (cached && now - cached.at < REVALIDATE_MS) return cached;
    pruneValidationCache(now);

    try {
      const res = await fetch(`${url}/api/v1/validate`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ sessionId }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; valid?: boolean; reason?: string }
        | null;
      if (!res.ok || !data?.ok) {
        throw new Error(`validate returned ${res.status}`);
      }
      const entry = data.valid
        ? { at: now, ok: true }
        : { at: now, ok: false, reason: data.reason ?? "session_invalid" };
      validationCache.set(sessionId, entry);
      return entry;
    } catch (err) {
      // Transient blip: the JWT is still cryptographically valid, so keep
      // the previous verdict (fail-open) rather than kicking evaluators out.
      console.warn(`[pocx] session revalidation failed: ${String(err)}`);
      const entry = cached
        ? { at: now, ok: cached.ok, reason: cached.reason }
        : { at: now, ok: true };
      validationCache.set(sessionId, entry);
      return entry;
    }
  }

  /* ---- Audit events (fire-and-forget) ---------------------------------- */

  type PocxEvent = {
    type: string;
    path?: string;
    email?: string;
    sessionId?: string;
    detail?: string;
    ip?: string;
    userAgent?: string;
  };

  async function postEvents(events: PocxEvent[]): Promise<void> {
    if (events.length === 0) return;
    await fetch(`${url}/api/v1/events`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ events: events.slice(0, 50) }),
    });
  }

  /* ---- Cookies ---------------------------------------------------------- */

  function sessionCookie(token: string, maxAgeSec: number, secure: boolean): string {
    return (
      `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; ` +
      `Max-Age=${maxAgeSec}${secure ? "; Secure" : ""}`
    );
  }

  function clearCookie(): string {
    return `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  }

  /* ---- Core authentication (cookie → JWT → revalidate) ------------------ */

  async function authenticate(
    cookieHeader: string | null,
    config: PocConfig,
  ): Promise<PocxVerifyResult & { hadCookie: boolean }> {
    const token = readCookie(cookieHeader, cookieName);
    if (!token) return { authenticated: false, reason: "no_cookie", hadCookie: false };

    const check = await verifyPocxToken(token, secret);
    if (!check.ok) {
      return { authenticated: false, reason: check.reason, hadCookie: true };
    }
    if (check.claims.poc !== config.slug) {
      return { authenticated: false, reason: "wrong_poc", hadCookie: true };
    }

    const session = await revalidateSession(check.claims.sid);
    if (!session.ok) {
      return {
        authenticated: false,
        reason: session.reason ?? "session_invalid",
        hadCookie: true,
      };
    }
    return {
      authenticated: true,
      email: check.claims.sub,
      sessionId: check.claims.sid,
      hadCookie: true,
    };
  }

  /**
   * Verify a raw Request (route handler, server component, API route).
   * Local JWT check + throttled server revalidation — no redirects.
   */
  async function verifyRequest(req: Request): Promise<PocxVerifyResult> {
    let config: PocConfig;
    try {
      config = await getConfig();
    } catch {
      return { authenticated: false, reason: "pocx_unreachable" };
    }
    const { hadCookie: _hadCookie, ...result } = await authenticate(
      req.headers.get("cookie"),
      config,
    );
    return result;
  }

  /* ---- Responses --------------------------------------------------------- */

  function redirect(location: string, setCookie?: string): Response {
    const headers = new Headers({ location });
    if (setCookie) headers.append("set-cookie", setCookie);
    return new Response(null, { status: 307, headers });
  }

  function gateUnreachable(): Response {
    return new Response(
      `<!doctype html><html><head><title>POCX gate unreachable</title></head>` +
        `<body style="font-family:system-ui;max-width:32rem;margin:20vh auto;text-align:center">` +
        `<h1>POCX gate unreachable</h1>` +
        `<p>Refusing to serve the protected app. Please try again shortly.</p>` +
        `</body></html>`,
      { status: 503, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }

  /* ---- Callback: exchange the single-use grant for a session cookie ----- */

  async function handleCallback(
    requestUrl: URL,
    config: PocConfig,
    secure: boolean,
  ): Promise<Response> {
    const grant = requestUrl.searchParams.get("pocx_grant") ?? "";
    const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"));

    try {
      const res = await fetch(`${url}/api/v1/exchange`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ grant }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; token?: string; expiresAt?: number; error?: string }
        | null;
      if (
        res.ok &&
        data?.ok &&
        typeof data.token === "string" &&
        typeof data.expiresAt === "number"
      ) {
        const maxAge = Math.max(
          60,
          Math.floor((data.expiresAt - Date.now()) / 1000),
        );
        return redirect(
          `${requestUrl.origin}${nextPath}`,
          sessionCookie(data.token, maxAge, secure),
        );
      }
      console.warn(
        `[pocx] grant exchange rejected (${res.status}): ${data?.error ?? "unknown"}`,
      );
    } catch (err) {
      console.warn(`[pocx] grant exchange failed: ${String(err)}`);
    }

    // Grant invalid/expired/used → start over at the gate, preserving the
    // evaluator's intended destination.
    const returnTo = `${requestUrl.origin}${nextPath}`;
    return redirect(
      `${config.gateUrl}?return_to=${encodeURIComponent(returnTo)}`,
      clearCookie(),
    );
  }

  /* ---- The shared request handler ---------------------------------------- */

  /** Returns a Response to short-circuit with, or undefined to pass through. */
  async function handle(
    fullUrl: string,
    headers: Headers,
  ): Promise<Response | undefined> {
    const requestUrl = new URL(fullUrl);
    const { pathname } = requestUrl;

    // Never gate static assets, Next internals or configured public paths.
    if (STATIC_FILE_RE.test(pathname)) return undefined;
    if (pathname.startsWith("/_next/")) return undefined;
    for (const p of publicPaths) {
      if (pathname === p || pathname.startsWith(p)) return undefined;
    }

    let config: PocConfig;
    try {
      config = await getConfig();
    } catch (err) {
      // No config, ever: we can't even know the gate URL. Fail closed.
      console.warn(`[pocx] no config available, failing closed: ${String(err)}`);
      return gateUnreachable();
    }

    const secure = requestUrl.protocol === "https:";

    // 1) Gate → app handoff: {callbackPath}?pocx_grant=…&next=/path
    if (
      pathname === config.callbackPath &&
      requestUrl.searchParams.has("pocx_grant")
    ) {
      return handleCallback(requestUrl, config, secure);
    }

    // 2) Everything else: cookie → local verify → throttled revalidation.
    const auth = await authenticate(headers.get("cookie"), config);

    if (auth.authenticated) {
      if (logEvents && !isPrefetch(headers)) {
        void postEvents([
          {
            type: "page_view",
            path: pathname,
            email: auth.email,
            sessionId: auth.sessionId,
            userAgent: headers.get("user-agent") ?? undefined,
          },
        ]).catch(() => {});
      }
      return undefined; // pass through to the app
    }

    // 3) Unauthenticated. API/data requests get a 401, pages go to the gate.
    const accept = headers.get("accept") ?? "";
    if (accept.includes("application/json") || pathname.startsWith("/api/")) {
      const h = new Headers({ "content-type": "application/json" });
      if (auth.hadCookie) h.append("set-cookie", clearCookie());
      return new Response(
        JSON.stringify({ error: "POCX authentication required" }),
        { status: 401, headers: h },
      );
    }
    return redirect(
      `${config.gateUrl}?return_to=${encodeURIComponent(fullUrl)}`,
      auth.hadCookie ? clearCookie() : undefined,
    );
  }

  /* ---- Adapters ----------------------------------------------------------- */

  /**
   * Next.js adapter. In Next 16 export it from proxy.ts; in Next <= 15 from
   * middleware.ts (edge-safe). Returning undefined lets the request through.
   */
  function nextProxy(): (
    req: Request & { nextUrl?: { pathname: string } },
  ) => Promise<Response | undefined> {
    return async (req) => handle(forwardedUrl(req.url, req.headers), req.headers);
  }

  /**
   * Express/Connect adapter: app.use(gate.expressMiddleware()).
   * Types are intentionally loose so the SDK needs no Node typings.
   */
  function expressMiddleware(): (req: any, res: any, next: any) => void {
    return (req: any, res: any, next: any) => {
      (async () => {
        const headers = new Headers();
        for (const [key, value] of Object.entries(req.headers ?? {})) {
          if (Array.isArray(value)) {
            for (const v of value) headers.append(key, String(v));
          } else if (value !== undefined) {
            headers.set(key, String(value));
          }
        }
        const proto =
          headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
          req.protocol ||
          "http";
        const host =
          headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
          headers.get("host") ||
          "localhost";
        const fullUrl = `${proto}://${host}${req.originalUrl ?? req.url ?? "/"}`;

        const response = await handle(fullUrl, headers);
        if (!response) return next();

        res.statusCode = response.status;
        response.headers.forEach((value: string, key: string) => {
          res.setHeader(key, value);
        });
        const body = await response.text();
        res.end(body);
      })().catch(next);
    };
  }

  /** A 307 redirect that clears the POCX session cookie (local sign-out). */
  function signOutResponse(redirectTo = "/"): Response {
    return redirect(redirectTo, clearCookie());
  }

  return { nextProxy, expressMiddleware, verifyRequest, signOutResponse };
}
