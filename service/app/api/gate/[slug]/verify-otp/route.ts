import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  normalizeEmail,
  verifyOtpHash,
  OTP_MAX_ATTEMPTS,
} from "@/lib/auth/otp";
import {
  sealSessionCookie,
  sessionCookieOptions,
  clientIp,
} from "@/lib/auth/session";
import { allowHit, OTP_VERIFY_LIMIT_PER_IP } from "@/lib/auth/rate-limit";
import {
  consumeOtp,
  createSessionRow,
  getActiveOtp,
  incrementOtpAttempts,
  insertAudit,
  isEvaluatorAllowed,
  listRecentOtps,
} from "@/lib/db/repo";
import { newSessionId } from "@/lib/ids";
import {
  gateCookieName,
  hasAcceptedCurrentTerms,
  resolveGatePoc,
} from "@/lib/gate";
import { gateDict, gateRequestLocale } from "@/lib/i18n/gate";

/* Hosted gate — verify the code, mint a gate session for this PoC. */

export const runtime = "nodejs";

const BodySchema = z
  .object({
    email: z.string().trim().min(3).max(254).email(),
    code: z.string().trim().regex(/^\d{6}$/, "6 digits"),
  })
  .strict();

const fail = (message: string) =>
  NextResponse.json({ error: message }, { status: 401 });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const t = gateDict[gateRequestLocale(req)];
  const poc = resolveGatePoc(slug);
  if (!poc) {
    return NextResponse.json({ error: "Unknown PoC" }, { status: 404 });
  }

  const ip = clientIp(req.headers);
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  if (!allowHit(`gate-verify:ip:${ip}`, OTP_VERIFY_LIMIT_PER_IP)) {
    return NextResponse.json(
      { error: t.api.tooManyAttempts },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const email = normalizeEmail(parsed.data.email);

  // An evaluator disabled after requesting a code must not get in.
  if (poc.status !== "active" || !isEvaluatorAllowed(poc.id, email)) {
    return fail(t.api.invalidOrExpired);
  }

  const audit = (event: string, detail?: string, sessionId?: string) =>
    insertAudit({
      workspaceId: poc.workspaceId,
      pocId: poc.id,
      email,
      sessionId,
      event,
      detail,
      source: "gate",
      ip,
      userAgent,
    });

  const otp = getActiveOtp(email, "gate", poc.id);
  if (!otp) {
    const matchesRecent = listRecentOtps(email, "gate", poc.id).some((r) =>
      verifyOtpHash(parsed.data.code, r.codeHash),
    );
    audit(matchesRecent ? "gate_otp_stale" : "gate_otp_no_active");
    return fail(
      matchesRecent ? t.api.codeUsedOrExpired : t.api.noActiveCode,
    );
  }

  if (!verifyOtpHash(parsed.data.code, otp.codeHash)) {
    // A code from an older, superseded email? Say so — and never burn the
    // active code's attempts over it.
    const stale = listRecentOtps(email, "gate", poc.id)
      .filter((r) => r.id !== otp.id)
      .some((r) => verifyOtpHash(parsed.data.code, r.codeHash));
    if (stale) {
      audit("gate_otp_stale");
      return fail(t.api.codeSuperseded);
    }

    const attempts = incrementOtpAttempts(otp.id);
    if (attempts >= OTP_MAX_ATTEMPTS) {
      consumeOtp(otp.id);
      audit("gate_otp_locked");
      return fail(t.api.codeLocked);
    }
    audit("gate_otp_failed");
    const left = OTP_MAX_ATTEMPTS - attempts;
    return fail(t.api.attemptsLeft(left));
  }

  // Success — single-use consume + mint the gate session.
  consumeOtp(otp.id);
  const sessionId = newSessionId();
  createSessionRow({
    id: sessionId,
    kind: "gate",
    email,
    pocId: poc.id,
    expiresAt: Date.now() + poc.sessionTtlHours * 3_600_000,
    ip,
    userAgent,
  });

  audit("gate_otp_verified", undefined, sessionId);

  const needsTerms = !hasAcceptedCurrentTerms(poc, email);
  const res = NextResponse.json({ ok: true, needsTerms });
  res.cookies.set(
    gateCookieName(poc.slug),
    sealSessionCookie(sessionId),
    sessionCookieOptions(poc.sessionTtlHours),
  );
  return res;
}
