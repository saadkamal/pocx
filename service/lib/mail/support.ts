import "server-only";
import { adminEmails } from "@/lib/auth/admin";
import type { LifecycleStage } from "@/lib/db/platform";
import { sendMail } from "@/lib/mail/send";
import {
  getNudgeConfig,
  renderNudge,
  type NudgeStage,
} from "@/lib/mail/nudge-templates";
import { escapeHtml as esc, pocxOrigin } from "@/lib/utils";

/**
 * Owner-ops email: onboarding nudges (customizable, from /admin/settings)
 * and support-ticket notifications in both directions.
 */

/** Plain-text body → safe multi-paragraph HTML (escaped, <br> for newlines). */
function bodyToHtml(body: string): string {
  return body
    .split("\n\n")
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/* --- Onboarding nudges --- */

const NUDGE_STAGE_SET = new Set<string>([
  "no_poc",
  "no_evaluators",
  "not_connected",
  "no_logins",
  "dormant",
]);

/** Render the resolved nudge for a stage, or null for non-nudge stages. */
export function nudgeContent(
  stage: LifecycleStage,
  workspaceName: string,
  firstName = "there",
): { subject: string; body: string } | null {
  if (!NUDGE_STAGE_SET.has(stage)) return null;
  const config = getNudgeConfig();
  return renderNudge(config.stages[stage as NudgeStage], {
    firstName,
    workspace: workspaceName,
    signature: config.signature,
  });
}

export async function sendNudgeEmail(input: {
  to: string;
  stage: LifecycleStage;
  workspaceName: string;
  firstName?: string;
}): Promise<boolean> {
  const content = nudgeContent(
    input.stage,
    input.workspaceName,
    input.firstName ?? "there",
  );
  if (!content) return false;
  await sendMail({
    to: input.to,
    subject: content.subject,
    text: content.body,
    html: bodyToHtml(content.body),
  });
  return true;
}

/* --- Ticket notifications --- */

export async function notifyAdminsOfTicket(input: {
  ticketId: string;
  subject: string;
  fromEmail: string;
  workspaceName: string;
  body: string;
  isNew: boolean;
}): Promise<void> {
  const o = pocxOrigin();
  const link = `${o}/admin/tickets/${input.ticketId}`;
  await Promise.allSettled(
    adminEmails().map((to) =>
      sendMail({
        to,
        subject: `[POCX ${input.isNew ? "ticket" : "reply"}] ${input.subject}`,
        text: `${input.isNew ? "New support ticket" : "Customer replied"} from ${input.fromEmail} (${input.workspaceName}):\n\n${input.body}\n\nReply: ${link}`,
        html: `<p><strong>${input.isNew ? "New support ticket" : "Customer replied"}</strong> from ${esc(input.fromEmail)} (${esc(input.workspaceName)}):</p><blockquote style="border-left:3px solid #d4551a;padding-left:12px;color:#3d372e">${esc(input.body).replace(/\n/g, "<br>")}</blockquote><p><a href="${link}">Open in the ops console</a></p>`,
      }),
    ),
  );
}

export async function notifyCustomerOfReply(input: {
  to: string;
  ticketId: string;
  subject: string;
  body: string;
}): Promise<void> {
  const o = pocxOrigin();
  const link = `${o}/dashboard/support/${input.ticketId}`;
  await sendMail({
    to: input.to,
    subject: `Re: ${input.subject}`,
    text: `POCX support replied to your ticket:\n\n${input.body}\n\nView & reply: ${link}`,
    html: `<p>POCX support replied to your ticket:</p><blockquote style="border-left:3px solid #d4551a;padding-left:12px;color:#3d372e">${esc(input.body).replace(/\n/g, "<br>")}</blockquote><p><a href="${link}">View &amp; reply in your dashboard</a></p>`,
  });
}
