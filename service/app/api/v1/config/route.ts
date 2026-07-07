import { NextRequest, NextResponse } from "next/server";
import { authenticateV1 } from "@/lib/v1";
import { pocxOrigin } from "@/lib/utils";

/**
 * PoC config for the SDK (server-to-server). Also doubles as the
 * integration smoke test: a 200 here proves the key pair works.
 */

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = authenticateV1(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { poc } = auth;

  return NextResponse.json({
    ok: true,
    poc: {
      slug: poc.slug,
      name: poc.name,
      ownerEntity: poc.ownerEntity,
      status: poc.status,
      termsVersion: poc.termsVersion,
      sessionTtlHours: poc.sessionTtlHours,
      idleTimeoutHours: poc.idleTimeoutHours,
      gateUrl: `${pocxOrigin()}/gate/${poc.slug}`,
      appUrl: poc.appUrl,
      callbackPath: poc.callbackPath,
    },
  });
}
