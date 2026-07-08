import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { workspaceSummaries } from "@/lib/db/platform";
import { formatDateTime } from "@/lib/utils";
import FunnelClient, { type FunnelRow } from "./funnel-client";

export const metadata: Metadata = { title: "Funnel — POCX ops" };

const NUDGE_COOLDOWN_MS = 7 * 86_400_000;

export default async function AdminFunnelPage() {
  await requireAdmin();

  const rows: FunnelRow[] = workspaceSummaries().map((s) => ({
    id: s.ws.id,
    name: s.ws.name,
    ownerEmail: s.ownerEmail,
    plan: s.ws.plan === "pro" ? "pro" : "free",
    pocCount: s.pocCount,
    evaluatorCount: s.evaluatorCount,
    stage: s.stage,
    daysInStage: s.daysInStage,
    lastNudgeAt: s.lastNudgeAt ? formatDateTime(s.lastNudgeAt) : null,
    nudgeCooldownActive: Boolean(
      s.lastNudgeAt &&
        Date.now() - s.lastNudgeAt.getTime() < NUDGE_COOLDOWN_MS,
    ),
    createdAt: formatDateTime(s.ws.createdAt),
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Ops console</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900">
          Lifecycle funnel
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          Every workspace, grouped by how far it has made it. Nudge the stuck
          ones — one email per workspace per week, tops.
        </p>
      </div>
      <FunnelClient rows={rows} />
    </div>
  );
}
