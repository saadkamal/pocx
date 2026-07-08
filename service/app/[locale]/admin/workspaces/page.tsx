import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import {
  searchWorkspaces,
  workspaceSummaries,
  workspaceSummary,
  type LifecycleStage,
  type WorkspaceSummary,
} from "@/lib/db/platform";
import { Badge, buttonCn, EmptyState, inputCn, Mono, Table, Td, Th } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Workspaces — POCX ops" };

function stageTone(
  stage: LifecycleStage,
): "neutral" | "success" | "warning" {
  if (stage === "active") return "success";
  if (stage === "dormant") return "warning";
  return "neutral";
}

export default async function AdminWorkspacesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const q = ((await searchParams).q ?? "").trim();

  const summaries: WorkspaceSummary[] = q
    ? searchWorkspaces(q)
        .map((w) => workspaceSummary(w.id))
        .filter((s): s is WorkspaceSummary => s !== null)
    : workspaceSummaries();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Ops console</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900">
          Workspaces
        </h1>
      </div>

      <form action="/admin/workspaces" method="get" className="flex max-w-lg gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by workspace, operator email, or PoC name/slug…"
          aria-label="Search workspaces"
          className={inputCn}
        />
        <button type="submit" className={buttonCn("primary")}>
          <Search className="h-4 w-4" aria-hidden />
          Search
        </button>
      </form>

      {q ? (
        <p className="text-sm text-ink-500">
          {summaries.length} result{summaries.length === 1 ? "" : "s"} for{" "}
          <Mono>{q}</Mono> —{" "}
          <Link href="/admin/workspaces" className="text-brand hover:underline">
            clear
          </Link>
        </p>
      ) : null}

      {summaries.length === 0 ? (
        <EmptyState
          title={q ? "No matches" : "No workspaces yet"}
          hint={
            q
              ? "Try part of a workspace name, an operator email, or a PoC slug."
              : "Workspaces appear here as customers sign up."
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Workspace</Th>
              <Th>Owner</Th>
              <Th>Plan</Th>
              <Th>Stage</Th>
              <Th>PoCs</Th>
              <Th>Evaluators</Th>
              <Th>Created</Th>
              <Th>Last activity</Th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => {
              const comped = s.ws.plan === "pro" && !s.ws.stripeSubscriptionId;
              return (
                <tr key={s.ws.id}>
                  <Td>
                    <Link
                      href={`/admin/workspaces/${s.ws.id}`}
                      className="font-semibold text-ink-900 hover:underline"
                    >
                      {s.ws.name}
                    </Link>
                  </Td>
                  <Td className="text-ink-700">{s.ownerEmail ?? "—"}</Td>
                  <Td>
                    <span className="inline-flex items-center gap-1.5">
                      <Badge tone={s.ws.plan === "pro" ? "brand" : "neutral"}>
                        {s.ws.plan.toUpperCase()}
                      </Badge>
                      {comped ? (
                        <span className="font-mono text-[0.625rem] tracking-wide text-ink-400 uppercase">
                          comped
                        </span>
                      ) : null}
                    </span>
                  </Td>
                  <Td>
                    <Badge tone={stageTone(s.stage)}>{s.stage}</Badge>
                  </Td>
                  <Td className="font-mono text-xs text-ink-700">
                    {s.pocCount}
                  </Td>
                  <Td className="font-mono text-xs text-ink-700">
                    {s.evaluatorCount}
                  </Td>
                  <Td className="whitespace-nowrap font-mono text-xs text-ink-500">
                    {formatDateTime(s.ws.createdAt)}
                  </Td>
                  <Td className="whitespace-nowrap font-mono text-xs text-ink-500">
                    {s.lastActivityAt ? formatDateTime(s.lastActivityAt) : "—"}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
