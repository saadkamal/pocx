import { describe, expect, it } from "vitest";
import { snapshotSubscription, retentionOfferAvailable } from "@/lib/billing";
import {
  PRO_PRICE_USD,
  PRO_PRICE_YEARLY_USD,
  YEARLY_SAVINGS_PCT,
} from "@/lib/plans";
import type { WorkspaceRow } from "@/lib/db/schema";

describe("pricing", () => {
  it("yearly is a genuine discount (~32%)", () => {
    expect(PRO_PRICE_YEARLY_USD).toBe(320);
    expect(PRO_PRICE_YEARLY_USD).toBeLessThan(PRO_PRICE_USD * 12);
    expect(YEARLY_SAVINGS_PCT).toBeGreaterThanOrEqual(30);
    expect(YEARLY_SAVINGS_PCT).toBeLessThanOrEqual(35);
  });
});

describe("snapshotSubscription (API-version tolerant)", () => {
  const base = {
    id: "sub_123",
    status: "active",
    cancel_at_period_end: false,
    customer: "cus_9",
    items: {
      data: [
        { id: "si_1", price: { recurring: { interval: "year" } } },
      ],
    },
  };

  it("reads period end from the subscription (older API)", () => {
    const snap = snapshotSubscription({ ...base, current_period_end: 1_800_000_000 });
    expect(snap.interval).toBe("year");
    expect(snap.currentPeriodEnd?.getTime()).toBe(1_800_000_000_000);
    expect(snap.customerId).toBe("cus_9");
  });

  it("reads period end from the item (2025+ API)", () => {
    const snap = snapshotSubscription({
      ...base,
      items: {
        data: [
          {
            id: "si_1",
            current_period_end: 1_900_000_000,
            price: { recurring: { interval: "month" } },
          },
        ],
      },
    });
    expect(snap.interval).toBe("month");
    expect(snap.currentPeriodEnd?.getTime()).toBe(1_900_000_000_000);
  });

  it("tolerates missing fields", () => {
    const snap = snapshotSubscription({ id: "sub_x", status: "canceled" });
    expect(snap.interval).toBeNull();
    expect(snap.currentPeriodEnd).toBeNull();
    expect(snap.cancelAtPeriodEnd).toBe(false);
  });
});

describe("retention offer eligibility", () => {
  const ws = (over: Partial<WorkspaceRow>): WorkspaceRow =>
    ({
      plan: "pro",
      billingInterval: "month",
      retentionOfferRedeemedAt: null,
      cancelAtPeriodEnd: false,
      ...over,
    }) as WorkspaceRow;

  it("offered to active monthly Pro, once", () => {
    expect(retentionOfferAvailable(ws({}))).toBe(true);
  });
  it("not offered on yearly (already discounted)", () => {
    expect(retentionOfferAvailable(ws({ billingInterval: "year" }))).toBe(false);
  });
  it("not offered twice", () => {
    expect(
      retentionOfferAvailable(ws({ retentionOfferRedeemedAt: new Date() })),
    ).toBe(false);
  });
  it("not offered to free or already-canceling workspaces", () => {
    expect(retentionOfferAvailable(ws({ plan: "free" }))).toBe(false);
    expect(retentionOfferAvailable(ws({ cancelAtPeriodEnd: true }))).toBe(false);
  });
});
