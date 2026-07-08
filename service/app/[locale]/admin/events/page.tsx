import type { Metadata } from "next";
import Link from "next/link";
import { Filter } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { platformAudit } from "@/lib/db/platform";
import { Badge, buttonCn, EmptyState, Mono, Table, Td, Th } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Events — POCX ops" };

const KNOWN_EVENTS = [
  "gate_otp_verified",
  "gate_access_denied",
  "gate_terms_accepted",
  "plan_upgraded",
  "plan_downgraded",
  "payment_failed",
  "ticket_created",
  "nudge_sent",
  "admin_login",
  "evaluator_added",
  "sdk_grant_exchanged",
];

function eventTone(event: string): "neutral" | "success" | "danger" {
  if (event.includes("denied") || event.includes("failed")) return "danger";
  if (
    event.includes("verified") ||
    event.includes("accepted") ||
    event.includes("upgraded")
  )
    return "success";
  return "neutral";
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  await requireAdmin();
  const event = ((await searchParams).event ?? "").trim();

  const rows = platformAudit(200, event || undefined);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Ops console</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900">
          Event stream
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          The 200 most recent platform audit rows{event ? "" : ", all events"}.
        </p>
      </div>

      <form action="/admin/events" method="get" className="flex items-center gap-2">
        <select
          name="event"
          defaultValue={event}
          aria-label="Filter by event"
          className="rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 focus:border-ink-700 focus:outline-none focus:ring-2 focus:ring-ink-900/10"
        >
          <option value="">All events</option>
          {KNOWN_EVENTS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <button type="submit" className={buttonCn("secondary")}>
          <Filter className="h-4 w-4" aria-hidden />
          Filter
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title="No events"
          hint={
            event
              ? `Nothing logged for "${event}" yet.`
              : "The audit trail fills in as the platform gets used."
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Time</Th>
              <Th>Event</Th>
              <Th>Workspace</Th>
              <Th>PoC</Th>
              <Th>Email</Th>
              <Th>Detail</Th>
              <Th>Source</Th>
              <Th>IP</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <Td className="whitespace-nowrap font-mono text-xs text-ink-500">
                  {formatDateTime(a.createdAt)}
                </Td>
                <Td>
                  <Badge tone={eventTone(a.event)}>{a.event}</Badge>
                </Td>
                <Td>
                  {a.workspaceId ? (
                    <Link
                      href={`/admin/workspaces/${a.workspaceId}`}
                      className="font-mono text-xs text-ink-700 hover:underline"
                    >
                      {a.workspaceId}
                    </Link>
                  ) : (
                    <span className="text-ink-400">—</span>
                  )}
                </Td>
                <Td>
                  {a.pocId ? (
                    <Mono>{a.pocId}</Mono>
                  ) : (
                    <span className="text-ink-400">—</span>
                  )}
                </Td>
                <Td className="text-ink-700">{a.email ?? "—"}</Td>
                <Td className="max-w-[14rem]">
                  <span
                    className="block truncate text-ink-500"
                    title={a.detail ?? undefined}
                  >
                    {a.detail ?? "—"}
                  </span>
                </Td>
                <Td className="font-mono text-xs text-ink-500">{a.source}</Td>
                <Td className="font-mono text-xs text-ink-500">
                  {a.ip ?? "—"}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
