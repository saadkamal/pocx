# pocx — client SDK

Protect a proof-of-concept app with your hosted POCX gate: email OTP
allowlist login, e-signed Terms of Access, revocable sessions and an audit
trail — with a single file added to your app.

The entire SDK is one zero-dependency TypeScript file
([`src/pocx.ts`](./src/pocx.ts)) built on Web APIs only (`fetch`,
`crypto.subtle`, `Request`/`Response`), so it runs unchanged in Node **and**
edge runtimes (Next ≤ 15 middleware is edge).

## Install

**Option A — vendor the single file (recommended).** Your POCX instance
serves the SDK itself:

```bash
curl -o lib/pocx.ts https://YOUR-POCX-HOST/sdk/pocx.ts
```

No package manager, no lockfile churn, nothing to audit but one readable
file you own.

**Option B — copy from this repo.** Grab `sdk/src/pocx.ts` and drop it into
your project, or depend on this package directly (it ships TypeScript
source: TypeScript ≥ 5 consumers import it as-is; there is no build step).

## Quickstart

Set three environment variables (from your PoC's **Integration** section of the PoC's **Overview** tab):

```bash
POCX_URL=https://YOUR-POCX-HOST        # your POCX instance origin
POCX_PROJECT_KEY=pocx_pk_…             # the PoC's public key
POCX_SECRET=pocx_sk_…                  # the PoC's secret — server-side only
```

### Next.js 16 — `proxy.ts` at the project root

```ts
import { createPocxGate } from "./lib/pocx";

const gate = createPocxGate();
export default gate.nextProxy();

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
```

### Next.js ≤ 15 — `middleware.ts` at the project root

Identical code, different filename. The SDK is edge-safe (no `node:`
imports), so it runs fine in the edge middleware runtime:

```ts
import { createPocxGate } from "./lib/pocx";

const gate = createPocxGate();
export default gate.nextProxy();

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
```

### Express / any Node server

```ts
import express from "express";
import { createPocxGate } from "./lib/pocx.js";

const app = express();
app.use(createPocxGate().expressMiddleware());
app.get("/", (_req, res) => res.send("Protected!"));
app.listen(3000);
```

### In route handlers / server components

```ts
import { createPocxGate } from "@/lib/pocx";

const gate = createPocxGate();

export async function GET(req: Request) {
  const who = await gate.verifyRequest(req);
  if (!who.authenticated) {
    return Response.json({ error: who.reason }, { status: 401 });
  }
  return Response.json({ hello: who.email });
}
```

### Sign out

```ts
// e.g. app/api/signout/route.ts
export async function GET() {
  return gate.signOutResponse("/"); // clears the POCX cookie, 307 → "/"
}
```

## Options

All options fall back to environment variables:

| Option        | Env var             | Default          | Purpose |
| ------------- | ------------------- | ---------------- | ------- |
| `url`         | `POCX_URL`          | — (required)     | Your POCX instance origin, e.g. `https://pocx.example.com`. |
| `projectKey`  | `POCX_PROJECT_KEY`  | — (required)     | The PoC's public key (`pocx_pk_…`), sent as `x-pocx-key`. |
| `secret`      | `POCX_SECRET`       | — (required)     | The PoC's secret (`pocx_sk_…`). Authenticates SDK↔POCX calls **and** verifies session tokens. Server-side only. |
| `cookieName`  | —                   | `"pocx_session"` | Name of the HttpOnly session cookie. |
| `publicPaths` | —                   | `[]`             | Path prefixes that bypass the gate (e.g. `["/health", "/api/webhooks"]`). |
| `logEvents`   | `POCX_LOG_EVENTS`   | `false`          | Stream `page_view` events (fire-and-forget) to the POCX audit trail. |

`createPocxGate()` throws immediately if `url`, `projectKey` or `secret`
cannot be resolved — misconfiguration fails at boot, not at request time.

## How the flow works

1. **Unauthenticated request** → the SDK issues a 307 to your hosted gate:
   `{gateUrl}?return_to={the URL the visitor wanted}`. API/JSON requests get
   a `401 {"error":"POCX authentication required"}` instead of a redirect.
2. **The gate** signs the evaluator in (email OTP against the allowlist),
   collects an e-signature on the Terms of Access, then redirects back to
   your app's callback with a **single-use, 2-minute grant**:
   `{callbackPath}?pocx_grant=…&next=/where/they/were/going`.
3. **Exchange** — the SDK swaps the grant server-to-server
   (`POST /api/v1/exchange`, authenticated with your secret) for a signed
   HS256 session token. A leaked grant without the secret is worthless; the
   session token never travels through a URL.
4. **Cookie** — the token is set as `HttpOnly; SameSite=Lax; Secure`
   (Secure on https), expiring with the gate session.
5. **Every request** — the SDK verifies the token locally with
   `crypto.subtle` (no network round-trip) and revalidates the session with
   POCX at most **once per 60 seconds per session**, so revocations,
   evaluator disables, PoC pauses and terms-version bumps all take effect
   within a minute.

## Security notes

- `POCX_SECRET` must never reach a browser. The SDK only runs server-side
  (proxy/middleware); keep it that way.
- Fail-closed: if the SDK has never been able to fetch its config, it
  serves a 503 rather than exposing the app.
- Fail-open only for transient revalidation blips: if `POST /validate`
  errors on the network while the JWT is still cryptographically valid and
  unexpired, the previous verdict stands (and a `console.warn` is logged).
  An explicit `valid:false` always signs the visitor out and clears the
  cookie.
- Redirect targets are sanitized: the `next` param must be a same-origin
  absolute path (`/x`, never `//evil.com`).
- The config response is cached for 5 minutes (stale-on-error), so a brief
  POCX outage does not take your app down once it has booted.

## Troubleshooting

- **Redirect loop between app and gate** — the PoC's *App URL* /
  *Callback path* in the POCX dashboard must match where your app actually
  runs, and the callback path must be reachable (not excluded by your
  `matcher` / not in `publicPaths`).
- **401 from `/api/v1/*`** — key pair mismatch. `curl -H "x-pocx-key: $POCX_PROJECT_KEY" -H "Authorization: Bearer $POCX_SECRET" $POCX_URL/api/v1/config`
  is the integration smoke test: a 200 proves the credentials.
- **`createPocxGate: missing required option(s)`** — the env vars aren't
  visible to the runtime that executes the proxy/middleware (check
  `.env.local` for Next, your process manager for Express).
- **Signed in but immediately bounced back to the gate** — session revoked,
  evaluator disabled, PoC paused, or the Terms version was bumped (the
  evaluator must re-sign). Check the audit trail in the dashboard;
  `validate` reasons: `revoked`, `expired`, `idle`, `poc_paused`,
  `evaluator_disabled`, `terms_outdated`.
- **Works locally, loops behind a proxy** — make sure your proxy forwards
  `x-forwarded-proto` and `x-forwarded-host`; the SDK uses them to build
  `return_to` and the Secure cookie flag.
