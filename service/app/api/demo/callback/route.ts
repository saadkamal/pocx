import { NextRequest, NextResponse } from "next/server";
import { clientIp } from "@/lib/auth/session";
import { consumeGrant, getSessionRow, insertAudit } from "@/lib/db/repo";
import { DEMO_APP_COOKIE, ensureDemoPoc } from "@/lib/demo";
import { signJwt } from "@/lib/tokens/jwt";

/**
 * Callback for the Project Falcon demo — the same handoff a customer
 * app's SDK performs, dogfooded in-process: the hosted gate redirects
 * here with a single-use grant, we exchange it (consumeGrant + live
 * session check, exactly what POST /api/v1/exchange does) for an HS256
 * token signed with the PoC secret, set it as the demo-app cookie and
 * land the visitor inside /demo.
 */

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const poc = ensureDemoPoc();
  const gateUrl = new URL(`/gate/${poc.slug}`, req.url);

  const grantId = req.nextUrl.searchParams.get("pocx_grant");
  if (!grantId) return NextResponse.redirect(gateUrl);

  const grant = consumeGrant(grantId, poc.id);
  if (!grant) return NextResponse.redirect(gateUrl);

  const session = getSessionRow(grant.sessionId);
  if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
    return NextResponse.redirect(gateUrl);
  }

  const exp = Math.floor(session.expiresAt.getTime() / 1000);
  const token = signJwt(
    {
      sub: grant.email,
      poc: poc.slug,
      sid: session.id,
      tv: poc.termsVersion,
      exp,
    },
    poc.secret,
  );

  insertAudit({
    workspaceId: poc.workspaceId,
    pocId: poc.id,
    email: grant.email,
    sessionId: session.id,
    event: "sdk_grant_exchanged",
    detail: "demo-app",
    source: "sdk",
    ip: clientIp(req.headers),
    userAgent: req.headers.get("user-agent"),
  });

  // Only ever land back inside the demo app, never elsewhere.
  const next = req.nextUrl.searchParams.get("next");
  const target =
    next && /^\/(ja\/)?demo(\/|\?|$)/.test(next) ? next : "/demo";

  const res = NextResponse.redirect(new URL(target, req.url));
  res.cookies.set(DEMO_APP_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: req.nextUrl.protocol === "https:",
    path: "/",
    expires: session.expiresAt,
  });
  return res;
}
