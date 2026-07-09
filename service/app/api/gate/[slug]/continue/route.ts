import { NextRequest, NextResponse } from "next/server";
import { clientIp } from "@/lib/auth/session";
import { createGrant, insertAudit } from "@/lib/db/repo";
import { newGrantId } from "@/lib/ids";
import {
  checkGateSession,
  gateCookieName,
  hasAcceptedCurrentTerms,
  resolveGatePoc,
  safeReturnTo,
} from "@/lib/gate";
import { pocxOrigin } from "@/lib/utils";

/**
 * Hosted gate → customer app handoff. Once the evaluator is signed in and
 * has accepted the current terms, this mints a single-use, 2-minute grant
 * and redirects to the app's callback, which exchanges it server-side
 * (POST /api/v1/exchange) for a signed session token. The session itself
 * never travels through the URL.
 */

export const runtime = "nodejs";

const GRANT_TTL_MS = 2 * 60_000;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  // Redirects must be built from POCX_ORIGIN — behind Railway, req.url
  // carries the proxy's internal host:port (localhost:8080).
  const origin = pocxOrigin();

  const { slug } = await params;
  const poc = resolveGatePoc(slug);
  if (!poc) return NextResponse.redirect(new URL("/", origin));

  const gateUrl = (path = "") =>
    new URL(`/gate/${poc.slug}${path}`, origin);

  const returnTo = safeReturnTo(
    poc,
    req.nextUrl.searchParams.get("return_to"),
  );

  const check = checkGateSession(
    req.cookies.get(gateCookieName(poc.slug))?.value,
    poc,
  );
  if (!check.ok) {
    const login = gateUrl();
    if (returnTo) login.searchParams.set("return_to", returnTo);
    return NextResponse.redirect(login);
  }
  if (!hasAcceptedCurrentTerms(poc, check.session.email)) {
    const terms = gateUrl("/terms");
    if (returnTo) terms.searchParams.set("return_to", returnTo);
    return NextResponse.redirect(terms);
  }

  // Signed in + signed up-to-date terms, but nowhere to hand off to:
  // show the gate's "you're in" state.
  if (!returnTo || !poc.appUrl) {
    return NextResponse.redirect(gateUrl());
  }

  const grantId = newGrantId();
  createGrant({
    id: grantId,
    pocId: poc.id,
    sessionId: check.session.id,
    email: check.session.email,
    returnTo,
    expiresAt: Date.now() + GRANT_TTL_MS,
  });

  insertAudit({
    workspaceId: poc.workspaceId,
    pocId: poc.id,
    email: check.session.email,
    sessionId: check.session.id,
    event: "gate_grant_issued",
    detail: returnTo,
    source: "gate",
    ip: clientIp(req.headers),
    userAgent: req.headers.get("user-agent"),
  });

  const target = new URL(returnTo);
  const callback = new URL(poc.callbackPath, target.origin);
  callback.searchParams.set("pocx_grant", grantId);
  callback.searchParams.set("next", target.pathname + target.search);
  return NextResponse.redirect(callback);
}
