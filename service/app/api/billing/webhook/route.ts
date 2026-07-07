import { NextRequest, NextResponse } from "next/server";
import { setWorkspacePlan, insertAudit, getWorkspace } from "@/lib/db/repo";
import { verifyStripeSignature } from "@/lib/billing";

/* Stripe webhook — flips the workspace plan on checkout completion /
   subscription cancellation. Only active when Stripe is configured. */

export const runtime = "nodejs";

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

  type StripeEvent = {
    type: string;
    data: {
      object: {
        client_reference_id?: string;
        customer?: string;
        subscription?: string;
        metadata?: { workspaceId?: string };
      };
    };
  };
  let event: StripeEvent;
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const obj = event.data?.object ?? {};
  const workspaceId = obj.client_reference_id ?? obj.metadata?.workspaceId;

  if (event.type === "checkout.session.completed" && workspaceId) {
    if (getWorkspace(workspaceId)) {
      setWorkspacePlan(workspaceId, "pro", {
        customerId: obj.customer ?? null,
        subscriptionId: obj.subscription ?? null,
      });
      insertAudit({
        workspaceId,
        event: "plan_upgraded",
        detail: "pro (stripe checkout)",
        source: "dashboard",
      });
    }
  } else if (event.type === "customer.subscription.deleted" && workspaceId) {
    if (getWorkspace(workspaceId)) {
      setWorkspacePlan(workspaceId, "free");
      insertAudit({
        workspaceId,
        event: "plan_downgraded",
        detail: "free (stripe subscription ended)",
        source: "dashboard",
      });
    }
  }

  return NextResponse.json({ received: true });
}
