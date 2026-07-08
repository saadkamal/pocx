# Changelog

All notable changes to POCX. Semver: patch = fixes, minor = features,
major = breaking changes to the SDK contract or self-host setup.

## [0.2.0] — 2026-07-08

Full subscription billing.

- Annual plan: Pro is now US$39/month **or US$320/year** (~32% off) —
  interval toggle on the billing page and at checkout
- Subscription lifecycle done right: cancel keeps Pro until the end of the
  paid period (with one-click resume), monthly→yearly switching is
  prorated and invoiced immediately
- Retention offer: monthly cancellers are offered 50% off for 3 months,
  once per workspace
- Stripe Billing Portal integration: invoices, receipts and payment-method
  management ("Manage billing & invoices")
- Webhooks now sync the full lifecycle (`checkout.session.completed`,
  `customer.subscription.updated`/`.deleted`, `invoice.payment_failed`)
- Upgrade nudges: seat-usage banner on Evaluators as the free cap nears,
  lock badge on the Audit tab for free workspaces
- New workspace columns: `billing_interval`, `cancel_at_period_end`,
  `current_period_end`, `retention_offer_redeemed_at` (auto-migrated)
- New env: `STRIPE_PRICE_ID_PRO_YEARLY`, `STRIPE_RETENTION_COUPON_ID`

## [0.1.0] — 2026-07-08

First public cut. Everything below ships working out of the box, fully
offline-capable (mock email + demo billing when keys are absent).

- Hosted evaluator gates per PoC: allowlist + 6-digit email OTP (hashed,
  single-use, rate-limited, 5-attempt lockout), branded per PoC
- Terms of Access: protective template with placeholders or fully custom
  text; version bumps force re-acceptance; e-signature evidence
  (timestamp, IP, UA, SHA-256 of exact text) + signed PDF emailed
- Session control: TTL + idle timeout, per-session and revoke-all;
  revocations reach protected apps within ~60s
- Zero-dependency single-file SDK (MIT): Next.js 12–16, Express, edge-safe;
  single-use 2-minute grants exchanged server-side for HS256 tokens
- Dashboard: PoCs, evaluators (+ invitation emails), sessions, signatures,
  audit trail (Pro) with CSV export, mock-email inbox, terms editor,
  settings, workspace team management, onboarding checklist
- Plans: Free (3 evaluator seats/PoC) · Pro US$39/mo (unlimited seats +
  audit trail); Stripe or demo mode
- i18n: English (default) + Japanese, auto-detected with manual override
- Coding-agent native: /llms.txt + /sdk/pocx.ts
