import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./client";
import {
  tickets,
  ticketMessages,
  type TicketRow,
  type TicketMessageRow,
} from "./schema";
import { newTicketId, newTicketMessageId } from "@/lib/ids";

/**
 * Support tickets. Status machine:
 *   open    — needs an admin reply (new ticket, or customer replied)
 *   pending — admin replied, waiting on the customer
 *   closed  — resolved (either side can reopen by replying)
 */

export type TicketStatus = "open" | "pending" | "closed";

export function createTicket(input: {
  workspaceId: string;
  createdBy: string;
  subject: string;
  body: string;
}): TicketRow {
  const db = getDb();
  const now = new Date();
  const id = newTicketId();
  db.insert(tickets)
    .values({
      id,
      workspaceId: input.workspaceId,
      createdBy: input.createdBy,
      subject: input.subject,
      status: "open",
      createdAt: now,
      updatedAt: now,
    })
    .run();
  db.insert(ticketMessages)
    .values({
      id: newTicketMessageId(),
      ticketId: id,
      authorRole: "customer",
      authorEmail: input.createdBy,
      body: input.body,
      createdAt: now,
    })
    .run();
  return db.select().from(tickets).where(eq(tickets.id, id)).get()!;
}

export function getTicket(id: string): TicketRow | null {
  return getDb().select().from(tickets).where(eq(tickets.id, id)).get() ?? null;
}

export function listWorkspaceTickets(workspaceId: string): TicketRow[] {
  return getDb()
    .select()
    .from(tickets)
    .where(eq(tickets.workspaceId, workspaceId))
    .orderBy(desc(tickets.updatedAt))
    .all();
}

export function listAllTickets(status?: TicketStatus): TicketRow[] {
  const db = getDb();
  const q = db.select().from(tickets);
  return (status ? q.where(eq(tickets.status, status)) : q)
    .orderBy(desc(tickets.updatedAt))
    .limit(500)
    .all();
}

export function countTickets(status: TicketStatus): number {
  const row = getDb()
    .select({ n: sql<number>`count(*)` })
    .from(tickets)
    .where(eq(tickets.status, status))
    .get();
  return row?.n ?? 0;
}

export function listTicketMessages(ticketId: string): TicketMessageRow[] {
  return getDb()
    .select()
    .from(ticketMessages)
    .where(eq(ticketMessages.ticketId, ticketId))
    .orderBy(ticketMessages.createdAt)
    .all();
}

/**
 * Append a message and advance the status machine: a customer message
 * (re)opens the ticket, an admin message marks it pending-on-customer.
 */
export function addTicketMessage(input: {
  ticketId: string;
  authorRole: "customer" | "admin";
  authorEmail: string;
  body: string;
}): TicketMessageRow {
  const db = getDb();
  const now = new Date();
  const id = newTicketMessageId();
  db.insert(ticketMessages)
    .values({ id, ...input, createdAt: now })
    .run();
  db.update(tickets)
    .set({
      updatedAt: now,
      status: input.authorRole === "customer" ? "open" : "pending",
    })
    .where(eq(tickets.id, input.ticketId))
    .run();
  return db
    .select()
    .from(ticketMessages)
    .where(eq(ticketMessages.id, id))
    .get()!;
}

export function setTicketStatus(id: string, status: TicketStatus): void {
  getDb()
    .update(tickets)
    .set({ status, updatedAt: new Date() })
    .where(eq(tickets.id, id))
    .run();
}

/** Ticket if it belongs to the workspace — customer-side ownership check. */
export function getWorkspaceTicket(
  workspaceId: string,
  ticketId: string,
): TicketRow | null {
  return (
    getDb()
      .select()
      .from(tickets)
      .where(and(eq(tickets.id, ticketId), eq(tickets.workspaceId, workspaceId)))
      .get() ?? null
  );
}
