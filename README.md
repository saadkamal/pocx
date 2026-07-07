# POCX — the access layer for your proof of concept

**Open source (AGPL-3.0) · Cloud at [pocx.dev](https://pocx.dev) · SDK is MIT**

You built a PoC for a client. It embodies your ideas, your workflows, your
IP — and it's about to be opened by people you've never met. **POCX puts a
gate in front of it**: only invited evaluators get in, everyone e-signs
your Terms of Access before seeing a single screen, and every access
decision is on the record.

Battle-tested in a real client engagement and productized — multi-tenant,
fully customizable and integrable into any app in minutes.

## Cloud or self-host — same code

This repository is the **entire product** (Supabase-style open core —
there is no hidden enterprise fork; see [MAINTAINING.md](MAINTAINING.md)):

- ☁️ **[pocx.dev](https://pocx.dev)** — the hosted service. Zero ops,
  production email deliverability, free for 3 evaluator seats per PoC,
  Pro at US$39/mo. This is how you support the project.
- 🏠 **Self-host** — run this repo yourself, free, all features (plan
  limits only apply on the cloud). One Node process + one SQLite file.
  See [Run it](#run-it) below; you'll want `POCX_ORIGIN`,
  `POCX_SESSION_SECRET` and a Resend key for real email.

## What a protected PoC gets

| | |
|---|---|
| 🔐 **Allowlist + OTP login** | Evaluators sign in with a 6-digit email code. Codes are hashed, single-use, rate-limited, and lock after 5 wrong attempts. No passwords exist to leak. |
| ✍️ **Terms of Access, e-signed** | Standard protective template (customizable per PoC — entity name, registration number, purpose, or fully custom text). Acceptance is recorded with timestamp, IP, user agent and a SHA-256 hash of the exact text shown, plus a signed PDF certificate emailed to the signer. |
| ⏱ **Session control** | Absolute TTL + idle timeout per PoC. Revoke any session (or all of them) from the dashboard — access dies on the next request, even inside the protected app. |
| 📜 **Audit trail** (Pro) | Every OTP request, denial, login, signature, revocation and in-app access event. CSV export. Recorded from day one on every plan; Pro unlocks the view. |
| 🎨 **Branded hosted gate** | Your entity name, PoC name and brand color on the login + terms pages. "Protected by POCX" is the only trace of us. |
| 🤖 **Coding-agent native** | `/llms.txt` + a single-file zero-dependency SDK. Paste one prompt into Claude Code / Codex and the integration is done. |

## Pricing

- **Free** — protect PoCs with up to 3 evaluator seats each. Gate, terms
  e-signature + PDF, session control included.
- **Pro — US$39 / workspace / month** — unlimited evaluator seats, full
  audit trail with CSV export, priority support.

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

1. Sign up at `/signup`, create a PoC, invite evaluator emails.
2. Copy the three env vars from the PoC's Overview page.
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

## License & author

Created and maintained by **Saad Kamal** ([saad@haxo.com.au](mailto:saad@haxo.com.au)).

- Service & repository: [AGPL-3.0](LICENSE) — self-host freely; if you
  offer a modified POCX as a service, your modifications must be open too.
- [`sdk/`](sdk) (and the file served at `/sdk/pocx.ts`): [MIT](sdk/LICENSE)
  — vendor it into any app, no strings attached.
- "POCX" is a trademark of the project (see [NOTICE](NOTICE)).

Contributions welcome — read [CONTRIBUTING.md](CONTRIBUTING.md) and
[MAINTAINING.md](MAINTAINING.md) first.
