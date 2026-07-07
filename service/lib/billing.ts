import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { setWorkspacePlan, insertAudit } from "@/lib/db/repo";
import { PRO_PRICE_USD } from "@/lib/plans";
import { pocxOrigin } from "@/lib/utils";

/**
 * Billing — Stripe when configured, demo mode otherwise.
 *
 * With STRIPE_SECRET_KEY + STRIPE_PRICE_ID_PRO set, upgrades go through
 * Stripe Checkout (raw REST, no SDK) and the webhook flips the plan.
 * Without them, the Upgrade button switches the workspace to Pro
 * instantly so the whole product can be evaluated offline.
 */

export function stripeEnabled(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID_PRO,
  );
}

export async function createCheckoutUrl(
  workspaceId: string,
  operatorEmail: string,
): Promise<string> {
  const params = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": process.env.STRIPE_PRICE_ID_PRO!,
    "line_items[0][quantity]": "1",
    success_url: `${pocxOrigin()}/dashboard/billing?upgraded=1`,
    cancel_url: `${pocxOrigin()}/dashboard/billing`,
    customer_email: operatorEmail,
    client_reference_id: workspaceId,
    "metadata[workspaceId]": workspaceId,
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Stripe ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

/** Instant Pro upgrade when Stripe isn't configured (demo mode). */
export function demoUpgrade(workspaceId: string, byEmail: string): void {
  setWorkspacePlan(workspaceId, "pro");
  insertAudit({
    workspaceId,
    email: byEmail,
    event: "plan_upgraded",
    detail: `pro (demo mode, US$${PRO_PRICE_USD}/mo)`,
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
  const parts = new Map(
    header.split(",").map((kv) => kv.split("=", 2) as [string, string]),
  );
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
