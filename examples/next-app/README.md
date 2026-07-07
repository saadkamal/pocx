# POCX example — Next.js 16 app

A minimal app protected by POCX. The whole integration is `proxy.ts`
(three lines) plus three environment variables. `lib/pocx.ts` re-exports
the SDK from this repo so the example always tracks `sdk/src/pocx.ts`; in
your own app you'd vendor the file instead:

```bash
curl -o lib/pocx.ts https://YOUR-POCX-HOST/sdk/pocx.ts
```

## Run it against a local POCX

1. **Start the POCX service** (in `../../service`):

   ```bash
   cd ../../service && npm install && npm run dev   # http://localhost:3000
   ```

2. **Create a PoC** in the dashboard (sign up at `http://localhost:3000`):
   - App URL: `http://localhost:4000`
   - Callback path: leave the default
   - Allowlist your own email address.

3. **Configure this app:**

   ```bash
   cp .env.example .env.local
   # paste the PoC's pocx_pk_… / pocx_sk_… from the Integration tab
   ```

4. **Run it:**

   ```bash
   npm install && npm run dev                       # http://localhost:4000
   ```

5. Open `http://localhost:4000` — you're bounced to the hosted gate, log
   in with the OTP (printed to the service console when no email provider
   is configured), e-sign the terms, and land back on the secret page.
   Revoke the session in the dashboard: the page locks again within 60s.

> Next.js ≤ 15: rename `proxy.ts` to `middleware.ts` — the SDK is
> edge-safe, nothing else changes.
