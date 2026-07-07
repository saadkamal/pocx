import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clientIp } from "@/lib/auth/session";
import { insertAudit } from "@/lib/db/repo";
import { authenticateV1 } from "@/lib/v1";

/**
 * Audit-event ingestion (SDK server-to-server, fire-and-forget from the
 * customer app). Events are stored on every plan; the dashboard's Audit
 * Trail view (and export) is the Pro surface for them.
 */

export const runtime = "nodejs";

const EventSchema = z.object({
  type: z.string().min(1).max(60),
  path: z.string().max(500).optional(),
  email: z.string().max(254).optional(),
  sessionId: z.string().max(120).optional(),
  detail: z.string().max(500).optional(),
  ip: z.string().max(60).optional(),
  userAgent: z.string().max(400).optional(),
});

const BodySchema = z
  .object({ events: z.array(EventSchema).min(1).max(50) })
  .strict();

export async function POST(req: NextRequest) {
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

  const fallbackIp = clientIp(req.headers);
  for (const e of parsed.data.events) {
    insertAudit({
      workspaceId: poc.workspaceId,
      pocId: poc.id,
      email: e.email ?? null,
      sessionId: e.sessionId ?? null,
      event: `sdk_${e.type}`,
      detail: e.detail ?? null,
      path: e.path ?? null,
      source: "sdk",
      ip: e.ip ?? fallbackIp,
      userAgent: e.userAgent ?? null,
    });
  }

  return NextResponse.json({ ok: true, ingested: parsed.data.events.length });
}
