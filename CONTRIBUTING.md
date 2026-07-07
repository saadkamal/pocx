# Contributing to POCX

Thanks for helping protect the people who build. A few ground rules keep
this easy for everyone.

## Before you start

- **Bugs**: open an issue with reproduction steps (self-hosted or cloud,
  browser, locale). Security issues go to SECURITY.md — never the public
  tracker.
- **Features**: open an issue first. POCX is deliberately small and sharp;
  features that grow the core get more scrutiny than fixes.

## Developing

```bash
cd service
npm install
npm run dev          # http://localhost:3000 — works fully offline
npm run typecheck    # must be clean
npm test             # must pass
npm run build        # must succeed
```

Without `RESEND_API_KEY`, OTP codes print to the server console and land
in the dashboard's Emails tab — you can exercise every flow locally.
Read `AGENTS.md` for architecture notes (Next 16 gotchas, i18n rules,
where things live).

## Pull requests

1. Branch from `main`; keep PRs focused (one fix/feature each).
2. CI (typecheck + tests + build) must be green.
3. UI strings must exist in **both** locales (`lib/i18n/*` — TypeScript
   enforces key parity; long-form pages have `content-en`/`content-ja`).
4. Never weaken the security invariants: OTP hashing, single-use grants,
   HMAC-sealed cookies, `safeReturnTo` origin checks, server-side plan
   enforcement, ownership re-checks in every server action.
5. Examples in copy/placeholders use the vanilla cast only (Project
   Falcon / Acme Pte Ltd / Globex Corporation) — no real company names.
6. **Sign off your commits** (`git commit -s`) to certify the
   [Developer Certificate of Origin](https://developercertificate.org/).

## Licensing of contributions

The service is AGPL-3.0 and the `sdk/` directory is MIT (see NOTICE). By
contributing you agree your contribution is licensed under the license of
the files you touch.
