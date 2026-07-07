# Security policy

POCX is an access-control product; we treat vulnerability reports as the
highest-priority work.

## Reporting

- **Do not** open a public issue for security problems.
- Use GitHub's private vulnerability reporting on this repository, or
  email **security@pocx.dev**.
- You'll get a first response within **48 hours**.

## Scope

Anything that breaks the product's promises, e.g.:
- Bypassing the gate (session forgery, OTP brute force, grant replay,
  open redirects via `return_to`)
- Cross-tenant access in the dashboard or API (`/api/v1`, server actions)
- Forging or tampering with terms-acceptance evidence
- Secret/key disclosure

## Process

1. Report received → acknowledged within 48h.
2. Fix developed privately; cloud (pocx.dev) is patched **before** any
   public disclosure.
3. A patched release is tagged for self-hosters with a CHANGELOG entry;
   the advisory is published after a reasonable upgrade window.

Thank you for reporting responsibly.
