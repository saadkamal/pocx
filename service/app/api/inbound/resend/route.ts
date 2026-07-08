import { NextRequest, NextResponse } from "next/server";
import {
  forwardReceivedEmail,
  verifySvixSignature,
  type ReceivedEmailEvent,
} from "@/lib/mail/inbound";

/**
 * Resend inbound-email webhook (`email.received`) — powers support@pocx.dev.
 *
 * Setup (cloud):
 *   1. Resend → Domains → pocx.dev → enable receiving (adds an MX record).
 *   2. Resend → Webhooks → Add webhook → {POCX_ORIGIN}/api/inbound/resend,
 *      event `email.received`; put its signing secret in
 *      RESEND_INBOUND_WEBHOOK_SECRET.
 * Every message to *@pocx.dev is then forwarded to POCX_SUPPORT_INBOX
 * (default pocx@haxo.com.au) with Reply-To set to the original sender.
 */

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_INBOUND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });
  }

  const payload = await req.text();
  const valid = verifySvixSignature(
    payload,
    {
      id: req.headers.get("svix-id"),
      timestamp: req.headers.get("svix-timestamp"),
      signature: req.headers.get("svix-signature"),
    },
    secret,
  );
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { type?: string; data?: ReceivedEmailEvent };
  try {
    event = JSON.parse(payload) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (event.type !== "email.received" || !event.data?.email_id) {
    return NextResponse.json({ ignored: true });
  }

  try {
    const forwarded = await forwardReceivedEmail(event.data);
    return NextResponse.json({ forwarded });
  } catch (err) {
    // 500 → Resend retries with backoff; nothing is lost.
    console.error("[pocx inbound] forward failed:", err);
    return NextResponse.json({ error: "Forward failed" }, { status: 500 });
  }
}
