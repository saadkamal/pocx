import "server-only";
import { insertOutboundEmail } from "@/lib/db/repo";

/**
 * Outbound email.
 * - `RESEND_API_KEY` set   → send via the Resend REST API (plain fetch).
 * - `RESEND_API_KEY` unset → log into `outbound_emails` (the dashboard's
 *   Emails tab doubles as a demo inbox) and print OTP-bearing mails to the
 *   server console so local signup isn't a chicken-and-egg problem.
 */

export type MailAttachment = {
  filename: string;
  content: Buffer;
};

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: MailAttachment[];
  /** For the mock inbox: which PoC / workspace this mail belongs to. */
  pocId?: string;
  workspaceId?: string;
};

export type SendMailResult = {
  delivery: "resend" | "mock";
  messageId: string;
};

const MAIL_FROM = process.env.POCX_MAIL_FROM ?? "POCX <access@pocx.dev>";

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        attachments: input.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content.toString("base64"),
        })),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Resend ${res.status}: ${detail.slice(0, 300)}`);
    }
    const data = (await res.json()) as { id: string };
    return { delivery: "resend", messageId: data.id };
  }

  // Mock path — log to the outbound_emails table + server console.
  const noteAttachments = input.attachments?.length
    ? `\n\n[mock: ${input.attachments.length} attachment(s): ${input.attachments
        .map((a) => a.filename)
        .join(", ")}]`
    : "";
  const rowId = insertOutboundEmail({
    recipient: input.to,
    subject: input.subject,
    body: input.text + noteAttachments,
    pocId: input.pocId ?? null,
    workspaceId: input.workspaceId ?? null,
  });
  console.log(
    `[pocx mail:mock] to=${input.to} subject=${JSON.stringify(input.subject)}`,
  );
  return { delivery: "mock", messageId: `mock_${rowId}` };
}
