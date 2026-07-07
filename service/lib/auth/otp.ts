import { createHash, timingSafeEqual } from "node:crypto";

/**
 * OTP helpers. Codes are 6-digit numeric, single-use, expiring; only the
 * SHA-256 hash is ever stored.
 */

export const OTP_TTL_MINUTES = Number(process.env.POCX_OTP_TTL_MINUTES ?? 10);
export const OTP_MAX_ATTEMPTS = 5;

/** Cryptographically random 6-digit code, zero-padded ("042917"). */
export function generateOtpCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0] % 1_000_000).padStart(6, "0");
}

export function hashOtp(code: string): string {
  return createHash("sha256").update(code, "utf8").digest("hex");
}

/** Constant-time comparison of a submitted code against the stored hash. */
export function verifyOtpHash(code: string, storedHash: string): boolean {
  const a = Buffer.from(hashOtp(code), "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
