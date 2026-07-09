import "server-only";
import {
  gateCookieName,
  checkSession,
  type SessionCheck,
} from "@/lib/auth/session";
import { getPocBySlug, getLatestAcceptance } from "@/lib/db/repo";
import type { PocRow } from "@/lib/db/schema";
import { DEMO_SLUG, ensureDemoPoc } from "@/lib/demo";

/**
 * Hosted-gate helpers shared by the /gate/[slug] pages and
 * /api/gate/[slug]/* handlers.
 */

/** Resolve a live PoC for its hosted gate; null → 404. */
export function resolveGatePoc(slug: string): PocRow | null {
  const poc = getPocBySlug(slug);
  if (!poc || poc.archivedAt) {
    // The Project Falcon demo gate seeds itself on first visit.
    if (slug === DEMO_SLUG) return ensureDemoPoc();
    return null;
  }
  return poc;
}

/** Authoritative gate-session check for this PoC's cookie. */
export function checkGateSession(
  cookieValue: string | undefined,
  poc: PocRow,
): SessionCheck {
  return checkSession(cookieValue, {
    kind: "gate",
    pocId: poc.id,
    idleHours: poc.idleTimeoutHours,
  });
}

export { gateCookieName };

/** Has this evaluator accepted the PoC's *current* terms version? */
export function hasAcceptedCurrentTerms(poc: PocRow, email: string): boolean {
  return Boolean(getLatestAcceptance(poc.id, email, poc.termsVersion));
}

/**
 * A `return_to` target is only honoured when it stays on the PoC's
 * registered app origin (or is a same-gate relative path). Anything else
 * is dropped — the gate must never be an open redirector.
 */
export function safeReturnTo(
  poc: PocRow,
  returnTo: string | null | undefined,
): string | null {
  if (!returnTo) return null;
  if (!poc.appUrl) return null;
  try {
    const target = new URL(returnTo);
    const app = new URL(poc.appUrl);
    if (target.origin !== app.origin) return null;
    return target.toString();
  } catch {
    return null;
  }
}
