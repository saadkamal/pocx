import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  normalizeEmail,
  verifyOtpHash,
  OTP_MAX_ATTEMPTS,
} from "@/lib/auth/otp";
import {
  OPERATOR_COOKIE,
  OPERATOR_TTL_HOURS,
  sealSessionCookie,
  sessionCookieOptions,
  clientIp,
} from "@/lib/auth/session";
import { allowHit, OTP_VERIFY_LIMIT_PER_IP } from "@/lib/auth/rate-limit";
import {
  consumeOtp,
  createOperator,
  createSessionRow,
  createWorkspace,
  getActiveOtp,
  getOperatorByEmail,
  incrementOtpAttempts,
  insertAudit,
  listRecentOtps,
} from "@/lib/db/repo";
import { newOperatorId, newSessionId, newWorkspaceId } from "@/lib/ids";

/* Operator auth — verify the code; mint a dashboard session. In signup
   mode this is also the moment the workspace + operator are created. */

export const runtime = "nodejs";

const BodySchema = z
  .object({
    email: z.string().trim().min(3).max(254).email(),
    code: z.string().trim().regex(/^\d{6}$/, "6 digits"),
    signup: z
      .object({
        name: z.string().trim().min(1).max(80),
        workspaceName: z.string().trim().min(1).max(80),
      })
      .optional(),
  })
  .strict();

const fail = (message = "Invalid or expired code.") =>
  NextResponse.json({ error: message }, { status: 401 });

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  if (!allowHit(`op-verify:ip:${ip}`, OTP_VERIFY_LIMIT_PER_IP)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const email = normalizeEmail(parsed.data.email);

  const otp = getActiveOtp(email, "operator");
  if (!otp) {
    const matchesRecent = listRecentOtps(email, "operator").some((r) =>
      verifyOtpHash(parsed.data.code, r.codeHash),
    );
    return fail(
      matchesRecent
        ? "That code has expired or was already used — request a fresh one."
        : "No active code for this email — it may have expired. Request a new one.",
    );
  }

  if (!verifyOtpHash(parsed.data.code, otp.codeHash)) {
    // A code from an older, superseded email? Say so — and never burn the
    // active code's attempts over it.
    const stale = listRecentOtps(email, "operator")
      .filter((r) => r.id !== otp.id)
      .some((r) => verifyOtpHash(parsed.data.code, r.codeHash));
    if (stale) {
      return fail(
        "That code is from an earlier email and has been replaced — use the code from the most recent email.",
      );
    }
    const attempts = incrementOtpAttempts(otp.id);
    if (attempts >= OTP_MAX_ATTEMPTS) {
      consumeOtp(otp.id);
      return fail("Too many wrong attempts — that code is now locked. Request a fresh one.");
    }
    const left = OTP_MAX_ATTEMPTS - attempts;
    return fail(
      `That code didn't work — ${left} attempt${left === 1 ? "" : "s"} left before it locks.`,
    );
  }

  consumeOtp(otp.id);

  // Resolve (or create) the operator.
  let operator = getOperatorByEmail(email);
  if (!operator) {
    if (!parsed.data.signup) {
      return NextResponse.json(
        { error: "No account for this email — sign up first." },
        { status: 404 },
      );
    }
    const workspaceId = newWorkspaceId();
    createWorkspace({
      id: workspaceId,
      name: parsed.data.signup.workspaceName,
    });
    createOperator({
      id: newOperatorId(),
      workspaceId,
      email,
      name: parsed.data.signup.name,
      role: "owner",
    });
    operator = getOperatorByEmail(email)!;
    insertAudit({
      workspaceId,
      email,
      event: "workspace_created",
      detail: parsed.data.signup.workspaceName,
      source: "dashboard",
      ip,
      userAgent,
    });
  }
  if (operator.disabledAt) return fail("This account has been disabled.");

  const sessionId = newSessionId();
  createSessionRow({
    id: sessionId,
    kind: "operator",
    email,
    workspaceId: operator.workspaceId,
    expiresAt: Date.now() + OPERATOR_TTL_HOURS * 3_600_000,
    ip,
    userAgent,
  });

  insertAudit({
    workspaceId: operator.workspaceId,
    email,
    sessionId,
    event: "operator_login",
    source: "dashboard",
    ip,
    userAgent,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(
    OPERATOR_COOKIE,
    sealSessionCookie(sessionId),
    sessionCookieOptions(OPERATOR_TTL_HOURS),
  );
  return res;
}
