import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { escapeHtml } from "@/lib/utils";
import { sendMail, type MailAttachment } from "./send";

/**
 * Inbound email (support@pocx.dev → the team inbox).
 *
 * Resend receives mail for the domain (MX record), parses it, and POSTs an
 * `email.received` webhook to /api/inbound/resend. The webhook carries
 * metadata only — the body and attachments are fetched from the Received
 * emails API — and the whole message is re-sent to POCX_SUPPORT_INBOX with
 * Reply-To set to the original sender, so replying "just works".
 */

export const SUPPORT_INBOX =
  process.env.POCX_SUPPORT_INBOX ?? "pocx@haxo.com.au";

/** Skip attachments beyond this (Resend's send limit is 40MB total). */
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/**
 * Verify a Svix-style webhook signature (Resend webhooks use Svix):
 * HMAC-SHA256 over `${id}.${timestamp}.${payload}` keyed with the
 * base64-decoded secret (after the `whsec_` prefix), base64-encoded, and
 * matched against any space-separated `v1,<sig>` entry in the header.
 */
export function verifySvixSignature(
  payload: string,
  headers: {
    id: string | null;
    timestamp: string | null;
    signature: string | null;
  },
  secret: string,
  toleranceSec = 300,
  nowMs = Date.now(),
): boolean {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowMs / 1000 - ts) > toleranceSec) {
    return false;
  }

  let key: Buffer;
  try {
    key = Buffer.from(
      secret.startsWith("whsec_") ? secret.slice(6) : secret,
      "base64",
    );
  } catch {
    return false;
  }
  if (key.length === 0) return false;

  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${payload}`)
    .digest("base64");
  const a = Buffer.from(expected, "utf8");

  for (const entry of signature.split(" ")) {
    const [version, sig] = entry.split(",", 2);
    if (version !== "v1" || !sig) continue;
    const b = Buffer.from(sig, "utf8");
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

/** Bare lowercase address from "Name <a@b>" or "a@b" (empty if none). */
export function extractAddress(sender: string): string {
  const angled = sender.match(/<([^<>\s]+@[^<>\s]+)>/);
  const bare = angled?.[1] ?? sender.trim();
  return /^[^\s@<>]+@[^\s@<>]+$/.test(bare) ? bare.toLowerCase() : "";
}

export type ReceivedEmailEvent = {
  email_id: string;
  from: string;
  to: string[];
  subject?: string;
};

type ReceivedEmail = {
  from: string;
  to: string[];
  subject?: string;
  text?: string;
  html?: string;
};

type ReceivedAttachment = {
  filename: string;
  size: number;
  download_url: string;
};

async function resendGet(path: string, apiKey: string): Promise<unknown> {
  const res = await fetch(`https://api.resend.com${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    throw new Error(`Resend GET ${path}: ${res.status}`);
  }
  return res.json();
}

async function fetchAttachments(
  emailId: string,
  apiKey: string,
): Promise<{ attachments: MailAttachment[]; skipped: string[] }> {
  const list = (await resendGet(
    `/emails/receiving/${encodeURIComponent(emailId)}/attachments`,
    apiKey,
  )) as { data?: ReceivedAttachment[] };

  const attachments: MailAttachment[] = [];
  const skipped: string[] = [];
  let total = 0;
  for (const item of list.data ?? []) {
    if (total + item.size > MAX_ATTACHMENT_BYTES) {
      skipped.push(item.filename);
      continue;
    }
    const res = await fetch(item.download_url);
    if (!res.ok) {
      skipped.push(item.filename);
      continue;
    }
    attachments.push({
      filename: item.filename,
      content: Buffer.from(await res.arrayBuffer()),
    });
    total += item.size;
  }
  return { attachments, skipped };
}

/**
 * Forward a received email to the support inbox. Returns false when the
 * message was deliberately dropped (loop guard); throws on upstream
 * errors so the route can 500 and Resend retries.
 */
export async function forwardReceivedEmail(
  event: ReceivedEmailEvent,
): Promise<boolean> {
  // Loop guard: never forward mail that (claims to) come from the inbox we
  // forward to, or from our own sending identity. Compare bare addresses —
  // substring checks against the display form can false-drop real senders.
  const from = extractAddress(event.from);
  const selfSender = extractAddress(
    process.env.POCX_MAIL_FROM ?? "POCX <access@pocx.dev>",
  );
  if (!from || from === selfSender || from === SUPPORT_INBOX.toLowerCase()) {
    console.warn(`[pocx inbound] loop guard dropped mail from ${event.from}`);
    return false;
  }

  const apiKey = process.env.RESEND_API_KEY;
  let full: ReceivedEmail | null = null;
  let attachments: MailAttachment[] = [];
  let skipped: string[] = [];
  if (apiKey) {
    full = (await resendGet(
      `/emails/receiving/${encodeURIComponent(event.email_id)}`,
      apiKey,
    )) as ReceivedEmail;
    ({ attachments, skipped } = await fetchAttachments(event.email_id, apiKey));
  }

  const receivedAt = event.to.join(", ");
  const subject = full?.subject ?? event.subject ?? "(no subject)";
  const bodyText = full?.text ?? "(body unavailable — see Resend dashboard)";
  const skippedNote = skipped.length
    ? `\n[${skipped.length} attachment(s) too large to forward: ${skipped.join(", ")}]`
    : "";

  const banner =
    `From: ${event.from}\n` +
    `To:   ${receivedAt}\n` +
    `— forwarded by POCX inbound —`;
  const bannerHtml =
    `<div style="border:1px solid #ddd;border-radius:6px;padding:10px 14px;` +
    `margin-bottom:16px;font:13px/1.5 monospace;color:#555;background:#faf9f5">` +
    `From: ${escapeHtml(event.from)}<br>To: ${escapeHtml(receivedAt)}<br>` +
    `<span style="color:#999">— forwarded by POCX inbound —</span></div>`;

  await sendMail({
    to: SUPPORT_INBOX,
    replyTo: event.from,
    subject: `[${receivedAt}] ${subject}`,
    text: `${banner}\n\n${bodyText}${skippedNote}`,
    html:
      bannerHtml +
      (full?.html ??
        `<pre style="white-space:pre-wrap;font:14px/1.6 sans-serif">${escapeHtml(
          bodyText,
        )}</pre>`) +
      (skipped.length ? `<p style="color:#999">${escapeHtml(skippedNote)}</p>` : ""),
    attachments,
  });
  return true;
}
