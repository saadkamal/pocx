import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSessionRow, touchSession } from "@/lib/db/repo";
import type { SessionRow } from "@/lib/db/schema";

/**
 * Session helpers for POCX's own cookies.
 *
 * Cookie value = `${sessionId}.${hmac}` — the HMAC rejects tampered or
 * garbage cookies before touching the DB. Validity is then checked against
 * the `sessions` table (revocable), with two clocks: absolute TTL and idle
 * timeout. Two realms share the machinery:
 *   - operator  → the POCX dashboard   (cookie: pocx_op)
 *   - gate      → a hosted PoC gate    (cookie: pocx_gate_<slug>)
 */

export const OPERATOR_COOKIE = "pocx_op";
export const gateCookieName = (slug: string) => `pocx_gate_${slug}`;

export const OPERATOR_TTL_HOURS = Number(
  process.env.POCX_DEFAULT_SESSION_TTL_HOURS ?? 24,
);
export const OPERATOR_IDLE_HOURS = Number(
  process.env.POCX_DEFAULT_IDLE_TIMEOUT_HOURS ?? 6,
);

export type SessionKind = "operator" | "gate";

/** Throttle last-active writes: at most one per this many ms per session. */
const TOUCH_INTERVAL_MS = 60_000;

function secret(): string {
  const s = process.env.POCX_SESSION_SECRET;
  if (!s && process.env.NODE_ENV === "production") {
    console.warn(
      "[pocx] POCX_SESSION_SECRET is not set — using dev fallback key.",
    );
  }
  return s || "dev-only-insecure-pocx-secret";
}

function sign(id: string): string {
  return createHmac("sha256", secret()).update(id).digest("hex").slice(0, 32);
}

/** Build the signed cookie value for a session id. */
export function sealSessionCookie(id: string): string {
  return `${id}.${sign(id)}`;
}

/** Verify cookie shape + HMAC; returns the session id or null. Cheap — no DB. */
export function unsealSessionCookie(value: string | undefined): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  if (!/^sess_[0-9a-f]{48}$/.test(id) || mac.length !== 32) return null;
  const expected = Buffer.from(sign(id), "utf8");
  const supplied = Buffer.from(mac, "utf8");
  if (expected.length !== supplied.length) return null;
  return timingSafeEqual(expected, supplied) ? id : null;
}

export type SessionFailReason =
  | "missing"
  | "bad_sig"
  | "no_row"
  | "wrong_kind"
  | "wrong_poc"
  | "revoked"
  | "expired"
  | "idle";

export type SessionCheck =
  | { ok: true; session: SessionRow }
  | { ok: false; reason: SessionFailReason };

/**
 * Authoritative session check (DB): realm, revocation, absolute TTL, idle
 * timeout. For gate sessions pass the poc id + its configured idle timeout.
 * Touches `last_active_at` (throttled) on success.
 */
export function checkSession(
  cookieValue: string | undefined,
  expected: { kind: SessionKind; pocId?: string; idleHours?: number },
): SessionCheck {
  const id = unsealSessionCookie(cookieValue);
  if (!id) return { ok: false, reason: cookieValue ? "bad_sig" : "missing" };

  const session = getSessionRow(id);
  if (!session) return { ok: false, reason: "no_row" };
  if (session.kind !== expected.kind) return { ok: false, reason: "wrong_kind" };
  if (expected.pocId && session.pocId !== expected.pocId)
    return { ok: false, reason: "wrong_poc" };
  if (session.revokedAt) return { ok: false, reason: "revoked" };

  const now = Date.now();
  if (now > session.expiresAt.getTime()) return { ok: false, reason: "expired" };

  const idleHours =
    expected.idleHours ??
    (expected.kind === "operator" ? OPERATOR_IDLE_HOURS : 3);
  const sinceActive = now - session.lastActiveAt.getTime();
  if (sinceActive > idleHours * 3_600_000) return { ok: false, reason: "idle" };

  if (sinceActive > TOUCH_INTERVAL_MS) touchSession(id);
  return { ok: true, session };
}

/** Cookie attributes (maxAge covers the absolute TTL; idle is server-side). */
export function sessionCookieOptions(ttlHours: number) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ttlHours * 3600,
  };
}

/** Extract client IP (first x-forwarded-for value behind a proxy). */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
