# Changelog

All notable changes to POCX. Semver: patch = fixes, minor = features,
major = breaking changes to the SDK contract or self-host setup.

## [0.3.2] — 2026-07-09

Company, legal and support plumbing.

- **Haxo Pty Ltd** is now credited as the company that owns
  and operates POCX and the hosted service at pocx.dev; Saad Kamal
  remains the author/maintainer (NOTICE, README, footer, package
  metadata)
- **Terms of Service** (`/terms`) and **Privacy Policy** (`/privacy`)
  pages in both locales, linked from the marketing footer, the signup
  form, the hosted-gate footer and `/llms.txt`
- **Inbound support email**: new `email.received` webhook endpoint
  (`/api/inbound/resend`) that verifies the Svix signature, pulls the
  full message + attachments from Resend's Received-emails API and
  forwards everything to `POCX_SUPPORT_INBOX` (default pocx@haxo.com.au)
  with Reply-To preserved — this powers support@pocx.dev; see
  `.env.example` (`RESEND_INBOUND_WEBHOOK_SECRET`)
- `sendMail` supports a `replyTo` header
- Dashboard Support tab and CONTRIBUTING/SECURITY now point at
  pocx@haxo.com.au

## [0.3.1] — 2026-07-09

Friendlier nudges, editable email copy, and a security-audit hardening pass.

- **Nudge emails rewritten** in a warm, first-person founder voice with a
  proper greeting ("Hi {first name}," → "Hi there," when unknown) and a
  sign-off
- **Editable email copy** at `/admin/settings`: edit every nudge's subject
  and body plus your signature, with `{{placeholders}}`, live preview,
  reset-to-default and send-a-test-to-myself
- Security hardening (full audit — no cross-tenant issues found):
  - `POCX_SESSION_SECRET` is now mandatory in production (fail closed,
    never fall back to a public key)
  - HTML-escape all user-controlled values in outbound emails
  - Content-Security-Policy added; `frame-ancestors 'none'` +
    `X-Frame-Options: DENY` on every route (protects the gate + console)
  - CSV audit export neutralizes spreadsheet formula injection
  - Robuster Stripe webhook signature-header parsing
- New table `admin_settings`

## [0.3.0] — 2026-07-09

The owner operations console + customer support.

- **Ops console** at `/admin` — its own OTP realm, allowlisted via
  `POCX_ADMIN_EMAILS` (probing it returns a uniform response and is
  audit-logged)
- **Overview**: workspaces, Pro subscriptions, approximate MRR, PoCs,
  evaluators, signatures, live sessions, open tickets, 14-day signup
  chart, payment failures, platform activity stream
- **Onboarding funnel**: every workspace classified (no PoC → no
  evaluators → not connected → no logins → active → dormant) with
  days-stuck and one-click stage-appropriate nudge emails (7-day cooldown)
- **Workspace drill-down**: billing state, operators, PoCs, activity,
  outbound emails, comp-Pro support gesture (guarded against live Stripe
  subscriptions)
- **Support tickets**: customers file and reply from the dashboard's new
  Support tab (en/ja); admins triage, reply and close from the console;
  email notifications both directions
- New tables `tickets`/`ticket_messages`; new env `POCX_ADMIN_EMAILS`

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
