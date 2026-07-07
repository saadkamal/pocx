import { describe, expect, it } from "vitest";
import {
  sealSessionCookie,
  unsealSessionCookie,
} from "@/lib/auth/session";
import { newSessionId } from "@/lib/ids";

describe("signed session cookie", () => {
  it("round-trips seal → unseal", () => {
    const id = newSessionId();
    expect(unsealSessionCookie(sealSessionCookie(id))).toBe(id);
  });

  it("rejects tampered ids", () => {
    const sealed = sealSessionCookie(newSessionId());
    const other = newSessionId();
    const [, mac] = [sealed.slice(0, sealed.lastIndexOf(".")), sealed.slice(sealed.lastIndexOf(".") + 1)];
    expect(unsealSessionCookie(`${other}.${mac}`)).toBeNull();
  });

  it("rejects malformed values", () => {
    expect(unsealSessionCookie(undefined)).toBeNull();
    expect(unsealSessionCookie("")).toBeNull();
    expect(unsealSessionCookie("garbage")).toBeNull();
    expect(unsealSessionCookie("sess_short.abcd")).toBeNull();
  });
});
