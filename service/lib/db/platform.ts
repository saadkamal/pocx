import "server-only";
import { and, desc, eq, gt, isNull, like, or, sql } from "drizzle-orm";
import { getDb } from "./client";
import {
  workspaces,
  operators,
  pocs,
  evaluators,
  sessions,
  acceptances,
  auditLogs,
  outboundEmails,
  type WorkspaceRow,
  type AuditLogRow,
} from "./schema";
import { PRO_PRICE_USD, PRO_PRICE_YEARLY_USD } from "@/lib/plans";

/**
 * Platform-level queries for the owner's operations console (/admin).
 * Everything here is cross-tenant by design and must only ever be reached
 * through the admin realm.
 */

/* --- Totals & revenue --- */

export type PlatformTotals = {
  workspaces: number;
  workspacesLast7d: number;
  proWorkspaces: number;
  pocs: number;
  evaluators: number;
  signatures: number;
  liveGateSessions: number;
  mrrUsd: number; // monthly×39 + yearly×(320/12), ignores coupons
};

export function platformTotals(): PlatformTotals {
  const db = getDb();
  const count = (q: { n: number } | undefined) => q?.n ?? 0;
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);

  const monthly = count(
    db
      .select({ n: sql<number>`count(*)` })
      .from(workspaces)
      .where(
        and(eq(workspaces.plan, "pro"), eq(workspaces.billingInterval, "month")),
      )
      .get(),
  );
  const yearly = count(
    db
      .select({ n: sql<number>`count(*)` })
      .from(workspaces)
      .where(
        and(eq(workspaces.plan, "pro"), eq(workspaces.billingInterval, "year")),
      )
      .get(),
  );

  return {
    workspaces: count(
      db.select({ n: sql<number>`count(*)` }).from(workspaces).get(),
    ),
    workspacesLast7d: count(
      db
        .select({ n: sql<number>`count(*)` })
        .from(workspaces)
        .where(gt(workspaces.createdAt, weekAgo))
        .get(),
    ),
    proWorkspaces: count(
      db
        .select({ n: sql<number>`count(*)` })
        .from(workspaces)
        .where(eq(workspaces.plan, "pro"))
        .get(),
    ),
    pocs: count(
      db
        .select({ n: sql<number>`count(*)` })
        .from(pocs)
        .where(isNull(pocs.archivedAt))
        .get(),
    ),
    evaluators: count(
      db
        .select({ n: sql<number>`count(*)` })
        .from(evaluators)
        .where(isNull(evaluators.disabledAt))
        .get(),
    ),
    signatures: count(
      db.select({ n: sql<number>`count(*)` }).from(acceptances).get(),
    ),
    liveGateSessions: count(
      db
        .select({ n: sql<number>`count(*)` })
        .from(sessions)
        .where(
          and(
            eq(sessions.kind, "gate"),
            isNull(sessions.revokedAt),
            gt(sessions.expiresAt, new Date()),
          ),
        )
        .get(),
    ),
    mrrUsd:
      Math.round(
        (monthly * PRO_PRICE_USD + (yearly * PRO_PRICE_YEARLY_USD) / 12) * 100,
      ) / 100,
  };
}

/** Signups per day for the last `days` days (oldest first). */
export function dailySignups(days = 14): Array<{ day: string; count: number }> {
  const rows = getDb()
    .select({
      day: sql<string>`date(created_at / 1000, 'unixepoch')`,
      count: sql<number>`count(*)`,
    })
    .from(workspaces)
    .where(gt(workspaces.createdAt, new Date(Date.now() - days * 86_400_000)))
    .groupBy(sql`date(created_at / 1000, 'unixepoch')`)
    .all();
  const byDay = new Map(rows.map((r) => [r.day, r.count]));
  const out: Array<{ day: string; count: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86_400_000)
      .toISOString()
      .slice(0, 10);
    out.push({ day, count: byDay.get(day) ?? 0 });
  }
  return out;
}

/* --- Lifecycle funnel --- */

export type LifecycleStage =
  | "no_poc" // signed up, never created a PoC
  | "no_evaluators" // PoC exists, nobody invited
  | "not_connected" // evaluators invited, SDK never called us
  | "no_logins" // connected, but no evaluator ever signed in
  | "active" // evaluator login within 14 days
  | "dormant"; // had logins, none in 14 days

export const STAGE_ORDER: LifecycleStage[] = [
  "no_poc",
  "no_evaluators",
  "not_connected",
  "no_logins",
  "active",
  "dormant",
];

export type WorkspaceSummary = {
  ws: WorkspaceRow;
  ownerEmail: string | null;
  pocCount: number;
  evaluatorCount: number;
  stage: LifecycleStage;
  lastActivityAt: Date | null; // newest audit row for the workspace
  lastNudgeAt: Date | null;
  daysInStage: number;
};

const ACTIVE_WINDOW_MS = 14 * 86_400_000;

function summarize(ws: WorkspaceRow): WorkspaceSummary {
  const db = getDb();
  const n = (q: { n: number } | undefined) => q?.n ?? 0;

  const pocCount = n(
    db
      .select({ n: sql<number>`count(*)` })
      .from(pocs)
      .where(and(eq(pocs.workspaceId, ws.id), isNull(pocs.archivedAt)))
      .get(),
  );
  const evaluatorCount = n(
    db
      .select({ n: sql<number>`count(*)` })
      .from(evaluators)
      .innerJoin(pocs, eq(evaluators.pocId, pocs.id))
      .where(and(eq(pocs.workspaceId, ws.id), isNull(evaluators.disabledAt)))
      .get(),
  );
  const hasSdk =
    n(
      db
        .select({ n: sql<number>`count(*)` })
        .from(auditLogs)
        .where(
          and(eq(auditLogs.workspaceId, ws.id), eq(auditLogs.source, "sdk")),
        )
        .get(),
    ) > 0;
  const lastLogin = db
    .select({ at: sql<number>`max(created_at)` })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.workspaceId, ws.id),
        eq(auditLogs.event, "gate_otp_verified"),
      ),
    )
    .get();
  const lastActivity = db
    .select({ at: sql<number>`max(created_at)` })
    .from(auditLogs)
    .where(eq(auditLogs.workspaceId, ws.id))
    .get();
  const lastNudge = db
    .select({ at: sql<number>`max(created_at)` })
    .from(auditLogs)
    .where(
      and(eq(auditLogs.workspaceId, ws.id), eq(auditLogs.event, "nudge_sent")),
    )
    .get();
  const owner = db
    .select({ email: operators.email })
    .from(operators)
    .where(
      and(eq(operators.workspaceId, ws.id), eq(operators.role, "owner")),
    )
    .get();

  const lastLoginAt = lastLogin?.at ? new Date(lastLogin.at) : null;
  let stage: LifecycleStage;
  if (pocCount === 0) stage = "no_poc";
  else if (evaluatorCount === 0) stage = "no_evaluators";
  else if (!hasSdk) stage = "not_connected";
  else if (!lastLoginAt) stage = "no_logins";
  else if (Date.now() - lastLoginAt.getTime() <= ACTIVE_WINDOW_MS)
    stage = "active";
  else stage = "dormant";

  const lastActivityAt = lastActivity?.at ? new Date(lastActivity.at) : null;
  // "Stuck since": last forward motion (any activity), else signup.
  const stuckSince =
    stage === "active"
      ? lastLoginAt!
      : (lastActivityAt ?? ws.createdAt);
  const daysInStage = Math.max(
    0,
    Math.floor((Date.now() - stuckSince.getTime()) / 86_400_000),
  );

  return {
    ws,
    ownerEmail: owner?.email ?? null,
    pocCount,
    evaluatorCount,
    stage,
    lastActivityAt,
    lastNudgeAt: lastNudge?.at ? new Date(lastNudge.at) : null,
    daysInStage,
  };
}

export function workspaceSummaries(): WorkspaceSummary[] {
  return getDb()
    .select()
    .from(workspaces)
    .orderBy(desc(workspaces.createdAt))
    .all()
    .map(summarize);
}

export function workspaceSummary(id: string): WorkspaceSummary | null {
  const ws =
    getDb().select().from(workspaces).where(eq(workspaces.id, id)).get() ??
    null;
  return ws ? summarize(ws) : null;
}

/** Search workspaces by name, operator email, or PoC name/slug. */
export function searchWorkspaces(q: string): WorkspaceRow[] {
  const db = getDb();
  const pattern = `%${q.trim().toLowerCase()}%`;
  const byOperator = db
    .select({ id: operators.workspaceId })
    .from(operators)
    .where(like(operators.email, pattern))
    .all()
    .map((r) => r.id);
  const byPoc = db
    .select({ id: pocs.workspaceId })
    .from(pocs)
    .where(or(like(pocs.slug, pattern), like(sql`lower(${pocs.name})`, pattern)))
    .all()
    .map((r) => r.id);
  const ids = new Set([...byOperator, ...byPoc]);
  const direct = db
    .select()
    .from(workspaces)
    .where(like(sql`lower(${workspaces.name})`, pattern))
    .all();
  for (const w of direct) ids.add(w.id);
  return [...ids]
    .map(
      (id) =>
        db.select().from(workspaces).where(eq(workspaces.id, id)).get() ?? null,
    )
    .filter((w): w is WorkspaceRow => Boolean(w));
}

/* --- Platform event stream --- */

export function platformAudit(limit = 100, event?: string): AuditLogRow[] {
  const db = getDb();
  const q = db.select().from(auditLogs);
  return (event ? q.where(eq(auditLogs.event, event)) : q)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .all();
}

export function recentPaymentFailures(days = 30): AuditLogRow[] {
  return getDb()
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.event, "payment_failed"),
        gt(auditLogs.createdAt, new Date(Date.now() - days * 86_400_000)),
      ),
    )
    .orderBy(desc(auditLogs.createdAt))
    .all();
}

/** Recent outbound email count (mock or real) — deliverability pulse. */
export function outboundEmailCount(days = 7): number {
  const row = getDb()
    .select({ n: sql<number>`count(*)` })
    .from(outboundEmails)
    .where(gt(outboundEmails.createdAt, new Date(Date.now() - days * 86_400_000)))
    .get();
  return row?.n ?? 0;
}
