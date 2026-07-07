import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getLatestAcceptance,
  getSessionRow,
  isEvaluatorAllowed,
  touchSession,
} from "@/lib/db/repo";
import { authenticateV1 } from "@/lib/v1";

/**
 * Session revalidation (SDK server-to-server). The SDK verifies tokens
 * locally per request and calls this periodically (default: every 60s per
 * session) to pick up revocations, evaluator disables, PoC pauses and
 * terms-version bumps.
 */

export const runtime = "nodejs";

const BodySchema = z
  .object({ sessionId: z.string().min(10).max(120) })
  .strict();

export async function POST(req: NextRequest) {
  const auth = authenticateV1(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { poc } = auth;

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const session = getSessionRow(parsed.data.sessionId);
  const now = Date.now();

  const invalid = (reason: string) =>
    NextResponse.json({ ok: true, valid: false, reason });

  if (!session || session.kind !== "gate" || session.pocId !== poc.id) {
    return invalid("unknown_session");
  }
  if (session.revokedAt) return invalid("revoked");
  if (session.expiresAt.getTime() < now) return invalid("expired");
  if (now - session.lastActiveAt.getTime() > poc.idleTimeoutHours * 3_600_000) {
    return invalid("idle");
  }
  if (poc.status !== "active") return invalid("poc_paused");
  if (!isEvaluatorAllowed(poc.id, session.email)) {
    return invalid("evaluator_disabled");
  }

  const termsCurrent = Boolean(
    getLatestAcceptance(poc.id, session.email, poc.termsVersion),
  );
  if (!termsCurrent) return invalid("terms_outdated");

  touchSession(session.id);
  return NextResponse.json({
    ok: true,
    valid: true,
    email: session.email,
    termsVersion: poc.termsVersion,
    expiresAt: session.expiresAt.getTime(),
  });
}
