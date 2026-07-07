# Changelog

All notable changes to POCX. Semver: patch = fixes, minor = features,
major = breaking changes to the SDK contract or self-host setup.

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
