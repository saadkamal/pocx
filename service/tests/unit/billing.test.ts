import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyStripeSignature } from "@/lib/billing";

const SECRET = "whsec_test_secret";

function sig(payload: string, tSec: number): string {
  const mac = createHmac("sha256", SECRET)
    .update(`${tSec}.${payload}`)
    .digest("hex");
  return `t=${tSec},v1=${mac}`;
}

describe("stripe webhook signature", () => {
  const payload = JSON.stringify({ type: "checkout.session.completed" });
  const now = Date.now();
  const nowSec = Math.floor(now / 1000);

  it("accepts a valid signature", () => {
    expect(
      verifyStripeSignature(payload, sig(payload, nowSec), SECRET, 300, now),
    ).toBe(true);
  });

  it("rejects a tampered payload", () => {
    expect(
      verifyStripeSignature(
        payload.replace("completed", "hacked"),
        sig(payload, nowSec),
        SECRET,
        300,
        now,
      ),
    ).toBe(false);
  });

  it("rejects the wrong secret", () => {
    const mac = createHmac("sha256", "other")
      .update(`${nowSec}.${payload}`)
      .digest("hex");
    expect(
      verifyStripeSignature(payload, `t=${nowSec},v1=${mac}`, SECRET, 300, now),
    ).toBe(false);
  });

  it("rejects stale timestamps (replay window)", () => {
    const old = nowSec - 3600;
    expect(
      verifyStripeSignature(payload, sig(payload, old), SECRET, 300, now),
    ).toBe(false);
  });

  it("rejects missing/malformed headers", () => {
    expect(verifyStripeSignature(payload, null, SECRET)).toBe(false);
    expect(verifyStripeSignature(payload, "t=,v1=", SECRET)).toBe(false);
    expect(verifyStripeSignature(payload, "nonsense", SECRET)).toBe(false);
  });
});
