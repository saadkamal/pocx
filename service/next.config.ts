import type { NextConfig } from "next";

/**
 * Content-Security-Policy. POCX is self-contained: it serves its own
 * scripts, styles, fonts and images and calls no third-party host at
 * runtime, so every fetch directive is same-origin. The sole off-origin
 * allowance is `form-action` for Stripe Checkout/Billing, which the
 * browser navigates to on upgrade.
 *
 * Next injects inline bootstrap scripts/styles, so 'unsafe-inline' is
 * required for script/style (a nonce pipeline is the future upgrade).
 * `frame-ancestors 'none'` is the modern clickjacking control and protects
 * the signature-bearing gate + the admin console.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
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
