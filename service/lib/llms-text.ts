import { pocxOrigin } from "@/lib/utils";

/**
 * The agent-executable integration instructions served at /llms.txt and
 * /agents.md. One builder, two routes — the documents are identical.
 */
export function buildLlmsText(): string {
  const origin = pocxOrigin();

  return `# POCX — add PoC protection to an app (instructions for coding agents)

POCX is a hosted access gate: allowlisted email OTP login + e-signed Terms of Access + revocable sessions, in front of a proof-of-concept app. Auth runs on POCX's servers; the app only verifies a signed session token locally.

## Prerequisites (ask the user if missing)
Three values from the PoC's Overview page in the POCX dashboard:
- POCX_URL          e.g. ${origin}
- POCX_PROJECT_KEY  starts with pocx_pk_
- POCX_SECRET       starts with pocx_sk_  (server-side only — never expose to the browser)

## Steps
1. Add the three variables to the app's server env (.env.local for Next.js). Never commit POCX_SECRET.
2. Download the single-file SDK (zero dependencies, TypeScript, works on Node and edge runtimes):
   curl -o lib/pocx.ts ${origin}/sdk/pocx.ts
3. Wire the gate:
   - Next.js 16 (App Router): create proxy.ts at the project root:
       import { createPocxGate } from "./lib/pocx";
       const gate = createPocxGate();
       export const proxy = gate.nextProxy();
       export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
   - Next.js 12–15: same file but named middleware.ts, exporting \`middleware\` instead of \`proxy\`.
   - Express: import { createPocxGate } from "./lib/pocx"; app.use(createPocxGate().expressMiddleware());
4. Do NOT create the callback route — the gate handles {callbackPath} (default /api/pocx/callback) inside the middleware automatically.
5. Verify: start the app, request any page. Expect a 307 redirect to ${origin}/gate/<slug>. After OTP + terms acceptance the browser returns with a pocx_session cookie and the page renders.

## Options (createPocxGate({ … }))
- cookieName (default "pocx_session")
- publicPaths: string[] — path prefixes to leave unprotected (e.g. ["/api/health"])
- logEvents: boolean — POST page_view events to the POCX audit trail (Pro feature; default off, or env POCX_LOG_EVENTS=true)

## How it works (for reference)
Unauthenticated request → 307 to the hosted gate → email OTP (allowlist enforced by POCX) → Terms of Access e-signature → POCX redirects to the callback with a single-use 2-minute grant → the SDK exchanges it server-to-server (authenticated with POCX_SECRET) for an HS256-signed session token → cookie set on the app's domain → subsequent requests verified locally, revalidated against POCX every 60s (picks up revocations, PoC pauses, terms bumps).

## Troubleshooting
- 401 from exchange: POCX_SECRET doesn't match the PoC (or was rotated in the dashboard).
- Redirect loop: the app URL isn't registered — set "Protected app URL" in PoC Settings to the app's public origin.
- No email arriving: the POCX deployment may be in mock-mail mode; codes appear in the dashboard's Emails tab.

Full docs: ${origin}/docs

## About
POCX is open source (AGPL-3.0; SDK MIT) — https://github.com/saadkamal/pocx
Built and operated by Haxo Pty Ltd (Australia); created by Saad Kamal. Hosted service: https://pocx.dev
Support: pocx@haxo.com.au · Terms: ${origin}/terms · Privacy: ${origin}/privacy
`;
}
