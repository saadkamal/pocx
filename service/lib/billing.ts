import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  setWorkspacePlan,
  updateWorkspaceBilling,
  insertAudit,
} from "@/lib/db/repo";
import type { WorkspaceRow } from "@/lib/db/schema";
import { PRO_PRICE_USD, type BillingInterval } from "@/lib/plans";
import { pocxOrigin } from "@/lib/utils";

/**
 * Billing — Stripe when configured, demo mode otherwise.
 *
 * Subscription lifecycle (Stripe mode):
 *   upgrade      → Checkout (monthly or yearly price); webhook flips plan
 *   cancel       → cancel_at_period_end (access runs to the period end)
 *   resume       → clears cancel_at_period_end before the period ends
 *   switch       → monthly → yearly, prorated + invoiced immediately
 *   retention    → 50% off for 3 months, once per workspace, offered on
 *                  monthly cancellation
 *   portal       → Stripe Billing Portal for invoices + payment methods
 *
 * All calls are raw REST (no SDK). State is mirrored to the workspaces
 * table by the webhook handler; actions also sync optimistically so the
 * UI reflects changes immediately.
 */

export function stripeEnabled(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID_PRO,
  );
}

function priceIdFor(interval: BillingInterval): string {
  const id =
    interval === "year"
      ? process.env.STRIPE_PRICE_ID_PRO_YEARLY
      : process.env.STRIPE_PRICE_ID_PRO;
  if (!id) throw new Error(`No Stripe price configured for interval=${interval}`);
  return id;
}

async function stripeRequest(
  path: string,
  params?: URLSearchParams,
  method: "POST" | "GET" = params ? "POST" : "GET",
): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      ...(method === "POST"
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : {}),
    },
    body: method === "POST" ? params?.toString() : undefined,
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = (data as { error?: { message?: string } }).error;
    throw new Error(`Stripe ${res.status}: ${err?.message ?? "unknown error"}`);
  }
  return data;
}

/* --- Checkout (upgrade) --- */

export async function createCheckoutUrl(
  workspaceId: string,
  operatorEmail: string,
  interval: BillingInterval,
): Promise<string> {
  const params = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceIdFor(interval),
    "line_items[0][quantity]": "1",
    success_url: `${pocxOrigin()}/dashboard/billing?upgraded=1`,
    cancel_url: `${pocxOrigin()}/dashboard/billing`,
    customer_email: operatorEmail,
    client_reference_id: workspaceId,
    "metadata[workspaceId]": workspaceId,
    "subscription_data[metadata][workspaceId]": workspaceId,
    // Card is the safe default; let Stripe add wallets automatically.
    allow_promotion_codes: "true",
  });
  const data = await stripeRequest("checkout/sessions", params);
  return data.url as string;
}

/* --- Subscription state --- */

export type SubscriptionSnapshot = {
  id: string;
  status: string;
  interval: BillingInterval | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  customerId: string | null;
};

/** Normalize a Stripe subscription object across API versions. */
export function snapshotSubscription(
  sub: Record<string, unknown>,
): SubscriptionSnapshot {
  const items = (sub.items as { data?: Array<Record<string, unknown>> })?.data ?? [];
  const firstItem = items[0] ?? {};
  const price = firstItem.price as
    | { recurring?: { interval?: string } }
    | undefined;
  const interval = price?.recurring?.interval;
  // current_period_end lives on the subscription in older API versions and
  // on the item in 2025+ versions — accept either.
  const periodEnd =
    (sub.current_period_end as number | undefined) ??
    (firstItem.current_period_end as number | undefined);
  const customer = sub.customer;
  return {
    id: sub.id as string,
    status: (sub.status as string) ?? "unknown",
    interval: interval === "year" || interval === "month" ? interval : null,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    customerId: typeof customer === "string" ? customer : null,
  };
}

export async function fetchSubscription(
  subscriptionId: string,
): Promise<SubscriptionSnapshot> {
  return snapshotSubscription(await stripeRequest(`subscriptions/${subscriptionId}`));
}

/** Write a subscription snapshot into the workspace row. */
export function syncSubscriptionToWorkspace(
  workspaceId: string,
  snap: SubscriptionSnapshot,
): void {
  updateWorkspaceBilling(workspaceId, {
    billingInterval: snap.interval,
    cancelAtPeriodEnd: snap.cancelAtPeriodEnd,
    currentPeriodEnd: snap.currentPeriodEnd,
    ...(snap.customerId ? { stripeCustomerId: snap.customerId } : {}),
    stripeSubscriptionId: snap.id,
  });
}

/* --- Cancel / resume --- */

export async function cancelAtPeriodEnd(
  subscriptionId: string,
): Promise<SubscriptionSnapshot> {
  const data = await stripeRequest(
    `subscriptions/${subscriptionId}`,
    new URLSearchParams({ cancel_at_period_end: "true" }),
  );
  return snapshotSubscription(data);
}

export async function resumeSubscription(
  subscriptionId: string,
): Promise<SubscriptionSnapshot> {
  const data = await stripeRequest(
    `subscriptions/${subscriptionId}`,
    new URLSearchParams({ cancel_at_period_end: "false" }),
  );
  return snapshotSubscription(data);
}

/* --- Interval switch (monthly → yearly, prorated) --- */

export async function switchToYearly(
  subscriptionId: string,
): Promise<SubscriptionSnapshot> {
  const sub = await stripeRequest(`subscriptions/${subscriptionId}`);
  const items = (sub.items as { data?: Array<{ id?: string }> })?.data ?? [];
  const itemId = items[0]?.id;
  if (!itemId) throw new Error("Subscription has no items to update.");
  const data = await stripeRequest(
    `subscriptions/${subscriptionId}`,
    new URLSearchParams({
      "items[0][id]": itemId,
      "items[0][price]": priceIdFor("year"),
      proration_behavior: "always_invoice",
      cancel_at_period_end: "false",
    }),
  );
  return snapshotSubscription(data);
}

/* --- Retention offer (50% off for 3 months) --- */

export const RETENTION_COUPON_ID =
  process.env.STRIPE_RETENTION_COUPON_ID ?? "pocx-retention-50";

export async function applyRetentionCoupon(
  subscriptionId: string,
): Promise<void> {
  // Newer API versions want `discounts[]`; older ones want `coupon`.
  // Try modern first, fall back once.
  try {
    await stripeRequest(
      `subscriptions/${subscriptionId}`,
      new URLSearchParams({ "discounts[0][coupon]": RETENTION_COUPON_ID }),
    );
  } catch {
    await stripeRequest(
      `subscriptions/${subscriptionId}`,
      new URLSearchParams({ coupon: RETENTION_COUPON_ID }),
    );
  }
}

/* --- Billing portal (invoices, payment methods) --- */

export async function createPortalUrl(
  customerId: string,
): Promise<string> {
  const data = await stripeRequest(
    "billing_portal/sessions",
    new URLSearchParams({
      customer: customerId,
      return_url: `${pocxOrigin()}/dashboard/billing`,
    }),
  );
  return data.url as string;
}

/* --- Demo mode (no Stripe keys) --- */

export function demoUpgrade(
  workspaceId: string,
  byEmail: string,
  interval: BillingInterval = "month",
): void {
  setWorkspacePlan(workspaceId, "pro");
  const periodMs = interval === "year" ? 365 : 30;
  updateWorkspaceBilling(workspaceId, {
    billingInterval: interval,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: new Date(Date.now() + periodMs * 86_400_000),
  });
  insertAudit({
    workspaceId,
    email: byEmail,
    event: "plan_upgraded",
    detail: `pro/${interval} (demo mode, US$${PRO_PRICE_USD}/mo)`,
    source: "dashboard",
  });
}

export function demoDowngrade(workspaceId: string, byEmail: string): void {
  setWorkspacePlan(workspaceId, "free");
  insertAudit({
    workspaceId,
    email: byEmail,
    event: "plan_downgraded",
    detail: "free (demo mode)",
    source: "dashboard",
  });
}

/** Can this workspace still be offered the save-50% retention deal? */
export function retentionOfferAvailable(ws: WorkspaceRow): boolean {
  return (
    ws.plan === "pro" &&
    ws.billingInterval === "month" &&
    !ws.retentionOfferRedeemedAt &&
    !ws.cancelAtPeriodEnd
  );
}

/**
 * Verify a Stripe webhook signature (v1 scheme: HMAC-SHA256 over
 * `${timestamp}.${payload}` with the endpoint secret).
 */
export function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  toleranceSec = 300,
  nowMs = Date.now(),
): boolean {
  if (!header) return false;
  // Parse "t=…,v1=…" — split only on the first '=' so a value containing
  // '=' is preserved (String.split(sep, limit) truncates, which would drop it).
  const parts = new Map<string, string>();
  for (const kv of header.split(",")) {
    const eq = kv.indexOf("=");
    if (eq > 0) parts.set(kv.slice(0, eq).trim(), kv.slice(eq + 1).trim());
  }
  const t = parts.get("t");
  const v1 = parts.get("v1");
  if (!t || !v1) return false;
  if (Math.abs(nowMs / 1000 - Number(t)) > toleranceSec) return false;

  const expected = createHmac("sha256", secret)
    .update(`${t}.${payload}`)
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(v1, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
