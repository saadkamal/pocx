import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clientIp } from "@/lib/auth/session";
import { allowHit, EXCHANGE_LIMIT_PER_IP } from "@/lib/auth/rate-limit";
import { consumeGrant, getSessionRow, insertAudit } from "@/lib/db/repo";
import { signJwt } from "@/lib/tokens/jwt";
import { authenticateV1 } from "@/lib/v1";

/**
 * Grant → session-token exchange (SDK server-to-server).
 *
 * The customer app's callback receives `?pocx_grant=…` from the hosted
 * gate and swaps it here — authenticated with the PoC secret — for a
 * signed HS256 token the SDK then verifies locally on every request.
 * Grants are single-use and expire in 2 minutes; a leaked grant without
 * the secret is worthless.
 */

export const runtime = "nodejs";

const BodySchema = z.object({ grant: z.string().min(10).max(200) }).strict();

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!allowHit(`v1-exchange:ip:${ip}`, EXCHANGE_LIMIT_PER_IP)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const auth = authenticateV1(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { poc } = auth;

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const grant = consumeGrant(parsed.data.grant, poc.id);
  if (!grant) {
    return NextResponse.json(
      { error: "Grant is invalid, expired or already used." },
      { status: 401 },
    );
  }

  const session = getSessionRow(grant.sessionId);
  if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "The underlying session is no longer valid." },
      { status: 401 },
    );
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
    source: "sdk",
    ip,
    userAgent: req.headers.get("user-agent"),
  });

  return NextResponse.json({
    ok: true,
    token,
    email: grant.email,
    sessionId: session.id,
    expiresAt: session.expiresAt.getTime(),
    termsVersion: poc.termsVersion,
  });
}
