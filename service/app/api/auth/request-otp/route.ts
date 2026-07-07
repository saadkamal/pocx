import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  generateOtpCode,
  hashOtp,
  normalizeEmail,
  OTP_TTL_MINUTES,
} from "@/lib/auth/otp";
import { clientIp } from "@/lib/auth/session";
import {
  allowHit,
  OTP_REQUEST_LIMIT_PER_EMAIL,
  OTP_REQUEST_LIMIT_PER_IP,
} from "@/lib/auth/rate-limit";
import { createOtp, getOperatorByEmail, insertAudit } from "@/lib/db/repo";
import { newOtpId } from "@/lib/ids";
import { sendMail } from "@/lib/mail/send";

/* Operator (dashboard) auth — request a 6-digit login code.
   mode "login"  → the email must belong to an existing operator.
   mode "signup" → the email must NOT belong to one yet. */

export const runtime = "nodejs";

const BodySchema = z
  .object({
    email: z.string().trim().min(3).max(254).email(),
    mode: z.enum(["login", "signup"]),
  })
  .strict();

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const email = normalizeEmail(parsed.data.email);

  if (
    !allowHit(`op-otp:email:${email}`, OTP_REQUEST_LIMIT_PER_EMAIL) ||
    !allowHit(`op-otp:ip:${ip}`, OTP_REQUEST_LIMIT_PER_IP)
  ) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a few minutes." },
      { status: 429 },
    );
  }

  const existing = getOperatorByEmail(email);
  if (parsed.data.mode === "login") {
    if (!existing || existing.disabledAt) {
      return NextResponse.json(
        {
          error:
            "No POCX account found for this email. Sign up first — it takes a minute.",
        },
        { status: 404 },
      );
    }
  } else if (existing) {
    return NextResponse.json(
      { error: "This email already has a POCX account — log in instead." },
      { status: 409 },
    );
  }

  const code = generateOtpCode();
  createOtp({
    id: newOtpId(),
    email,
    codeHash: hashOtp(code),
    purpose: "operator",
    expiresAt: Date.now() + OTP_TTL_MINUTES * 60_000,
  });

  // Code in the subject: readable straight off the inbox list, and stops
  // mail clients threading successive requests into one collapsed
  // conversation where people open the older, stale email.
  await sendMail({
    to: email,
    subject: `${code} is your POCX ${parsed.data.mode === "signup" ? "sign-up" : "login"} code`,
    text: `Your POCX code is: ${code}\n\nIt expires in ${OTP_TTL_MINUTES} minutes and replaces any earlier code we sent you. If you did not request this, you can ignore this email.`,
    html: `<p>Your POCX code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>It expires in ${OTP_TTL_MINUTES} minutes and <strong>replaces any earlier code</strong> we sent you. If you did not request this, you can ignore this email.</p>`,
    workspaceId: existing?.workspaceId,
  });

  insertAudit({
    workspaceId: existing?.workspaceId,
    email,
    event: "operator_otp_requested",
    detail: parsed.data.mode,
    source: "dashboard",
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
