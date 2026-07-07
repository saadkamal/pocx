import "server-only";

/**
 * In-memory sliding-window rate limiter. PoC-grade by design: state resets
 * on redeploy/restart, which is acceptable for the audience sizes POCX
 * serves. Swap for Redis when horizontal scaling arrives.
 */

const WINDOW_MS = 15 * 60_000;

const buckets = new Map<string, number[]>();

/** Record a hit for `key`; returns false when the window limit is exceeded. */
export function allowHit(key: string, limit: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);

  // Opportunistic cleanup so the map can't grow unbounded.
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= WINDOW_MS)) buckets.delete(k);
    }
  }
  return true;
}

// Per-email is deliberately roomy: evaluators legitimately re-request when
// an email is slow or missed; the IP cap still bounds abuse.
export const OTP_REQUEST_LIMIT_PER_EMAIL = 8;
export const OTP_REQUEST_LIMIT_PER_IP = 20;
export const OTP_VERIFY_LIMIT_PER_IP = 30;
export const EXCHANGE_LIMIT_PER_IP = 60;
