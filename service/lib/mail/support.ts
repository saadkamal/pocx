import "server-only";
import { adminEmails } from "@/lib/auth/admin";
import type { LifecycleStage } from "@/lib/db/platform";
import { sendMail } from "@/lib/mail/send";
import { pocxOrigin } from "@/lib/utils";

/**
 * Owner-ops email: onboarding nudges (sent manually from the funnel view)
 * and support-ticket notifications in both directions.
 */

/* --- Onboarding nudges --- */

type NudgeContent = { subject: string; body: string };

export function nudgeContent(
  stage: LifecycleStage,
  workspaceName: string,
): NudgeContent | null {
  const o = pocxOrigin();
  switch (stage) {
    case "no_poc":
      return {
        subject: "Your PoC is one form away from being protected",
        body: `You created the "${workspaceName}" workspace on POCX but haven't set up a PoC yet — the whole thing takes about a minute:

1. ${o}/dashboard/new — name the PoC and the entity that built it
2. Invite your evaluators' emails
3. Drop three env vars + one file into the app (or paste one prompt into a coding agent)

Stuck on anything? Just reply via the Support tab (${o}/dashboard/support) and I'll personally help you get set up.`,
      };
    case "no_evaluators":
      return {
        subject: "Your PoC gate is up — nobody can enter yet",
        body: `Your PoC on POCX is created, but no evaluators are invited yet, so nobody can request an access code.

Add their emails under ${o}/dashboard → your PoC → Evaluators. Tip: add yourself first and do one end-to-end login — it takes two minutes and you'll see exactly what your client will see.

Questions? ${o}/dashboard/support — happy to help.`,
      };
    case "not_connected":
      return {
        subject: "One file left: connect your app to POCX",
        body: `Evaluators are invited, but your app hasn't talked to POCX yet — the gate isn't protecting anything until the SDK is in.

It's three env vars and one file (about 5 minutes): your PoC's Overview tab has everything ready to copy, including a one-line prompt you can paste into Claude Code / Cursor and let the agent do it.

Docs: ${o}/docs · Tutorials: ${o}/tutorials — or ask us directly: ${o}/dashboard/support`,
      };
    case "no_logins":
      return {
        subject: "Everything's wired up — time to send the link",
        body: `Your PoC is protected and connected — but no evaluator has signed in yet.

If you haven't sent the gate link to your client yet, the Evaluators tab has a "Send invite" button that emails each person a walkthrough. If you did send it and they're stuck, the usual culprit is the code email landing in spam — we can help you check: ${o}/dashboard/support`,
      };
    case "dormant":
      return {
        subject: "Your PoC has gone quiet — need anything?",
        body: `No evaluator activity on your PoC for a couple of weeks. If the evaluation wrapped up — congratulations! Two housekeeping ideas:

- Pause or archive the PoC (Settings) so the gate stops accepting logins
- Export your evidence: signatures and the audit trail live in your dashboard

Starting a new PoC or hit a snag? ${o}/dashboard/support — we read everything.`,
      };
    case "active":
      return null; // nothing to nudge
  }
}

export async function sendNudgeEmail(input: {
  to: string;
  stage: LifecycleStage;
  workspaceName: string;
}): Promise<boolean> {
  const content = nudgeContent(input.stage, input.workspaceName);
  if (!content) return false;
  await sendMail({
    to: input.to,
    subject: content.subject,
    text: `${content.body}\n\n— Saad, POCX`,
    html: content.body
      .split("\n\n")
      .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
      .join("")
      .concat(`<p style="color:#7c7365">— Saad, POCX</p>`),
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
        html: `<p><strong>${input.isNew ? "New support ticket" : "Customer replied"}</strong> from ${input.fromEmail} (${input.workspaceName}):</p><blockquote style="border-left:3px solid #d4551a;padding-left:12px;color:#3d372e">${input.body.replace(/\n/g, "<br>")}</blockquote><p><a href="${link}">Open in the ops console</a></p>`,
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
    html: `<p>POCX support replied to your ticket:</p><blockquote style="border-left:3px solid #d4551a;padding-left:12px;color:#3d372e">${input.body.replace(/\n/g, "<br>")}</blockquote><p><a href="${link}">View &amp; reply in your dashboard</a></p>`,
  });
}
