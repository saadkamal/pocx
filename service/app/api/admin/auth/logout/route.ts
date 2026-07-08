import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, checkSession } from "@/lib/auth/session";
import { revokeSession } from "@/lib/db/repo";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const check = checkSession(req.cookies.get(ADMIN_COOKIE)?.value, {
    kind: "admin",
  });
  if (check.ok) revokeSession(check.session.id);

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
