import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  generateOtpCode,
  hashOtp,
  normalizeEmail,
  OTP_TTL_MINUTES,
} from "@/lib/auth/otp";
import { clientIp } from "@/lib/auth/session";
import { allowHit } from "@/lib/auth/rate-limit";
import { isAdminEmail } from "@/lib/auth/admin";
import { createOtp, insertAudit } from "@/lib/db/repo";
import { newOtpId } from "@/lib/ids";
import { sendMail } from "@/lib/mail/send";

/* Ops console — request a login code. Non-allowlisted emails get the same
   generic response as allowlisted ones: this endpoint must not confirm
   who runs the platform. */

export const runtime = "nodejs";

const BodySchema = z
  .object({ email: z.string().trim().min(3).max(254).email() })
  .strict();

const ADMIN_OTP_LIMIT = 5;

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  if (!allowHit(`admin-otp:ip:${ip}`, ADMIN_OTP_LIMIT)) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a few minutes." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const email = normalizeEmail(parsed.data.email);

  if (isAdminEmail(email)) {
    const code = generateOtpCode();
    createOtp({
      id: newOtpId(),
      email,
      codeHash: hashOtp(code),
      purpose: "admin",
      expiresAt: Date.now() + OTP_TTL_MINUTES * 60_000,
    });
    await sendMail({
      to: email,
      subject: `${code} is your POCX ops console code`,
      text: `Your POCX ops console login code is: ${code}\n\nIt expires in ${OTP_TTL_MINUTES} minutes. If you did not request this, someone may be probing the console — the attempt was logged.`,
      html: `<p>Your POCX <strong>ops console</strong> login code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>It expires in ${OTP_TTL_MINUTES} minutes. If you did not request this, someone may be probing the console — the attempt was logged.</p>`,
    });
    insertAudit({
      email,
      event: "admin_otp_requested",
      source: "dashboard",
      ip,
      userAgent,
    });
  } else {
    insertAudit({
      email,
      event: "admin_otp_denied",
      detail: "not_allowlisted",
      source: "dashboard",
      ip,
      userAgent,
    });
  }

  // Uniform response either way.
  return NextResponse.json({
    ok: true,
    message: "If this email runs POCX, a code has been sent.",
  });
}
