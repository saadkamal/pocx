import { describe, expect, it } from "vitest";
import { signJwt, verifyJwt } from "@/lib/tokens/jwt";

const SECRET = "pocx_sk_test_secret_0123456789abcdef";

const claims = {
  sub: "jane@client.com",
  poc: "project-falcon",
  sid: "sess_abc",
  tv: "1.0",
  exp: Math.floor(Date.now() / 1000) + 3600,
};

describe("HS256 JWT", () => {
  it("round-trips sign → verify", () => {
    const token = signJwt(claims, SECRET);
    const check = verifyJwt(token, SECRET);
    expect(check.ok).toBe(true);
    if (check.ok) {
      expect(check.claims.sub).toBe("jane@client.com");
      expect(check.claims.poc).toBe("project-falcon");
      expect(check.claims.iss).toBe("pocx");
      expect(check.claims.iat).toBeGreaterThan(0);
    }
  });

  it("rejects a tampered payload", () => {
    const token = signJwt(claims, SECRET);
    const [h, p, s] = token.split(".");
    const forged = JSON.parse(
      Buffer.from(p.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(),
    );
    forged.sub = "attacker@evil.com";
    const forgedPayload = Buffer.from(JSON.stringify(forged))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const check = verifyJwt(`${h}.${forgedPayload}.${s}`, SECRET);
    expect(check).toEqual({ ok: false, reason: "bad_sig" });
  });

  it("rejects the wrong secret", () => {
    const token = signJwt(claims, SECRET);
    expect(verifyJwt(token, "other-secret")).toEqual({
      ok: false,
      reason: "bad_sig",
    });
  });

  it("rejects an expired token", () => {
    const token = signJwt({ ...claims, exp: Math.floor(Date.now() / 1000) - 10 }, SECRET);
    expect(verifyJwt(token, SECRET)).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects garbage", () => {
    expect(verifyJwt("not.a.jwt", SECRET).ok).toBe(false);
    expect(verifyJwt("", SECRET).ok).toBe(false);
    expect(verifyJwt("a.b", SECRET).ok).toBe(false);
  });
});
