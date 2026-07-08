import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import {
  getTicket,
  listTicketMessages,
  type TicketStatus,
} from "@/lib/db/tickets";
import { formatDateTime } from "@/lib/utils";
import { Mono } from "@/components/ui";
import { AdminTicketBadge } from "../ticket-badge";
import { AdminThread } from "./admin-thread";

export const metadata: Metadata = { title: "Ticket — POCX admin" };

export default async function AdminTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const ticket = getTicket(id);
  if (!ticket) notFound();

  const thread = listTicketMessages(ticket.id).map((m) => ({
    id: m.id,
    authorRole: m.authorRole as "customer" | "admin",
    authorEmail: m.authorEmail,
    body: m.body,
    at: formatDateTime(m.createdAt),
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/tickets"
        className="text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        &larr; Tickets
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          {ticket.subject}
        </h1>
        <AdminTicketBadge status={ticket.status as TicketStatus} />
      </div>
      <p className="mt-1 mb-6 text-sm text-ink-500">
        Opened {formatDateTime(ticket.createdAt)} by {ticket.createdBy} in
        workspace{" "}
        <Link
          href={`/admin/workspaces/${ticket.workspaceId}`}
          className="hover:underline"
        >
          <Mono>{ticket.workspaceId}</Mono>
        </Link>
      </p>

      <AdminThread
        ticketId={ticket.id}
        status={ticket.status as TicketStatus}
        createdBy={ticket.createdBy}
        thread={thread}
      />
    </div>
  );
}
