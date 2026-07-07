import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal HS256 JWT — sign & verify with zero dependencies. This is the
 * token the hosted gate mints for a customer app after a successful grant
 * exchange; the SDK verifies it locally with the PoC secret on every
 * request (no network round-trip).
 *
 * Claims: iss "pocx", sub <evaluator email>, poc <slug>, sid <gate session
 * id>, tv <terms version accepted>, iat, exp (gate-session expiry).
 */

export type PocxClaims = {
  iss: "pocx";
  sub: string;
  poc: string;
  sid: string;
  tv: string;
  iat: number;
  exp: number;
};

const b64url = (buf: Buffer) =>
  buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromB64url = (s: string) =>
  Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

export function signJwt(
  claims: Omit<PocxClaims, "iss" | "iat">,
  secret: string,
  nowMs = Date.now(),
): string {
  const header = b64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = b64url(
    Buffer.from(
      JSON.stringify({ iss: "pocx", iat: Math.floor(nowMs / 1000), ...claims }),
    ),
  );
  const mac = createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest();
  return `${header}.${payload}.${b64url(mac)}`;
}

export type JwtCheck =
  | { ok: true; claims: PocxClaims }
  | { ok: false; reason: "malformed" | "bad_sig" | "expired" };

export function verifyJwt(
  token: string,
  secret: string,
  nowMs = Date.now(),
): JwtCheck {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [header, payload, sig] = parts;

  const expected = createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest();
  const supplied = fromB64url(sig);
  if (
    expected.length !== supplied.length ||
    !timingSafeEqual(expected, supplied)
  ) {
    return { ok: false, reason: "bad_sig" };
  }

  let claims: PocxClaims;
  try {
    claims = JSON.parse(fromB64url(payload).toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (claims.iss !== "pocx" || typeof claims.exp !== "number") {
    return { ok: false, reason: "malformed" };
  }
  if (nowMs / 1000 > claims.exp) return { ok: false, reason: "expired" };
  return { ok: true, claims };
}
