import "server-only";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb } from "./client";
import {
  workspaces,
  operators,
  pocs,
  evaluators,
  otpCodes,
  sessions,
  grants,
  acceptances,
  auditLogs,
  outboundEmails,
  type WorkspaceRow,
  type OperatorRow,
  type PocRow,
  type EvaluatorRow,
  type OtpCodeRow,
  type SessionRow,
  type GrantRow,
  type AcceptanceRow,
  type AuditLogRow,
  type OutboundEmailRow,
} from "./schema";

/* ============================================================
   Repository layer — every query in one place, sync (better-sqlite3).
   ============================================================ */

/* --- Workspaces --- */

export function createWorkspace(input: { id: string; name: string }): void {
  getDb()
    .insert(workspaces)
    .values({ ...input, createdAt: new Date() })
    .run();
}

export function getWorkspace(id: string): WorkspaceRow | null {
  return (
    getDb().select().from(workspaces).where(eq(workspaces.id, id)).get() ?? null
  );
}

export function renameWorkspace(id: string, name: string): void {
  getDb().update(workspaces).set({ name }).where(eq(workspaces.id, id)).run();
}

export function setWorkspacePlan(
  id: string,
  plan: "free" | "pro",
  stripe?: { customerId?: string | null; subscriptionId?: string | null },
): void {
  getDb()
    .update(workspaces)
    .set({
      plan,
      upgradedAt: plan === "pro" ? new Date() : null,
      ...(stripe?.customerId !== undefined
        ? { stripeCustomerId: stripe.customerId }
        : {}),
      ...(stripe?.subscriptionId !== undefined
        ? { stripeSubscriptionId: stripe.subscriptionId }
        : {}),
    })
    .where(eq(workspaces.id, id))
    .run();
}

/* --- Operators --- */

export function createOperator(input: {
  id: string;
  workspaceId: string;
  email: string;
  name?: string | null;
  role?: string;
  addedBy?: string;
}): void {
  getDb()
    .insert(operators)
    .values({
      id: input.id,
      workspaceId: input.workspaceId,
      email: input.email,
      name: input.name ?? null,
      role: input.role ?? "owner",
      addedBy: input.addedBy ?? "signup",
      createdAt: new Date(),
    })
    .run();
}

export function getOperatorById(id: string): OperatorRow | null {
  return (
    getDb().select().from(operators).where(eq(operators.id, id)).get() ?? null
  );
}

export function getOperatorByEmail(email: string): OperatorRow | null {
  return (
    getDb().select().from(operators).where(eq(operators.email, email)).get() ??
    null
  );
}

export function listOperators(workspaceId: string): OperatorRow[] {
  return getDb()
    .select()
    .from(operators)
    .where(eq(operators.workspaceId, workspaceId))
    .orderBy(operators.createdAt)
    .all();
}

export function setOperatorDisabled(id: string, disabled: boolean): void {
  getDb()
    .update(operators)
    .set({ disabledAt: disabled ? new Date() : null })
    .where(eq(operators.id, id))
    .run();
}

/* --- PoCs --- */

export function createPoc(
  input: Omit<PocRow, "createdAt" | "archivedAt"> & { createdAt?: Date },
): void {
  getDb()
    .insert(pocs)
    .values({ ...input, createdAt: input.createdAt ?? new Date() })
    .run();
}

export function getPocById(id: string): PocRow | null {
  return getDb().select().from(pocs).where(eq(pocs.id, id)).get() ?? null;
}

export function getPocBySlug(slug: string): PocRow | null {
  return getDb().select().from(pocs).where(eq(pocs.slug, slug)).get() ?? null;
}

export function getPocByPublicKey(publicKey: string): PocRow | null {
  return (
    getDb().select().from(pocs).where(eq(pocs.publicKey, publicKey)).get() ??
    null
  );
}

export function listPocs(workspaceId: string): PocRow[] {
  return getDb()
    .select()
    .from(pocs)
    .where(and(eq(pocs.workspaceId, workspaceId), isNull(pocs.archivedAt)))
    .orderBy(desc(pocs.createdAt))
    .all();
}

/** Whitelisted, operator-editable PoC fields. */
export type PocUpdate = Partial<
  Pick<
    PocRow,
    | "name"
    | "ownerEntity"
    | "ownerRegNo"
    | "clientEntity"
    | "purpose"
    | "supportEmail"
    | "brandColor"
    | "logoUrl"
    | "appUrl"
    | "callbackPath"
    | "termsMode"
    | "termsCustomText"
    | "termsVersion"
    | "sessionTtlHours"
    | "idleTimeoutHours"
    | "otpTtlMinutes"
    | "status"
  >
>;

export function updatePoc(id: string, patch: PocUpdate): void {
  getDb().update(pocs).set(patch).where(eq(pocs.id, id)).run();
}

export function archivePoc(id: string): void {
  getDb()
    .update(pocs)
    .set({ archivedAt: new Date(), status: "paused" })
    .where(eq(pocs.id, id))
    .run();
}

export function rotatePocSecret(id: string, secret: string): void {
  getDb().update(pocs).set({ secret }).where(eq(pocs.id, id)).run();
}

/* --- Evaluators (per-PoC allowlist) --- */

export function addEvaluator(input: {
  id: string;
  pocId: string;
  email: string;
  name?: string | null;
  addedBy?: string;
}): void {
  getDb()
    .insert(evaluators)
    .values({
      id: input.id,
      pocId: input.pocId,
      email: input.email,
      name: input.name ?? null,
      addedBy: input.addedBy ?? "dashboard",
      createdAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [evaluators.pocId, evaluators.email],
      set: { disabledAt: null, name: input.name ?? null },
    })
    .run();
}

export function getEvaluator(pocId: string, email: string): EvaluatorRow | null {
  return (
    getDb()
      .select()
      .from(evaluators)
      .where(and(eq(evaluators.pocId, pocId), eq(evaluators.email, email)))
      .get() ?? null
  );
}

/** True when the (normalized) email is on the PoC's list and not disabled. */
export function isEvaluatorAllowed(pocId: string, email: string): boolean {
  const row = getEvaluator(pocId, email);
  return Boolean(row && !row.disabledAt);
}

export function listEvaluators(pocId: string): EvaluatorRow[] {
  return getDb()
    .select()
    .from(evaluators)
    .where(eq(evaluators.pocId, pocId))
    .orderBy(evaluators.createdAt)
    .all();
}

export function countActiveEvaluators(pocId: string): number {
  const row = getDb()
    .select({ n: sql<number>`count(*)` })
    .from(evaluators)
    .where(and(eq(evaluators.pocId, pocId), isNull(evaluators.disabledAt)))
    .get();
  return row?.n ?? 0;
}

export function setEvaluatorDisabled(id: string, disabled: boolean): void {
  getDb()
    .update(evaluators)
    .set({ disabledAt: disabled ? new Date() : null })
    .where(eq(evaluators.id, id))
    .run();
}

/* --- OTP codes --- */

export function createOtp(input: {
  id: string;
  email: string;
  codeHash: string;
  purpose: "operator" | "gate";
  pocId?: string | null;
  expiresAt: number;
}): void {
  getDb()
    .insert(otpCodes)
    .values({
      id: input.id,
      email: input.email,
      codeHash: input.codeHash,
      purpose: input.purpose,
      pocId: input.pocId ?? null,
      expiresAt: new Date(input.expiresAt),
      createdAt: new Date(),
    })
    .run();
}

function otpScope(email: string, purpose: string, pocId?: string | null) {
  const conds = [eq(otpCodes.email, email), eq(otpCodes.purpose, purpose)];
  if (pocId) conds.push(eq(otpCodes.pocId, pocId));
  return and(...conds);
}

/** The newest unconsumed, unexpired code for this email + realm. */
export function getActiveOtp(
  email: string,
  purpose: "operator" | "gate",
  pocId?: string | null,
): OtpCodeRow | null {
  return (
    getDb()
      .select()
      .from(otpCodes)
      .where(
        and(
          otpScope(email, purpose, pocId),
          isNull(otpCodes.consumedAt),
          gt(otpCodes.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1)
      .get() ?? null
  );
}

/** Recent codes (any state) — used to explain stale-code attempts. */
export function listRecentOtps(
  email: string,
  purpose: "operator" | "gate",
  pocId?: string | null,
): OtpCodeRow[] {
  return getDb()
    .select()
    .from(otpCodes)
    .where(otpScope(email, purpose, pocId))
    .orderBy(desc(otpCodes.createdAt))
    .limit(5)
    .all();
}

export function consumeOtp(id: string): void {
  getDb()
    .update(otpCodes)
    .set({ consumedAt: new Date() })
    .where(eq(otpCodes.id, id))
    .run();
}

export function incrementOtpAttempts(id: string): number {
  const db = getDb();
  db.update(otpCodes)
    .set({ attempts: sql`${otpCodes.attempts} + 1` })
    .where(eq(otpCodes.id, id))
    .run();
  const row = db.select().from(otpCodes).where(eq(otpCodes.id, id)).get();
  return row?.attempts ?? 0;
}

/* --- Sessions --- */

export function createSessionRow(input: {
  id: string;
  kind: "operator" | "gate";
  email: string;
  workspaceId?: string | null;
  pocId?: string | null;
  expiresAt: number;
  ip?: string | null;
  userAgent?: string | null;
}): void {
  const now = new Date();
  getDb()
    .insert(sessions)
    .values({
      id: input.id,
      kind: input.kind,
      email: input.email,
      workspaceId: input.workspaceId ?? null,
      pocId: input.pocId ?? null,
      createdAt: now,
      expiresAt: new Date(input.expiresAt),
      lastActiveAt: now,
      revokedAt: null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    })
    .run();
}

export function getSessionRow(id: string): SessionRow | null {
  return getDb().select().from(sessions).where(eq(sessions.id, id)).get() ?? null;
}

export function touchSession(id: string): void {
  getDb()
    .update(sessions)
    .set({ lastActiveAt: new Date() })
    .where(eq(sessions.id, id))
    .run();
}

export function revokeSession(id: string): void {
  getDb()
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.id, id))
    .run();
}

/** Revoke every live gate session for a PoC (panic button / terms bump). */
export function revokeAllGateSessions(pocId: string): number {
  const res = getDb()
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(sessions.kind, "gate"),
        eq(sessions.pocId, pocId),
        isNull(sessions.revokedAt),
      ),
    )
    .run();
  return Number(res.changes ?? 0);
}

export function listGateSessions(pocId: string, limit = 200): SessionRow[] {
  return getDb()
    .select()
    .from(sessions)
    .where(and(eq(sessions.kind, "gate"), eq(sessions.pocId, pocId)))
    .orderBy(desc(sessions.lastActiveAt))
    .limit(limit)
    .all();
}

/* --- Grants --- */

export function createGrant(input: {
  id: string;
  pocId: string;
  sessionId: string;
  email: string;
  returnTo: string;
  expiresAt: number;
}): void {
  getDb()
    .insert(grants)
    .values({
      ...input,
      expiresAt: new Date(input.expiresAt),
      createdAt: new Date(),
    })
    .run();
}

/**
 * Single-use exchange: returns the grant only if it is unconsumed and
 * unexpired, marking it consumed in the same guarded UPDATE so a replayed
 * grant id can never redeem twice.
 */
export function consumeGrant(id: string, pocId: string): GrantRow | null {
  const db = getDb();
  const res = db
    .update(grants)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(grants.id, id),
        eq(grants.pocId, pocId),
        isNull(grants.consumedAt),
        gt(grants.expiresAt, new Date()),
      ),
    )
    .run();
  if (Number(res.changes ?? 0) !== 1) return null;
  return db.select().from(grants).where(eq(grants.id, id)).get() ?? null;
}

/* --- Terms acceptances --- */

export function insertAcceptance(input: {
  id: string;
  pocId: string;
  email: string;
  termsVersion: string;
  termsHash: string;
  termsText: string;
  ip: string;
  userAgent: string;
}): void {
  getDb()
    .insert(acceptances)
    .values({ ...input, acceptedAt: new Date() })
    .run();
}

export function setAcceptanceArtifacts(
  id: string,
  artifacts: { pdfPath: string | null; emailMessageId: string | null },
): void {
  getDb().update(acceptances).set(artifacts).where(eq(acceptances.id, id)).run();
}

export function getLatestAcceptance(
  pocId: string,
  email: string,
  termsVersion: string,
): AcceptanceRow | null {
  return (
    getDb()
      .select()
      .from(acceptances)
      .where(
        and(
          eq(acceptances.pocId, pocId),
          eq(acceptances.email, email),
          eq(acceptances.termsVersion, termsVersion),
        ),
      )
      .orderBy(desc(acceptances.acceptedAt))
      .limit(1)
      .get() ?? null
  );
}

export function getAcceptanceById(id: string): AcceptanceRow | null {
  return (
    getDb().select().from(acceptances).where(eq(acceptances.id, id)).get() ??
    null
  );
}

export function listAcceptances(pocId: string, limit = 200): AcceptanceRow[] {
  return getDb()
    .select()
    .from(acceptances)
    .where(eq(acceptances.pocId, pocId))
    .orderBy(desc(acceptances.acceptedAt))
    .limit(limit)
    .all();
}

/* --- Audit log --- */

export function insertAudit(input: {
  workspaceId?: string | null;
  pocId?: string | null;
  email?: string | null;
  sessionId?: string | null;
  event: string;
  detail?: string | null;
  path?: string | null;
  source?: "gate" | "sdk" | "dashboard";
  ip?: string | null;
  userAgent?: string | null;
}): void {
  getDb()
    .insert(auditLogs)
    .values({
      workspaceId: input.workspaceId ?? null,
      pocId: input.pocId ?? null,
      email: input.email ?? null,
      sessionId: input.sessionId ?? null,
      event: input.event,
      detail: input.detail ?? null,
      path: input.path ?? null,
      source: input.source ?? "gate",
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      createdAt: new Date(),
    })
    .run();
}

export function listAudit(pocId: string, limit = 500): AuditLogRow[] {
  return getDb()
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.pocId, pocId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .all();
}

/* --- Outbound emails (mock inbox) --- */

export function insertOutboundEmail(input: {
  recipient: string;
  subject: string;
  body: string;
  pocId?: string | null;
  workspaceId?: string | null;
}): number {
  const res = getDb()
    .insert(outboundEmails)
    .values({ ...input, createdAt: new Date() })
    .run();
  return Number(res.lastInsertRowid);
}

export function listOutboundEmails(
  workspaceId: string,
  limit = 100,
): OutboundEmailRow[] {
  return getDb()
    .select()
    .from(outboundEmails)
    .where(eq(outboundEmails.workspaceId, workspaceId))
    .orderBy(desc(outboundEmails.createdAt))
    .limit(limit)
    .all();
}

/** Mock inbox for a PoC's evaluator-facing mail (OTP codes, signed terms). */
export function listPocOutboundEmails(
  pocId: string,
  limit = 100,
): OutboundEmailRow[] {
  return getDb()
    .select()
    .from(outboundEmails)
    .where(eq(outboundEmails.pocId, pocId))
    .orderBy(desc(outboundEmails.createdAt))
    .limit(limit)
    .all();
}

/* --- Onboarding signals --- */

/**
 * Auto-detected getting-started progress for a workspace. Cheap counts
 * only; drives the dashboard onboarding checklist.
 */
export function onboardingSignals(workspaceId: string): {
  hasPoc: boolean;
  hasEvaluator: boolean;
  hasSdkConnection: boolean;
  hasGateLogin: boolean;
  firstPocId: string | null;
} {
  const db = getDb();
  const workspacePocs = db
    .select({ id: pocs.id })
    .from(pocs)
    .where(and(eq(pocs.workspaceId, workspaceId), isNull(pocs.archivedAt)))
    .all();
  const firstPocId = workspacePocs[0]?.id ?? null;

  if (!firstPocId) {
    return {
      hasPoc: false,
      hasEvaluator: false,
      hasSdkConnection: false,
      hasGateLogin: false,
      firstPocId: null,
    };
  }

  const hasEvaluator = workspacePocs.some(
    (p) => countActiveEvaluators(p.id) > 0,
  );

  const sdkRow = db
    .select({ n: sql<number>`count(*)` })
    .from(auditLogs)
    .where(
      and(eq(auditLogs.workspaceId, workspaceId), eq(auditLogs.source, "sdk")),
    )
    .get();

  const loginRow = db
    .select({ n: sql<number>`count(*)` })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.workspaceId, workspaceId),
        eq(auditLogs.event, "gate_otp_verified"),
      ),
    )
    .get();

  return {
    hasPoc: true,
    hasEvaluator,
    hasSdkConnection: (sdkRow?.n ?? 0) > 0,
    hasGateLogin: (loginRow?.n ?? 0) > 0,
    firstPocId,
  };
}

/* --- Dashboard stats --- */

export function pocStats(pocId: string): {
  evaluators: number;
  activeSessions: number;
  signatures: number;
  auditEvents: number;
} {
  const db = getDb();
  const now = new Date();
  const evals = db
    .select({ n: sql<number>`count(*)` })
    .from(evaluators)
    .where(and(eq(evaluators.pocId, pocId), isNull(evaluators.disabledAt)))
    .get();
  const sess = db
    .select({ n: sql<number>`count(*)` })
    .from(sessions)
    .where(
      and(
        eq(sessions.kind, "gate"),
        eq(sessions.pocId, pocId),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
      ),
    )
    .get();
  const sigs = db
    .select({ n: sql<number>`count(*)` })
    .from(acceptances)
    .where(eq(acceptances.pocId, pocId))
    .get();
  const audit = db
    .select({ n: sql<number>`count(*)` })
    .from(auditLogs)
    .where(eq(auditLogs.pocId, pocId))
    .get();
  return {
    evaluators: evals?.n ?? 0,
    activeSessions: sess?.n ?? 0,
    signatures: sigs?.n ?? 0,
    auditEvents: audit?.n ?? 0,
  };
}
