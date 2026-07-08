"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminContext } from "@/lib/auth/admin";
import {
  getOperatorByEmail,
  getWorkspace,
  insertAudit,
  setWorkspacePlan,
} from "@/lib/db/repo";
import { workspaceSummary } from "@/lib/db/platform";
import {
  addTicketMessage,
  getTicket,
  setTicketStatus,
  type TicketStatus,
} from "@/lib/db/tickets";
import {
  notifyCustomerOfReply,
  sendNudgeEmail,
} from "@/lib/mail/support";
import {
  friendlyFirstName,
  getNudgeConfig,
  renderNudge,
  resetNudgeConfig,
  saveNudgeConfig,
  NUDGE_STAGES,
  type NudgeConfig,
  type NudgeStage,
} from "@/lib/mail/nudge-templates";
import { sendMail } from "@/lib/mail/send";

/**
 * Ops-console mutations. Every action re-authenticates the admin session
 * against the env allowlist. All return { ok } | { error }.
 */

export type AdminActionResult =
  | { ok: true; message?: string }
  | { error: string };

const err = (error: string): AdminActionResult => ({ error });

const NUDGE_COOLDOWN_MS = 7 * 86_400_000;

/** Send the stage-appropriate onboarding nudge to the workspace owner. */
export async function sendNudgeAction(
  workspaceId: string,
): Promise<AdminActionResult> {
  const admin = await getAdminContext();
  if (!admin) return err("Not signed in.");

  const summary = workspaceSummary(workspaceId);
  if (!summary) return err("Workspace not found.");
  if (!summary.ownerEmail) return err("Workspace has no owner email.");
  if (summary.stage === "active") {
    return err("This workspace is active — nothing to nudge.");
  }
  if (
    summary.lastNudgeAt &&
    Date.now() - summary.lastNudgeAt.getTime() < NUDGE_COOLDOWN_MS
  ) {
    return err("Nudged within the last 7 days — give them room to breathe.");
  }

  const owner = getOperatorByEmail(summary.ownerEmail);
  const sent = await sendNudgeEmail({
    to: summary.ownerEmail,
    stage: summary.stage,
    workspaceName: summary.ws.name,
    firstName: friendlyFirstName(owner?.name, summary.ownerEmail),
  });
  if (!sent) return err("No nudge template for this stage.");

  insertAudit({
    workspaceId,
    email: admin.email,
    event: "nudge_sent",
    detail: summary.stage,
    source: "dashboard",
  });
  revalidatePath("/admin/funnel");
  revalidatePath(`/admin/workspaces/${workspaceId}`);
  return { ok: true, message: `Nudge (${summary.stage}) sent to ${summary.ownerEmail}.` };
}

/* --- Nudge email templates (customizable copy) --- */

const TemplateSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(8000),
});
const SaveNudgeSchema = z.object({
  signature: z.string().trim().min(1).max(500),
  stages: z.record(z.string(), TemplateSchema),
});

/** Save edited nudge templates + signature (from /admin/settings). */
export async function saveNudgeConfigAction(
  formData: FormData,
): Promise<AdminActionResult> {
  const admin = await getAdminContext();
  if (!admin) return err("Not signed in.");

  const stages: Record<string, { subject: string; body: string }> = {};
  for (const stage of NUDGE_STAGES) {
    stages[stage] = {
      subject: String(formData.get(`subject_${stage}`) ?? ""),
      body: String(formData.get(`body_${stage}`) ?? ""),
    };
  }
  const parsed = SaveNudgeSchema.safeParse({
    signature: String(formData.get("signature") ?? ""),
    stages,
  });
  if (!parsed.success) {
    return err("Every template needs a subject and a body.");
  }

  saveNudgeConfig(parsed.data as NudgeConfig);
  insertAudit({
    email: admin.email,
    event: "nudge_templates_saved",
    source: "dashboard",
  });
  revalidatePath("/admin/settings");
  return { ok: true, message: "Saved. New nudges will use this copy." };
}

/** Restore the built-in default copy. */
export async function resetNudgeConfigAction(): Promise<AdminActionResult> {
  const admin = await getAdminContext();
  if (!admin) return err("Not signed in.");
  resetNudgeConfig();
  insertAudit({
    email: admin.email,
    event: "nudge_templates_reset",
    source: "dashboard",
  });
  revalidatePath("/admin/settings");
  return { ok: true, message: "Restored the default copy." };
}

/** Send one stage's nudge to the signed-in admin so they can preview it. */
export async function sendTestNudgeAction(
  stage: string,
): Promise<AdminActionResult> {
  const admin = await getAdminContext();
  if (!admin) return err("Not signed in.");
  if (!NUDGE_STAGES.includes(stage as NudgeStage)) {
    return err("Unknown stage.");
  }
  const config = getNudgeConfig();
  const rendered = renderNudge(config.stages[stage as NudgeStage], {
    firstName: friendlyFirstName(null, admin.email),
    workspace: "Acme Pte Ltd",
    signature: config.signature,
  });
  await sendMail({
    to: admin.email,
    subject: `[TEST] ${rendered.subject}`,
    text: rendered.body,
    html: rendered.body
      .split("\n\n")
      .map(
        (p) =>
          `<p>${p
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, "<br>")}</p>`,
      )
      .join(""),
  });
  return { ok: true, message: `Test "${stage}" nudge sent to ${admin.email}.` };
}

/**
 * Comp a workspace onto Pro (support gesture / partner deal) or remove a
 * comp. Refuses to touch workspaces with a live Stripe subscription — that
 * state belongs to Stripe.
 */
export async function setCompPlanAction(
  workspaceId: string,
  comped: boolean,
): Promise<AdminActionResult> {
  const admin = await getAdminContext();
  if (!admin) return err("Not signed in.");

  const ws = getWorkspace(workspaceId);
  if (!ws) return err("Workspace not found.");
  if (ws.stripeSubscriptionId) {
    return err(
      "This workspace has a Stripe subscription — manage it in Stripe, not with comps.",
    );
  }
  if (comped && ws.plan === "pro") return err("Already on Pro.");
  if (!comped && ws.plan === "free") return err("Already on Free.");

  setWorkspacePlan(workspaceId, comped ? "pro" : "free");
  insertAudit({
    workspaceId,
    email: admin.email,
    event: comped ? "plan_comped" : "plan_comp_removed",
    source: "dashboard",
  });
  revalidatePath(`/admin/workspaces/${workspaceId}`);
  return {
    ok: true,
    message: comped ? "Comped to Pro." : "Comp removed — back on Free.",
  };
}

/* --- Tickets --- */

const ReplySchema = z.object({ body: z.string().trim().min(1).max(10_000) });

export async function adminReplyTicketAction(
  ticketId: string,
  formData: FormData,
): Promise<AdminActionResult> {
  const admin = await getAdminContext();
  if (!admin) return err("Not signed in.");

  const ticket = getTicket(ticketId);
  if (!ticket) return err("Ticket not found.");

  const parsed = ReplySchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return err("Write a reply first.");

  addTicketMessage({
    ticketId,
    authorRole: "admin",
    authorEmail: admin.email,
    body: parsed.data.body,
  });

  try {
    await notifyCustomerOfReply({
      to: ticket.createdBy,
      ticketId,
      subject: ticket.subject,
      body: parsed.data.body,
    });
  } catch (e) {
    console.warn("[pocx] ticket reply email failed:", e);
  }

  insertAudit({
    workspaceId: ticket.workspaceId,
    email: admin.email,
    event: "ticket_replied",
    detail: ticketId,
    source: "dashboard",
  });
  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/tickets");
  return { ok: true, message: `Reply sent to ${ticket.createdBy}.` };
}

export async function setTicketStatusAction(
  ticketId: string,
  status: TicketStatus,
): Promise<AdminActionResult> {
  const admin = await getAdminContext();
  if (!admin) return err("Not signed in.");
  if (!["open", "pending", "closed"].includes(status)) {
    return err("Invalid status.");
  }
  const ticket = getTicket(ticketId);
  if (!ticket) return err("Ticket not found.");

  setTicketStatus(ticketId, status);
  insertAudit({
    workspaceId: ticket.workspaceId,
    email: admin.email,
    event: `ticket_${status}`,
    detail: ticketId,
    source: "dashboard",
  });
  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/tickets");
  return { ok: true };
}
