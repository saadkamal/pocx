import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  normalizeEmail,
  verifyOtpHash,
  OTP_MAX_ATTEMPTS,
} from "@/lib/auth/otp";
import {
  ADMIN_COOKIE,
  sealSessionCookie,
  sessionCookieOptions,
  clientIp,
} from "@/lib/auth/session";
import { allowHit, OTP_VERIFY_LIMIT_PER_IP } from "@/lib/auth/rate-limit";
import { ADMIN_TTL_HOURS, isAdminEmail } from "@/lib/auth/admin";
import {
  consumeOtp,
  createSessionRow,
  getActiveOtp,
  incrementOtpAttempts,
  insertAudit,
} from "@/lib/db/repo";
import { newSessionId } from "@/lib/ids";

/* Ops console — verify the code, mint an admin session. */

export const runtime = "nodejs";

const BodySchema = z
  .object({
    email: z.string().trim().min(3).max(254).email(),
    code: z.string().trim().regex(/^\d{6}$/, "6 digits"),
  })
  .strict();

const fail = () =>
  NextResponse.json({ error: "Invalid or expired code." }, { status: 401 });

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  if (!allowHit(`admin-verify:ip:${ip}`, OTP_VERIFY_LIMIT_PER_IP)) {
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

  // An email removed from the allowlist after requesting a code stays out.
  if (!isAdminEmail(email)) return fail();

  const otp = getActiveOtp(email, "admin");
  if (!otp) return fail();

  if (!verifyOtpHash(parsed.data.code, otp.codeHash)) {
    const attempts = incrementOtpAttempts(otp.id);
    if (attempts >= OTP_MAX_ATTEMPTS) consumeOtp(otp.id);
    insertAudit({
      email,
      event: "admin_otp_failed",
      source: "dashboard",
      ip,
      userAgent,
    });
    return fail();
  }

  consumeOtp(otp.id);
  const sessionId = newSessionId();
  createSessionRow({
    id: sessionId,
    kind: "admin",
    email,
    expiresAt: Date.now() + ADMIN_TTL_HOURS * 3_600_000,
    ip,
    userAgent,
  });
  insertAudit({
    email,
    sessionId,
    event: "admin_login",
    source: "dashboard",
    ip,
    userAgent,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(
    ADMIN_COOKIE,
    sealSessionCookie(sessionId),
    sessionCookieOptions(ADMIN_TTL_HOURS),
  );
  return res;
}
