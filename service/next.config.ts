import type { NextConfig } from "next";

/**
 * Content-Security-Policy. POCX is otherwise self-contained. Next injects
 * inline bootstrap scripts/styles, so 'unsafe-inline' is required for
 * script/style (a nonce pipeline is the future upgrade). `frame-ancestors
 * 'none'` is the modern clickjacking control and protects the
 * signature-bearing gate + the admin console.
 *
 * Third-party allowance: the MonGPT support-chat widget, loaded ONLY on the
 * marketing pages (see app/[locale]/(marketing)/layout.tsx). These two
 * exact origins are permitted here so the widget's script + API calls
 * aren't blocked; the CSP still admits nothing else cross-origin, and the
 * microphone stays disabled (chat only, no voice).
 */
const MONGPT_SCRIPT = "https://pub-914801c5a75d4f30b86c82306e07f5ea.r2.dev";
const MONGPT_API = "https://api.dev-mongpt.com";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${MONGPT_SCRIPT}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: ${MONGPT_SCRIPT} ${MONGPT_API}`,
  "font-src 'self' data:",
  `connect-src 'self' ${MONGPT_API} wss://api.dev-mongpt.com`,
  "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
