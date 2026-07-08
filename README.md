# POCX — protect the demos that win you clients

**Open source (AGPL-3.0) · Hosted at [pocx.dev](https://pocx.dev) · SDK is MIT**

Consultants, dev shops and founders win work by showing working demos —
and a screenshot of your prototype is all AI needs to rebuild it
overnight. You pitch; they paste it into a coding agent; by morning they
have a working copy and never needed you.

**POCX puts a gate on your demo.** Every viewer proves who they are with
an email code and e-signs your Terms of Access — including the clause
that matters: *if you build on this work, you engage us* — before they
see a single screen. A screenshot is no longer anonymous: it's tied to a
named person who agreed, in writing, not to build on your work without
you. Every signature is recorded with a SHA-256 hash of the exact terms
text, verified email, IP and timestamp, sealed in a PDF certificate.

Show the work. Keep the idea.

## ☁️ The easiest way to run POCX: [pocx.dev](https://pocx.dev)

The hosted service is the same code as this repo, run for you by the
people who build it:

- **Zero ops** — no server, no database, no email deliverability to
  babysit. Protecting your first demo takes about five minutes.
- **Free to start** — 3 viewer seats per demo, e-signed terms + PDF
  certificates, session control and instant revoke included. No card.
- **Pro at US$39/workspace/month** — unlimited viewer seats, full audit
  trail with CSV export, priority support.
- **It funds the project** — subscribing to the cloud is how this open
  source stays maintained.

→ **[Start free at pocx.dev](https://pocx.dev/signup)**

## 🏠 Or self-host — same code, every feature

This repository is the **entire product** (Supabase-style open core —
there is no hidden enterprise fork; see [MAINTAINING.md](MAINTAINING.md)).
Self-hosting is free forever, with no seat limits and no plan gates: one
Node process + one SQLite file. You'll want `POCX_ORIGIN`,
`POCX_SESSION_SECRET` and a Resend key for real email — see
[Run it](#run-it) below.

## What a protected demo gets

| | |
|---|---|
| 🔐 **Invite-only + email codes** | Viewers sign in with a 6-digit email code. Codes are hashed, single-use, rate-limited, and lock after 5 wrong attempts. No passwords exist to leak. |
| ✍️ **Terms of Access, e-signed** | Standard protective template (customizable per demo — entity name, purpose, or fully custom text). Acceptance recorded with timestamp, IP, user agent and a SHA-256 hash of the exact text shown, plus a signed PDF certificate emailed to the signer. |
| ⏱ **Session control** | Absolute TTL + idle timeout per demo. Revoke any session (or all of them) from the dashboard — access dies on the next request, even inside the protected app. |
| 📜 **Audit trail** (Pro) | Every code request, denial, login, signature, revocation and in-app access event. CSV export. Recorded from day one on every plan; Pro unlocks the view. |
| 🎨 **Branded hosted gate** | Your company name, demo name and brand color on the login + terms pages. "Protected by POCX" is the only trace of us. |
| 🤖 **Coding-agent native** | `/llms.txt` + a single-file zero-dependency SDK. Paste one prompt into Claude Code / Codex / Cursor and the integration is done. |

## Repo layout

```
POCX/
├── service/            the SaaS (Next.js 16 + SQLite) — marketing site,
│                       dashboard, hosted gates, /api/v1, /llms.txt
├── sdk/                the `pocx` client — one zero-dep TS file
└── examples/next-app/  minimal protected-app example
```

## Run it

```bash
cd service
npm install
npm run dev        # http://localhost:3000
```

Works fully offline out of the box: without `RESEND_API_KEY`, outbound
email (OTP codes, signed PDFs) lands in the dashboard's **Emails** tab and
codes are printed to the server console; without Stripe keys, plan
upgrades are instant demo upgrades. See `service/.env.example` for
production configuration (`POCX_ORIGIN`, `POCX_SESSION_SECRET`, Resend,
Stripe).

```bash
npm test           # unit tests (OTP, JWT, terms, plans, grants, webhooks)
npm run typecheck
npm run build
```

## Protect an app (customer view)

1. Sign up at [pocx.dev/signup](https://pocx.dev/signup) (or your own
   deployment), create a demo, invite viewer emails.
2. Copy the three env vars from the demo's Overview page.
3. `curl -o lib/pocx.ts <your-pocx-origin>/sdk/pocx.ts`
4. Next 16 `proxy.ts` (or ≤15 `middleware.ts`):

```ts
import { createPocxGate } from "./lib/pocx";
const gate = createPocxGate();
export const proxy = gate.nextProxy();
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
```

…or paste this into a coding agent:

> Add POCX protection to this app. Follow the instructions at
> `<your-pocx-origin>/llms.txt` exactly.

Auth then runs through POCX: unauthenticated visitors are redirected to
the hosted gate, sign in with OTP, e-sign the terms, and come back with a
short-lived single-use grant the SDK exchanges (server-to-server) for an
HS256 session token. Requests verify locally and revalidate against POCX
every 60 s, so revocations, pauses and terms bumps bite within a minute.

## Support

- 🐛 **Bugs & features** — open a [GitHub issue](https://github.com/saadkamal/pocx/issues)
  (see [CONTRIBUTING.md](CONTRIBUTING.md)).
- 🔒 **Security** — never the public tracker; see [SECURITY.md](SECURITY.md).
- ✉️ **Everything else** — **pocx@haxo.com.au**. Cloud customers can also
  open a ticket from the dashboard's Support tab.

## Company, license & author

POCX is created and maintained by **Saad Kamal**, and owned and operated
by **[Haxo Pty Ltd](mailto:pocx@haxo.com.au)** (Australia) — the company
behind the hosted service at [pocx.dev](https://pocx.dev)
([Terms](https://pocx.dev/terms) · [Privacy](https://pocx.dev/privacy)).

- Service & repository: [AGPL-3.0](LICENSE) — self-host freely; if you
  offer a modified POCX as a service, your modifications must be open too.
- [`sdk/`](sdk) (and the file served at `/sdk/pocx.ts`): [MIT](sdk/LICENSE)
  — vendor it into any app, no strings attached.
- "POCX" is a trademark of Haxo Pty Ltd (see [NOTICE](NOTICE)).

Contributions welcome — read [CONTRIBUTING.md](CONTRIBUTING.md) and
[MAINTAINING.md](MAINTAINING.md) first.
