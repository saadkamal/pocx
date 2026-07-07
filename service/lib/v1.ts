import "server-only";
import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { getPocByPublicKey } from "@/lib/db/repo";
import type { PocRow } from "@/lib/db/schema";

/**
 * SDK API (/api/v1/*) authentication — server-to-server only.
 *
 * Requests identify the PoC with `x-pocx-key: pocx_pk_…` and prove
 * ownership with `Authorization: Bearer pocx_sk_…`. The secret never
 * appears in a browser; the SDK keeps it server-side.
 */

export type V1Auth =
  | { ok: true; poc: PocRow }
  | { ok: false; status: number; error: string };

export function authenticateV1(req: NextRequest): V1Auth {
  const publicKey = req.headers.get("x-pocx-key");
  const authz = req.headers.get("authorization");
  const secret = authz?.startsWith("Bearer ") ? authz.slice(7).trim() : null;

  if (!publicKey || !secret) {
    return {
      ok: false,
      status: 401,
      error:
        "Missing credentials. Send 'x-pocx-key: pocx_pk_…' and 'Authorization: Bearer pocx_sk_…'.",
    };
  }

  const poc = getPocByPublicKey(publicKey.trim());
  if (!poc || poc.archivedAt) {
    return { ok: false, status: 401, error: "Unknown project key." };
  }

  const a = Buffer.from(poc.secret, "utf8");
  const b = Buffer.from(secret, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, status: 401, error: "Invalid secret." };
  }

  return { ok: true, poc };
}
