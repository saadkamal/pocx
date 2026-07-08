"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Badge, buttonCn, EmptyState } from "@/components/ui";
import { sendNudgeAction } from "../actions";

/** Matches LifecycleStage in lib/db/platform.ts (kept local: that module is server-only). */
type Stage =
  | "no_poc"
  | "no_evaluators"
  | "not_connected"
  | "no_logins"
  | "active"
  | "dormant";

export type FunnelRow = {
  id: string;
  name: string;
  ownerEmail: string | null;
  plan: "free" | "pro";
  pocCount: number;
  evaluatorCount: number;
  stage: Stage;
  daysInStage: number;
  lastNudgeAt: string | null;
  nudgeCooldownActive: boolean;
  createdAt: string;
};

const STAGES: Array<{ id: Stage; label: string; blurb: string }> = [
  { id: "no_poc", label: "No PoC", blurb: "Signed up, never created a PoC" },
  {
    id: "no_evaluators",
    label: "No evaluators",
    blurb: "PoC exists, nobody invited",
  },
  {
    id: "not_connected",
    label: "Not connected",
    blurb: "Invited, but the SDK never called us",
  },
  {
    id: "no_logins",
    label: "No logins",
    blurb: "Connected — no evaluator has signed in",
  },
  {
    id: "active",
    label: "Active",
    blurb: "Evaluator login in the last 14 days",
  },
  { id: "dormant", label: "Dormant", blurb: "No logins for 14+ days" },
];

type NudgeResult = { ok: boolean; text: string };

export default function FunnelClient({ rows }: { rows: FunnelRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, NudgeResult>>({});

  function nudge(id: string) {
    setBusyId(id);
    startTransition(async () => {
      const res = await sendNudgeAction(id);
      setResults((prev) => ({
        ...prev,
        [id]:
          "error" in res
            ? { ok: false, text: res.error }
            : { ok: true, text: res.message ?? "Nudge sent." },
      }));
      setBusyId(null);
      if ("ok" in res) router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No workspaces yet"
        hint="The funnel fills in as customers sign up."
      />
    );
  }

  return (
    <div className="space-y-8">
      {STAGES.map((stage) => {
        const group = rows.filter((r) => r.stage === stage.id);
        return (
          <section key={stage.id}>
            <div className="mb-3 flex items-baseline gap-3">
              <h2 className="text-base font-semibold text-ink-900">
                {stage.label}
              </h2>
              <span className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-xs font-semibold text-ink-600">
                {group.length}
              </span>
              <p className="text-sm text-ink-500">{stage.blurb}</p>
            </div>

            {group.length === 0 ? (
              <p className="rounded-lg border border-dashed border-ink-200 px-4 py-3 text-sm text-ink-400">
                Nobody here.
              </p>
            ) : (
              <ul className="divide-y divide-ink-100 rounded-xl border border-ink-200 bg-paper shadow-card">
                {group.map((r) => {
                  const result = results[r.id];
                  const busy = pending && busyId === r.id;
                  return (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/admin/workspaces/${r.id}`}
                            className="truncate text-sm font-semibold text-ink-900 hover:underline"
                          >
                            {r.name}
                          </Link>
                          <Badge tone={r.plan === "pro" ? "brand" : "neutral"}>
                            {r.plan.toUpperCase()}
                          </Badge>
                          <Badge
                            tone={r.daysInStage > 7 ? "warning" : "neutral"}
                          >
                            {r.daysInStage} day{r.daysInStage === 1 ? "" : "s"}
                          </Badge>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-ink-500">
                          {r.ownerEmail ?? "no owner email"} · {r.pocCount} PoC
                          {r.pocCount === 1 ? "" : "s"} · {r.evaluatorCount}{" "}
                          evaluator{r.evaluatorCount === 1 ? "" : "s"} · created{" "}
                          {r.createdAt}
                        </p>
                        {result ? (
                          <p
                            className={
                              result.ok
                                ? "mt-1 text-xs font-medium text-success"
                                : "mt-1 text-xs font-medium text-danger"
                            }
                          >
                            {result.text}
                          </p>
                        ) : null}
                      </div>

                      {r.stage !== "active" ? (
                        <button
                          type="button"
                          onClick={() => nudge(r.id)}
                          disabled={busy || r.nudgeCooldownActive}
                          title={
                            r.nudgeCooldownActive && r.lastNudgeAt
                              ? `Nudged ${r.lastNudgeAt}`
                              : undefined
                          }
                          className={buttonCn("secondary", "sm")}
                        >
                          <Send className="h-3.5 w-3.5" aria-hidden />
                          {busy
                            ? "Sending…"
                            : r.nudgeCooldownActive
                              ? `Nudged ${r.lastNudgeAt ?? "recently"}`
                              : "Send nudge"}
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
