"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getOperatorContext } from "@/lib/auth/operator";
import { insertAudit } from "@/lib/db/repo";
import {
  addTicketMessage,
  createTicket,
  getWorkspaceTicket,
} from "@/lib/db/tickets";
import { notifyAdminsOfTicket } from "@/lib/mail/support";

/** Customer-side support actions. Ownership: tickets are workspace-scoped. */

export type SupportActionResult =
  | { ok: true; ticketId?: string; message?: string }
  | { error: string };

const err = (error: string): SupportActionResult => ({ error });

const CreateSchema = z.object({
  subject: z.string().trim().min(3).max(150),
  body: z.string().trim().min(10).max(10_000),
});

export async function createTicketAction(
  formData: FormData,
): Promise<SupportActionResult> {
  const ctx = await getOperatorContext();
  if (!ctx) return err("Not signed in.");

  const parsed = CreateSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return err("Add a subject and a description (at least 10 characters).");
  }

  const ticket = createTicket({
    workspaceId: ctx.workspace.id,
    createdBy: ctx.operator.email,
    subject: parsed.data.subject,
    body: parsed.data.body,
  });

  try {
    await notifyAdminsOfTicket({
      ticketId: ticket.id,
      subject: ticket.subject,
      fromEmail: ctx.operator.email,
      workspaceName: ctx.workspace.name,
      body: parsed.data.body,
      isNew: true,
    });
  } catch (e) {
    console.warn("[pocx] ticket notification failed:", e);
  }

  insertAudit({
    workspaceId: ctx.workspace.id,
    email: ctx.operator.email,
    event: "ticket_created",
    detail: ticket.id,
    source: "dashboard",
  });
  revalidatePath("/dashboard/support");
  return { ok: true, ticketId: ticket.id };
}

const ReplySchema = z.object({ body: z.string().trim().min(1).max(10_000) });

export async function replyTicketAction(
  ticketId: string,
  formData: FormData,
): Promise<SupportActionResult> {
  const ctx = await getOperatorContext();
  if (!ctx) return err("Not signed in.");

  const ticket = getWorkspaceTicket(ctx.workspace.id, ticketId);
  if (!ticket) return err("Ticket not found.");

  const parsed = ReplySchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return err("Write a message first.");

  addTicketMessage({
    ticketId,
    authorRole: "customer",
    authorEmail: ctx.operator.email,
    body: parsed.data.body,
  });

  try {
    await notifyAdminsOfTicket({
      ticketId,
      subject: ticket.subject,
      fromEmail: ctx.operator.email,
      workspaceName: ctx.workspace.name,
      body: parsed.data.body,
      isNew: false,
    });
  } catch (e) {
    console.warn("[pocx] ticket notification failed:", e);
  }

  revalidatePath(`/dashboard/support/${ticketId}`);
  revalidatePath("/dashboard/support");
  return { ok: true };
}
