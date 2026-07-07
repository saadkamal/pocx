import { NextRequest, NextResponse } from "next/server";
import { revokeSession } from "@/lib/db/repo";
import {
  checkGateSession,
  gateCookieName,
  resolveGatePoc,
} from "@/lib/gate";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const poc = resolveGatePoc(slug);
  if (!poc) {
    return NextResponse.json({ error: "Unknown PoC" }, { status: 404 });
  }

  const cookie = gateCookieName(poc.slug);
  const check = checkGateSession(req.cookies.get(cookie)?.value, poc);
  if (check.ok) revokeSession(check.session.id);

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(cookie);
  return res;
}
