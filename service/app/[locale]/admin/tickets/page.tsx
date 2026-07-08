import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import {
  countTickets,
  listAllTickets,
  type TicketStatus,
} from "@/lib/db/tickets";
import { formatDateTime, cn } from "@/lib/utils";
import { EmptyState, Mono, Table, Td, Th } from "@/components/ui";
import { AdminTicketBadge } from "./ticket-badge";

export const metadata: Metadata = { title: "Tickets — POCX admin" };

type Filter = "all" | TicketStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "pending", label: "Pending" },
  { key: "closed", label: "Closed" },
  { key: "all", label: "All" },
];

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();

  const raw = (await searchParams).status;
  const filter: Filter =
    raw === "all" || raw === "open" || raw === "pending" || raw === "closed"
      ? raw
      : "open";

  const counts: Record<TicketStatus, number> = {
    open: countTickets("open"),
    pending: countTickets("pending"),
    closed: countTickets("closed"),
  };
  const countFor = (f: Filter): number =>
    f === "all" ? counts.open + counts.pending + counts.closed : counts[f];

  const rows = listAllTickets(filter === "all" ? undefined : filter).map(
    (t) => ({
      id: t.id,
      subject: t.subject,
      workspaceId: t.workspaceId,
      createdBy: t.createdBy,
      status: t.status as TicketStatus,
      updated: formatDateTime(t.updatedAt),
    }),
  );

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">
        Tickets
      </h1>
      <p className="mt-2 mb-6 text-sm text-ink-600">
        Support tickets across every workspace. &ldquo;Open&rdquo; means the
        ball is in our court.
      </p>

      <div className="mb-4 flex flex-wrap gap-2" aria-label="Ticket filters">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/tickets?status=${f.key}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              filter === f.key
                ? "border-ink-900 bg-ink-900 text-paper"
                : "border-ink-300 bg-paper text-ink-600 hover:border-ink-500 hover:text-ink-900",
            )}
          >
            {f.label}
            <span
              className={cn(
                "text-xs tabular-nums",
                filter === f.key ? "text-paper/70" : "text-ink-400",
              )}
            >
              {countFor(f.key)}
            </span>
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No tickets here"
          hint={
            filter === "open"
              ? "Inbox zero — nothing is waiting on a reply."
              : "Nothing matches this filter."
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Subject</Th>
              <Th>Workspace</Th>
              <Th>From</Th>
              <Th>Status</Th>
              <Th>Updated</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <Td>
                  <Link
                    href={`/admin/tickets/${row.id}`}
                    className="font-medium text-ink-900 hover:text-brand hover:underline"
                  >
                    {row.subject}
                  </Link>
                </Td>
                <Td>
                  <Link
                    href={`/admin/workspaces/${row.workspaceId}`}
                    className="hover:underline"
                  >
                    <Mono>{row.workspaceId}</Mono>
                  </Link>
                </Td>
                <Td className="text-ink-600">{row.createdBy}</Td>
                <Td>
                  <AdminTicketBadge status={row.status} />
                </Td>
                <Td className="text-ink-600">{row.updated}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
