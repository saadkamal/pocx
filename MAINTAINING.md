# Maintaining POCX — the open-core playbook

POCX runs the Supabase-style model: the product is open source, the
business is the hosted service at pocx.dev. This document is the operating
manual for keeping that healthy with minimal overhead. It is written for a
solo maintainer and optimized for one thing: **never maintaining two
diverging codebases.**

## 1. The golden rule: one source of truth

**This public repo contains 100% of the product code.** The hosted cloud
deploys *this repo, unmodified*, plus private configuration:

```
┌────────────────────────────┐      ┌──────────────────────────────┐
│  github.com/…/pocx (open)  │      │  pocx-cloud (private, thin)  │
│  the ENTIRE product        │─────▶│  env vars & secrets           │
│  gate, dashboard, SDK,     │ tag  │  Railway/infra config         │
│  billing code, docs        │      │  ops runbooks                 │
└────────────────────────────┘      └──────────────────────────────┘
```

There is deliberately **no private fork of the code**. "Closed source" in
POCX means: the production environment (API keys, Stripe keys, the
database, the pocx.dev domain) — not hidden features. Billing code ships
in the open repo but is inert without Stripe keys; that is fine. The moat
is convenience, deliverability, and trust — not secret code.

Consequences:
- A bug fix lands **once**, on `main`, and reaches both self-hosters and
  the cloud. There is no "porting."
- "Sync between the codebases" is a non-problem by construction. Protect
  this property fiercely: every time you're tempted to patch something
  "just in production," stop and land it on `main` instead.

## 2. If a truly closed feature ever becomes necessary

Don't fork. Use the `ee/` pattern (GitLab, Cal.com, n8n):

- Put commercial-only code in `service/ee/` with its own commercial
  LICENSE file at `service/ee/LICENSE`.
- Gate it behind an env flag (e.g. `POCX_EE=true`) so the open build
  simply never loads it. The repo stays public — the *license* of that
  directory differs, not its visibility.
- Keep `ee/` small. If most new value lands in `ee/`, the open project
  dies and with it the competitive deterrence that motivated open-sourcing.

As of today `ee/` does not exist and nothing requires it.

## 3. Licenses (and why)

| Component | License | Rationale |
|---|---|---|
| `service/` + repo | **AGPL-3.0** | Free self-hosting; but anyone offering a *modified* POCX as a service must open their modifications. This is the anti-competitor license — it makes "take the code and sell it against you" commercially unattractive. |
| `sdk/` (+ `/sdk/pocx.ts`) | **MIT** | It gets vendored into customers' apps; copyleft here would poison adoption. |
| "POCX" name & logo | Trademark (see NOTICE) | AGPL permits code reuse; the trademark stops a competitor from *calling* it POCX or trading on the brand. |

If AGPL ever feels too restrictive for growth, the escalation path is a
source-available license (FSL/BUSL) — but that is a one-way door away from
"real" open source; don't take it casually.

## 4. Contributions from strangers

- **DCO, not CLA, to start.** Contributors sign off commits
  (`git commit -s`); low friction, standard. Enabled via the PR template.
- Understand the tradeoff you're accepting: without a CLA, external
  contributions are AGPL-licensed by their authors, which means you
  **cannot later relicense the project or sell license exceptions** for
  code you didn't write. If selling commercial licenses ever becomes part
  of the business, add a CLA bot *before* accepting significant external
  code, or keep external contributions to `sdk/` and docs.
- You are the sole maintainer and final reviewer. Merge nothing you
  wouldn't be happy to run on pocx.dev an hour later — because you will.

## 5. Release & deploy flow

```
feature/fix branch → PR → CI green (typecheck + tests + build) → merge to main
                                             │
                     tag vX.Y.Z + CHANGELOG entry (weekly-ish, or on demand)
                                             │
                cloud deploy:  railway up from the tagged commit
```

- **Semver:** patch = fixes, minor = features, major = breaking changes to
  the SDK contract or self-host setup.
- **CHANGELOG.md** is user-facing: every entry answers "what does a
  self-hoster or cloud customer notice?"
- The cloud must never run untagged code for more than a day. If you
  hot-fixed production, tag it.
- DB migrations: additive-only (the codebase's attempt-and-ignore ALTER
  pattern). Self-hosters upgrade by pulling + restarting; never require
  manual migration steps without a loud CHANGELOG warning.

## 6. Bug fix / feature decision table

| Situation | Where it lands |
|---|---|
| Bug in gate/dashboard/SDK/docs | Public `main`, then deploy cloud from the tag |
| Security vulnerability | Private GitHub security advisory → fix on a private fork of the advisory → release + deploy cloud **before** publishing the advisory (see SECURITY.md) |
| New product feature | Public `main`. Default to open. |
| Feature that only makes sense hosted (billing tweaks, quotas, abuse tooling) | Still public `main` — it's inert without cloud env. Only genuinely secret sauce → `ee/` |
| Infra/ops change (Railway, domains, keys) | `pocx-cloud` private repo only |
| Community PR | Review, require DCO sign-off + CI green, merge to `main` |

## 7. Cadence that won't burn you out

- **Issues:** triage twice a week. Labels: `bug`, `feature`,
  `self-hosting`, `good first issue`, `wontfix`.
- **Security reports:** respond within 48h (SECURITY.md promises this).
- **Releases:** batch to weekly unless something is on fire.
- Say no often. A small, sharp, well-maintained tool beats a sprawling
  half-maintained one — and "small and sharp" is also the best competition
  deterrent, which is the whole point.

## 8. Go-public checklist (when flipping the repo to public)

- [ ] `git log` contains no secrets (keys live only in Railway/`.env.local`, both git-ignored — verified at repo creation)
- [ ] LICENSE / NOTICE / sdk/LICENSE present
- [ ] CI green on main
- [ ] README self-host quickstart actually works from a fresh clone
- [ ] GitHub: enable private vulnerability reporting, discussions (optional), branch protection on `main` (require CI)
- [ ] Flip repo visibility → public; announce.
