import { describe, expect, it } from "vitest";
import {
  generateOtpCode,
  hashOtp,
  normalizeEmail,
  verifyOtpHash,
} from "@/lib/auth/otp";

describe("OTP", () => {
  it("generates 6-digit zero-padded codes", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateOtpCode()).toMatch(/^\d{6}$/);
    }
  });

  it("verifies a code against its stored hash", () => {
    const code = generateOtpCode();
    expect(verifyOtpHash(code, hashOtp(code))).toBe(true);
  });

  it("rejects the wrong code", () => {
    expect(verifyOtpHash("000000", hashOtp("123456"))).toBe(false);
  });

  it("never stores plaintext (hash is sha256 hex)", () => {
    expect(hashOtp("123456")).toMatch(/^[0-9a-f]{64}$/);
    expect(hashOtp("123456")).not.toContain("123456");
  });

  it("normalizes emails", () => {
    expect(normalizeEmail("  Jane.Doe@Client.COM ")).toBe("jane.doe@client.com");
  });
});
