import { describe, expect, it } from "vitest";
import { canAddEvaluator, hasAuditTrail, planFor, PLANS } from "@/lib/plans";

describe("plans", () => {
  it("free caps evaluator seats at 3 per PoC", () => {
    expect(canAddEvaluator("free", 0).ok).toBe(true);
    expect(canAddEvaluator("free", 2).ok).toBe(true);
    const capped = canAddEvaluator("free", 3);
    expect(capped.ok).toBe(false);
    if (!capped.ok) expect(capped.reason).toContain("Upgrade to Pro");
  });

  it("pro is unlimited", () => {
    expect(canAddEvaluator("pro", 3).ok).toBe(true);
    expect(canAddEvaluator("pro", 5000).ok).toBe(true);
  });

  it("audit trail is pro-only", () => {
    expect(hasAuditTrail("free")).toBe(false);
    expect(hasAuditTrail("pro")).toBe(true);
  });

  it("unknown/missing plans resolve to free", () => {
    expect(planFor(null).id).toBe("free");
    expect(planFor("enterprise").id).toBe("free");
    expect(planFor(undefined).id).toBe("free");
  });

  it("pro costs $39", () => {
    expect(PLANS.pro.priceUsd).toBe(39);
  });
});
