import { NextRequest, NextResponse } from "next/server";
import {
  getWorkspace,
  getWorkspaceByStripeSubscription,
  insertAudit,
  setWorkspacePlan,
} from "@/lib/db/repo";
import {
  fetchSubscription,
  snapshotSubscription,
  syncSubscriptionToWorkspace,
  verifyStripeSignature,
} from "@/lib/billing";

/**
 * Stripe webhook — the authoritative sync point for subscription state.
 *
 *  checkout.session.completed     → plan=pro + mirror the new subscription
 *  customer.subscription.updated  → mirror interval / cancel-at-period-end /
 *                                   period end (covers cancel, resume,
 *                                   monthly→yearly switches, renewals)
 *  customer.subscription.deleted  → plan=free
 *  invoice.payment_failed         → audit trail entry (Stripe smart retries
 *                                   + the billing portal handle recovery)
 */

export const runtime = "nodejs";

type StripeObject = {
  id?: string;
  client_reference_id?: string;
  customer?: string;
  subscription?: string;
  metadata?: { workspaceId?: string };
  [key: string]: unknown;
};

function workspaceIdFrom(obj: StripeObject): string | null {
  return obj.client_reference_id ?? obj.metadata?.workspaceId ?? null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });
  }

  const payload = await req.text();
  if (
    !verifyStripeSignature(payload, req.headers.get("stripe-signature"), secret)
  ) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  let event: { type: string; data: { object: StripeObject } };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const obj = event.data?.object ?? {};

  switch (event.type) {
    case "checkout.session.completed": {
      const workspaceId = workspaceIdFrom(obj);
      if (!workspaceId || !getWorkspace(workspaceId)) break;

      setWorkspacePlan(workspaceId, "pro", {
        customerId: obj.customer ?? null,
        subscriptionId: obj.subscription ?? null,
      });
      // Pull interval + period end from the subscription itself.
      if (obj.subscription) {
        try {
          const snap = await fetchSubscription(obj.subscription);
          syncSubscriptionToWorkspace(workspaceId, snap);
        } catch (e) {
          console.warn("[pocx] subscription fetch after checkout failed:", e);
        }
      }
      insertAudit({
        workspaceId,
        event: "plan_upgraded",
        detail: "pro (stripe checkout)",
        source: "dashboard",
      });
      break;
    }

    case "customer.subscription.updated": {
      const snap = snapshotSubscription(obj);
      const workspaceId = workspaceIdFrom(obj);
      const ws =
        (workspaceId && getWorkspace(workspaceId)) ||
        getWorkspaceByStripeSubscription(snap.id);
      if (!ws) break;

      syncSubscriptionToWorkspace(ws.id, snap);
      insertAudit({
        workspaceId: ws.id,
        event: "subscription_updated",
        detail: `${snap.status}/${snap.interval ?? "?"}${snap.cancelAtPeriodEnd ? " (cancels at period end)" : ""}`,
        source: "dashboard",
      });
      break;
    }

    case "customer.subscription.deleted": {
      const snap = snapshotSubscription(obj);
      const workspaceId = workspaceIdFrom(obj);
      const ws =
        (workspaceId && getWorkspace(workspaceId)) ||
        getWorkspaceByStripeSubscription(snap.id);
      if (!ws) break;

      setWorkspacePlan(ws.id, "free");
      insertAudit({
        workspaceId: ws.id,
        event: "plan_downgraded",
        detail: "free (stripe subscription ended)",
        source: "dashboard",
      });
      break;
    }

    case "invoice.payment_failed": {
      const workspaceId = workspaceIdFrom(obj);
      const subId =
        obj.subscription ??
        ((obj as { parent?: { subscription_details?: { subscription?: string } } })
          .parent?.subscription_details?.subscription ?? null);
      const ws =
        (workspaceId && getWorkspace(workspaceId)) ||
        (subId ? getWorkspaceByStripeSubscription(subId) : null);
      if (!ws) break;

      insertAudit({
        workspaceId: ws.id,
        event: "payment_failed",
        detail: "invoice payment failed — Stripe will retry",
        source: "dashboard",
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
