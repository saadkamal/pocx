# POCX — repo guide for coding agents

POCX is a standalone product: a hosted access layer that protects
proof-of-concept apps with an allowlisted email-OTP gate, e-signed Terms of
Access, revocable sessions and an audit trail.

Examples in UI copy, placeholders, docs and tests use a fictional vanilla
cast only — "Project Falcon" (the PoC), "Acme Pte Ltd" (the builder),
"Globex Corporation" (the client). Never reference real client names or
past engagements in product surfaces.

## Layout

- `service/` — the POCX SaaS itself. Next.js 16 (App Router), React 19,
  Tailwind v4, SQLite via better-sqlite3 + Drizzle (schema auto-created on
  boot, no migration step). Marketing site, operator dashboard, hosted
  gates (`/gate/[slug]`), the SDK API (`/api/v1/*`) and `/llms.txt`.
- `sdk/` — the `pocx` client package. One zero-dependency TypeScript file
  (`src/pocx.ts`, Web APIs only — runs on Node *and* edge). The service
  serves a copy at `/sdk/pocx.ts`; keep them in sync with
  `npm run sync-sdk` (run inside `service/`).
- `examples/next-app/` — illustrative integration (not built in CI).

## Next.js 16 gotchas (this is NOT the Next you remember)

- `middleware.ts` is now `proxy.ts` (Node runtime; exports `proxy`).
- `params` / `searchParams` are **Promises** — `const { slug } = await params`.
- `cookies()` from `next/headers` is async.
- When in doubt read `service/node_modules/next/dist/docs/`.

## i18n (en + ja)

- All pages live under `app/[locale]/`; English is served at unprefixed
  URLs (the proxy rewrites to `/en/...` internally), Japanese at `/ja/...`.
  `proxy.ts` auto-redirects browsers whose Accept-Language prefers ja on
  full-page GETs; the `pocx_locale` cookie (set by the manual switcher in
  `components/locale-switcher.tsx`) always wins over detection.
- String tables live in `lib/i18n/*.ts` (`marketingDict`, `gateDict`,
  `dashboardDict`) — `en` is the typed source of truth; `ja` must satisfy
  `typeof en`. Long-form pages (docs/tutorials/faq) use parallel
  `content-en.tsx` / `content-ja.tsx` files sharing a `primitives.tsx`.
- Internal links in localized pages go through `localePath(locale, path)`;
  `/api/*`, `/llms.txt`, `/sdk/*` are locale-exempt and unprefixed.
- Gate API routes + evaluator emails localize per request via
  `gateRequestLocale(req)`. Server-action result messages and audit data
  are intentionally English.

## Working on the service

```bash
cd service
npm install
npm run typecheck   # tsc --noEmit
npm test            # vitest unit tests (tests/unit)
npm run build       # must stay green
```

- All DB access goes through `lib/db/repo.ts`; plan limits through
  `lib/plans.ts`; dashboard mutations are server actions in
  `app/dashboard/actions.ts` (every action re-authenticates and re-proves
  PoC ownership — keep it that way).
- Email: real via `RESEND_API_KEY`, otherwise mock (rows in
  `outbound_emails`, OTP codes printed to the server console).
- Billing: real via Stripe env vars, otherwise instant demo upgrades.
- Do not weaken: OTP hashing, single-use grants, HMAC-sealed cookies,
  `safeReturnTo` origin checks, or server-side plan enforcement.

## Changing the SDK

Edit `sdk/src/pocx.ts` only, then run `cd service && npm run sync-sdk`.
Never let `service/public/sdk/pocx.ts` drift — customers curl that URL.
The SDK must keep working without npm dependencies and without `node:`
imports (edge compatibility).
