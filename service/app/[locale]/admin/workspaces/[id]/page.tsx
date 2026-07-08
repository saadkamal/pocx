import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { platformAudit, workspaceSummary } from "@/lib/db/platform";
import {
  listOperators,
  listOutboundEmails,
  listPocs,
  pocStats,
} from "@/lib/db/repo";
import { PRO_PRICE_USD, PRO_PRICE_YEARLY_USD } from "@/lib/plans";
import { Badge, Card, CardTitle, Mono, Table, Td, Th } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import WsActions from "./ws-actions";

export const metadata: Metadata = { title: "Workspace — POCX ops" };

const NUDGE_COOLDOWN_MS = 7 * 86_400_000;

function mrrNote(ws: {
  plan: string;
  stripeSubscriptionId: string | null;
  billingInterval: string | null;
}): string {
  if (ws.plan !== "pro") return "US$0 / mo — free plan";
  if (!ws.stripeSubscriptionId) return "US$0 / mo — comped";
  if (ws.billingInterval === "year") {
    const monthly = Math.round((PRO_PRICE_YEARLY_USD / 12) * 100) / 100;
    return `US$${monthly} / mo — billed yearly (US$${PRO_PRICE_YEARLY_USD}/yr)`;
  }
  return `US$${PRO_PRICE_USD} / mo — billed monthly`;
}

export default async function AdminWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const summary = workspaceSummary(id);
  if (!summary) notFound();

  const { ws } = summary;
  const comped = ws.plan === "pro" && !ws.stripeSubscriptionId;
  const operators = listOperators(id);
  const workspacePocs = listPocs(id).map((p) => ({
    poc: p,
    stats: pocStats(p.id),
  }));
  const audit = platformAudit(500)
    .filter((a) => a.workspaceId === id)
    .slice(0, 30);
  const emails = listOutboundEmails(id, 20);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/workspaces"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          All workspaces
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            {ws.name}
          </h1>
          <Badge tone={ws.plan === "pro" ? "brand" : "neutral"}>
            {ws.plan.toUpperCase()}
          </Badge>
          {comped ? (
            <span className="font-mono text-[0.625rem] tracking-wide text-ink-400 uppercase">
              comped
            </span>
          ) : null}
          <Badge
            tone={
              summary.stage === "active"
                ? "success"
                : summary.stage === "dormant"
                  ? "warning"
                  : "neutral"
            }
          >
            {summary.stage}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-ink-600">
          <Mono>{ws.id}</Mono> · created {formatDateTime(ws.createdAt)} ·{" "}
          {mrrNote(ws)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Billing</CardTitle>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Plan</dt>
              <dd className="font-medium text-ink-900">
                {ws.plan}
                {comped ? " (comped)" : ""}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Interval</dt>
              <dd className="font-medium text-ink-900">
                {ws.billingInterval ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Cancels at period end</dt>
              <dd className="font-medium text-ink-900">
                {ws.cancelAtPeriodEnd ? "yes" : "no"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Current period ends</dt>
              <dd className="font-medium text-ink-900">
                {ws.currentPeriodEnd
                  ? formatDateTime(ws.currentPeriodEnd)
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Stripe customer</dt>
              <dd>
                {ws.stripeCustomerId ? (
                  <Mono>{ws.stripeCustomerId}</Mono>
                ) : (
                  <span className="text-ink-400">—</span>
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Stripe subscription</dt>
              <dd>
                {ws.stripeSubscriptionId ? (
                  <Mono>{ws.stripeSubscriptionId}</Mono>
                ) : (
                  <span className="text-ink-400">—</span>
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Retention offer redeemed</dt>
              <dd className="font-medium text-ink-900">
                {ws.retentionOfferRedeemedAt
                  ? formatDateTime(ws.retentionOfferRedeemedAt)
                  : "—"}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardTitle>Ops actions</CardTitle>
          <WsActions
            workspaceId={ws.id}
            stage={summary.stage}
            plan={ws.plan === "pro" ? "pro" : "free"}
            hasStripeSubscription={Boolean(ws.stripeSubscriptionId)}
            nudgeCooldownActive={Boolean(
              summary.lastNudgeAt &&
                Date.now() - summary.lastNudgeAt.getTime() < NUDGE_COOLDOWN_MS,
            )}
            lastNudgeAt={
              summary.lastNudgeAt ? formatDateTime(summary.lastNudgeAt) : null
            }
          />
        </Card>
      </div>

      <div>
        <CardTitle className="mb-3">Operators</CardTitle>
        <Table>
          <thead>
            <tr>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Created</Th>
            </tr>
          </thead>
          <tbody>
            {operators.length === 0 ? (
              <tr>
                <Td className="text-ink-500">No operators.</Td>
                <Td /> <Td /> <Td />
              </tr>
            ) : (
              operators.map((op) => (
                <tr key={op.id}>
                  <Td className="font-medium text-ink-900">{op.email}</Td>
                  <Td className="text-ink-700">{op.role}</Td>
                  <Td>
                    <Badge tone={op.disabledAt ? "danger" : "success"}>
                      {op.disabledAt ? "disabled" : "active"}
                    </Badge>
                  </Td>
                  <Td className="whitespace-nowrap font-mono text-xs text-ink-500">
                    {formatDateTime(op.createdAt)}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <div>
        <CardTitle className="mb-3">PoCs</CardTitle>
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Slug</Th>
              <Th>Status</Th>
              <Th>Evaluators</Th>
              <Th>Live sessions</Th>
              <Th>Signatures</Th>
            </tr>
          </thead>
          <tbody>
            {workspacePocs.length === 0 ? (
              <tr>
                <Td className="text-ink-500">No PoCs yet.</Td>
                <Td /> <Td /> <Td /> <Td /> <Td />
              </tr>
            ) : (
              workspacePocs.map(({ poc, stats }) => (
                <tr key={poc.id}>
                  <Td className="font-medium text-ink-900">{poc.name}</Td>
                  <Td>
                    <Mono>{poc.slug}</Mono>
                  </Td>
                  <Td>
                    <Badge tone={poc.status === "active" ? "success" : "warning"}>
                      {poc.status}
                    </Badge>
                  </Td>
                  <Td className="font-mono text-xs text-ink-700">
                    {stats.evaluators}
                  </Td>
                  <Td className="font-mono text-xs text-ink-700">
                    {stats.activeSessions}
                  </Td>
                  <Td className="font-mono text-xs text-ink-700">
                    {stats.signatures}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <div>
        <CardTitle className="mb-3">Recent workspace activity</CardTitle>
        <Table>
          <thead>
            <tr>
              <Th>Time</Th>
              <Th>Event</Th>
              <Th>Email</Th>
              <Th>Detail</Th>
            </tr>
          </thead>
          <tbody>
            {audit.length === 0 ? (
              <tr>
                <Td className="text-ink-500">
                  Nothing in the recent platform stream for this workspace.
                </Td>
                <Td /> <Td /> <Td />
              </tr>
            ) : (
              audit.map((a) => (
                <tr key={a.id}>
                  <Td className="whitespace-nowrap font-mono text-xs text-ink-500">
                    {formatDateTime(a.createdAt)}
                  </Td>
                  <Td>
                    <Badge>{a.event}</Badge>
                  </Td>
                  <Td className="text-ink-700">{a.email ?? "—"}</Td>
                  <Td className="max-w-[18rem]">
                    <span
                      className="block truncate text-ink-500"
                      title={a.detail ?? undefined}
                    >
                      {a.detail ?? "—"}
                    </span>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <div>
        <CardTitle className="mb-3">Recent emails to this workspace</CardTitle>
        <Table>
          <thead>
            <tr>
              <Th>Time</Th>
              <Th>Recipient</Th>
              <Th>Subject</Th>
            </tr>
          </thead>
          <tbody>
            {emails.length === 0 ? (
              <tr>
                <Td className="text-ink-500">No emails logged.</Td>
                <Td /> <Td />
              </tr>
            ) : (
              emails.map((m) => (
                <tr key={m.id}>
                  <Td className="whitespace-nowrap font-mono text-xs text-ink-500">
                    {formatDateTime(m.createdAt)}
                  </Td>
                  <Td className="text-ink-700">{m.recipient}</Td>
                  <Td className="max-w-[24rem]">
                    <span className="block truncate text-ink-900" title={m.subject}>
                      {m.subject}
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
