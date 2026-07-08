import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifySvixSignature } from "@/lib/mail/inbound";

// Svix scheme (Resend webhooks): HMAC-SHA256 over `${id}.${ts}.${payload}`
// keyed with the base64-decoded secret after `whsec_`, base64-encoded.
const RAW_KEY = Buffer.from("pocx-inbound-test-key-32-bytes!!", "utf8");
const SECRET = `whsec_${RAW_KEY.toString("base64")}`;

function sig(payload: string, id: string, tSec: number): string {
  const mac = createHmac("sha256", RAW_KEY)
    .update(`${id}.${tSec}.${payload}`)
    .digest("base64");
  return `v1,${mac}`;
}

describe("resend inbound webhook signature", () => {
  const payload = JSON.stringify({ type: "email.received" });
  const id = "msg_2yzXKGi5eNZvuVaOMuHFGr";
  const now = Date.now();
  const nowSec = Math.floor(now / 1000);
  const headers = (signature: string, tSec = nowSec) => ({
    id,
    timestamp: String(tSec),
    signature,
  });

  it("accepts a valid signature", () => {
    expect(
      verifySvixSignature(payload, headers(sig(payload, id, nowSec)), SECRET, 300, now),
    ).toBe(true);
  });

  it("accepts a valid v1 entry among several space-separated entries", () => {
    const multi = `v2,bogus ${sig(payload, id, nowSec)} v1,alsobogus`;
    expect(
      verifySvixSignature(payload, headers(multi), SECRET, 300, now),
    ).toBe(true);
  });

  it("rejects a tampered payload", () => {
    expect(
      verifySvixSignature(
        payload.replace("received", "hacked"),
        headers(sig(payload, id, nowSec)),
        SECRET,
        300,
        now,
      ),
    ).toBe(false);
  });

  it("rejects a signature made with a different key", () => {
    const other = `whsec_${Buffer.from("some-other-key-entirely-here!!!!").toString("base64")}`;
    expect(
      verifySvixSignature(payload, headers(sig(payload, id, nowSec)), other, 300, now),
    ).toBe(false);
  });

  it("rejects a stale timestamp (replay)", () => {
    const stale = nowSec - 3600;
    expect(
      verifySvixSignature(
        payload,
        headers(sig(payload, id, stale), stale),
        SECRET,
        300,
        now,
      ),
    ).toBe(false);
  });

  it("rejects missing headers", () => {
    expect(
      verifySvixSignature(
        payload,
        { id: null, timestamp: String(nowSec), signature: sig(payload, id, nowSec) },
        SECRET,
        300,
        now,
      ),
    ).toBe(false);
  });
});
