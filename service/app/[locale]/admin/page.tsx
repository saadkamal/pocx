import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import {
  dailySignups,
  outboundEmailCount,
  platformAudit,
  platformTotals,
  recentPaymentFailures,
} from "@/lib/db/platform";
import { countTickets } from "@/lib/db/tickets";
import { Badge, Card, CardTitle, Table, Td, Th } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview — POCX ops" };

function eventTone(
  event: string,
): "neutral" | "success" | "danger" {
  if (event.includes("denied") || event.includes("failed")) return "danger";
  if (
    event.includes("verified") ||
    event.includes("accepted") ||
    event.includes("upgraded")
  )
    return "success";
  return "neutral";
}

function StatCard({
  label,
  value,
  note,
  href,
}: {
  label: string;
  value: string | number;
  note?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="eyebrow">{label}</p>
      <p className="mt-2 flex items-baseline gap-2 text-2xl font-bold tracking-tight text-ink-900">
        {value}
        {href ? (
          <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
        ) : null}
      </p>
      {note ? (
        <p className="mt-1 text-xs font-medium text-success">{note}</p>
      ) : null}
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-xl border border-ink-200 bg-paper p-6 shadow-card transition-colors hover:border-ink-400"
      >
        {body}
      </Link>
    );
  }
  return <Card>{body}</Card>;
}

export default async function AdminOverviewPage() {
  await requireAdmin();

  const totals = platformTotals();
  const signups = dailySignups(14);
  const failures = recentPaymentFailures(30);
  const activity = platformAudit(30);
  const openTickets = countTickets("open");
  const emails7d = outboundEmailCount(7);
  const mockMail = !process.env.RESEND_API_KEY;

  const maxSignups = Math.max(1, ...signups.map((s) => s.count));

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Ops console</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900">
          Overview
        </h1>
      </div>

      {mockMail ? (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-subtle px-4 py-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            <span className="font-semibold">Mock mail mode.</span>{" "}
            RESEND_API_KEY is not set — outbound email (OTP codes, nudges,
            signed terms) is only written to the outbound_emails table, not
            delivered.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Workspaces"
          value={totals.workspaces}
          note={
            totals.workspacesLast7d > 0
              ? `+${totals.workspacesLast7d} this week`
              : undefined
          }
        />
        <StatCard label="Pro subscriptions" value={totals.proWorkspaces} />
        <StatCard
          label="MRR (approx)"
          value={`US$${totals.mrrUsd.toLocaleString("en-US")}`}
        />
        <StatCard label="Active PoCs" value={totals.pocs} />
        <StatCard label="Evaluators" value={totals.evaluators} />
        <StatCard label="Signatures" value={totals.signatures} />
        <StatCard label="Live gate sessions" value={totals.liveGateSessions} />
        <StatCard
          label="Open tickets"
          value={openTickets}
          href="/admin/tickets"
        />
      </div>

      <Card>
        <CardTitle>Signups — last 14 days</CardTitle>
        <div className="mt-4 flex h-28 items-end gap-1.5">
          {signups.map((s) => (
            <div
              key={s.day}
              className="flex h-full flex-1 flex-col justify-end"
              title={`${s.day}: ${s.count} signup${s.count === 1 ? "" : "s"}`}
            >
              {s.count > 0 ? (
                <div
                  className="w-full rounded-t-sm bg-ink-900"
                  style={{
                    height: `${Math.max(6, Math.round((s.count / maxSignups) * 100))}%`,
                  }}
                />
              ) : (
                <div className="h-[2px] w-full rounded-t-sm bg-ink-200" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5">
          {signups.map((s, i) => (
            <p
              key={s.day}
              className="flex-1 text-center font-mono text-[0.625rem] text-ink-400"
            >
              {i % 3 === 0 || i === signups.length - 1 ? s.day.slice(5) : ""}
            </p>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Payment failures (30d)</CardTitle>
        {failures.length === 0 ? (
          <p className="mt-2 text-sm text-ink-500">
            None — billing is behaving.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {failures.map((f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-danger/20 bg-danger-subtle px-3 py-2 text-sm"
              >
                <span className="font-mono text-xs text-ink-500">
                  {formatDateTime(f.createdAt)}
                </span>
                {f.workspaceId ? (
                  <Link
                    href={`/admin/workspaces/${f.workspaceId}`}
                    className="font-mono text-xs font-semibold text-ink-800 hover:underline"
                  >
                    {f.workspaceId}
                  </Link>
                ) : null}
                <span className="text-ink-700">{f.email ?? "—"}</span>
                {f.detail ? (
                  <span className="text-danger">{f.detail}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 font-mono text-xs text-ink-400">
          Outbound email, last 7 days: {emails7d}
        </p>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <CardTitle className="mb-0">Recent activity</CardTitle>
          <Link
            href="/admin/events"
            className="text-sm font-medium text-brand hover:underline"
          >
            Full event stream →
          </Link>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Time</Th>
              <Th>Event</Th>
              <Th>Workspace</Th>
              <Th>Email</Th>
              <Th>Detail</Th>
            </tr>
          </thead>
          <tbody>
            {activity.length === 0 ? (
              <tr>
                <Td className="text-ink-500">No activity yet.</Td>
                <Td /> <Td /> <Td /> <Td />
              </tr>
            ) : (
              activity.map((a) => (
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
                  <Td className="text-ink-700">{a.email ?? "—"}</Td>
                  <Td className="max-w-[16rem]">
                    <span className="block truncate text-ink-500" title={a.detail ?? undefined}>
                      {a.detail ?? "—"}
                    </span>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
