import { describe, expect, it } from "vitest";
import { safeReturnTo } from "@/lib/gate";
import type { PocRow } from "@/lib/db/schema";

const poc = {
  appUrl: "https://falcon.acme.dev",
} as PocRow;

describe("safeReturnTo (no open redirects)", () => {
  it("allows targets on the registered app origin", () => {
    expect(safeReturnTo(poc, "https://falcon.acme.dev/quote/42?x=1")).toBe(
      "https://falcon.acme.dev/quote/42?x=1",
    );
  });

  it("rejects other origins", () => {
    expect(safeReturnTo(poc, "https://evil.example.com/")).toBeNull();
    expect(safeReturnTo(poc, "http://falcon.acme.dev/")).toBeNull(); // scheme downgrade
    expect(safeReturnTo(poc, "https://falcon.acme.dev.evil.com/")).toBeNull();
  });

  it("rejects garbage and empties", () => {
    expect(safeReturnTo(poc, null)).toBeNull();
    expect(safeReturnTo(poc, "")).toBeNull();
    expect(safeReturnTo(poc, "not a url")).toBeNull();
    expect(safeReturnTo(poc, "javascript:alert(1)")).toBeNull();
  });

  it("rejects everything when no app URL is registered", () => {
    expect(
      safeReturnTo({ appUrl: null } as PocRow, "https://anything.com/"),
    ).toBeNull();
  });
});
