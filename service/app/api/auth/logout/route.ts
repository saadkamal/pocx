import { NextRequest, NextResponse } from "next/server";
import {
  OPERATOR_COOKIE,
  checkSession,
} from "@/lib/auth/session";
import { revokeSession } from "@/lib/db/repo";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const check = checkSession(req.cookies.get(OPERATOR_COOKIE)?.value, {
    kind: "operator",
  });
  if (check.ok) revokeSession(check.session.id);

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(OPERATOR_COOKIE);
  return res;
}
