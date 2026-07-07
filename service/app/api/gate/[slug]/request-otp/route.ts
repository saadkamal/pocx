import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateOtpCode, hashOtp, normalizeEmail } from "@/lib/auth/otp";
import { clientIp } from "@/lib/auth/session";
import {
  allowHit,
  OTP_REQUEST_LIMIT_PER_EMAIL,
  OTP_REQUEST_LIMIT_PER_IP,
} from "@/lib/auth/rate-limit";
import { createOtp, insertAudit, isEvaluatorAllowed } from "@/lib/db/repo";
import { newOtpId } from "@/lib/ids";
import { resolveGatePoc } from "@/lib/gate";
import { gateDict, gateRequestLocale } from "@/lib/i18n/gate";
import { sendMail } from "@/lib/mail/send";

/* Hosted gate — request a 6-digit access code for a PoC. */

export const runtime = "nodejs";

const BodySchema = z
  .object({ email: z.string().trim().min(3).max(254).email() })
  .strict();

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
  if (poc.status !== "active") {
    return NextResponse.json({ error: t.api.paused }, { status: 403 });
  }

  const ip = clientIp(req.headers);
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const email = normalizeEmail(parsed.data.email);

  if (
    !allowHit(`gate-otp:${poc.id}:${email}`, OTP_REQUEST_LIMIT_PER_EMAIL) ||
    !allowHit(`gate-otp:ip:${ip}`, OTP_REQUEST_LIMIT_PER_IP)
  ) {
    return NextResponse.json({ error: t.api.tooManyRequests }, { status: 429 });
  }

  const audit = (event: string, detail?: string) =>
    insertAudit({
      workspaceId: poc.workspaceId,
      pocId: poc.id,
      email,
      event,
      detail,
      source: "gate",
      ip,
      userAgent,
    });

  if (!isEvaluatorAllowed(poc.id, email)) {
    audit("gate_access_denied", "not_allowlisted");
    // Tell the person plainly they don't have access, rather than leaving
    // them waiting for a code that will never arrive.
    return NextResponse.json({ ok: false, allowed: false }, { status: 403 });
  }

  const code = generateOtpCode();
  createOtp({
    id: newOtpId(),
    email,
    codeHash: hashOtp(code),
    purpose: "gate",
    pocId: poc.id,
    expiresAt: Date.now() + poc.otpTtlMinutes * 60_000,
  });

  const mailParams = {
    code,
    pocName: poc.name,
    minutes: poc.otpTtlMinutes,
    ownerEntity: poc.ownerEntity,
  };
  await sendMail({
    to: email,
    subject: t.email.otp.subject(code, poc.name),
    text: t.email.otp.text(mailParams),
    html: t.email.otp.html(mailParams),
    pocId: poc.id,
    workspaceId: poc.workspaceId,
  });

  audit("gate_otp_requested");
  return NextResponse.json({ ok: true, message: t.api.codeSent });
}
