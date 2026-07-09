import "server-only";
import {
  createPoc,
  createWorkspace,
  getPocById,
  getPocBySlug,
  setWorkspacePlan,
  updatePoc,
} from "@/lib/db/repo";
import type { PocRow } from "@/lib/db/schema";
import { getJsonSetting, setJsonSetting } from "@/lib/db/settings";
import { newPocId, newPublicKey, newSecret, newWorkspaceId } from "@/lib/ids";
import { pocxOrigin } from "@/lib/utils";

/**
 * The public "See it in action" demo — Project Falcon.
 *
 * A real PoC behind the real gate, with one twist: anyone may enroll
 * (request-otp auto-adds the email instead of checking the allowlist).
 * Everything else — OTP, e-signature, PDF certificate, sessions, grant
 * exchange, revocation — is the ordinary product code path.
 *
 * The PoC lives in its own operator-less workspace (nobody can log into
 * it, so nobody can edit it from the dashboard) on the pro plan (no seat
 * limit). Its id is pinned in admin settings; `isDemoPoc` compares ids,
 * never slugs, so open enrollment can't be triggered on a customer PoC.
 */

export const DEMO_SLUG = "falcon";
/** HttpOnly cookie holding the demo app's HS256 session token. */
export const DEMO_APP_COOKIE = "pocx_demo_session";
const SETTING_KEY = "demo_poc_id";

/**
 * The demo PoC is code-managed (no operator can edit it), so its terms
 * version lives here. Bumping it forces every existing demo signer to
 * re-sign — which is itself a feature worth showing off.
 * 1.1 — typed-name signature added.
 */
const DEMO_TERMS_VERSION = "1.1";

export function getDemoPocId(): string | null {
  return getJsonSetting<string | null>(SETTING_KEY, null);
}

export function isDemoPoc(poc: PocRow): boolean {
  return poc.id === getDemoPocId();
}

/** The demo PoC, creating workspace + PoC on first touch. */
export function ensureDemoPoc(): PocRow {
  const existingId = getDemoPocId();
  if (existingId) {
    const poc = getPocById(existingId);
    if (poc && !poc.archivedAt) {
      if (poc.termsVersion !== DEMO_TERMS_VERSION) {
        updatePoc(poc.id, { termsVersion: DEMO_TERMS_VERSION });
        return getPocById(poc.id)!;
      }
      return poc;
    }
  }

  const origin = pocxOrigin();
  const workspaceId = newWorkspaceId();
  createWorkspace({ id: workspaceId, name: "Acme Pte Ltd (POCX demo)" });
  setWorkspacePlan(workspaceId, "pro");

  // If a customer somehow owns the pretty slug, step aside with a suffix.
  const slug = getPocBySlug(DEMO_SLUG) ? `${DEMO_SLUG}-demo` : DEMO_SLUG;

  const id = newPocId();
  createPoc({
    id,
    workspaceId,
    slug,
    name: "Project Falcon",
    ownerEntity: "Acme Pte Ltd",
    ownerRegNo: null,
    clientEntity: null,
    purpose:
      "Evaluating Project Falcon ahead of a potential engagement with Acme Pte Ltd",
    supportEmail: "pocx@haxo.com.au",
    brandColor: "#17140F",
    logoUrl: null,
    appUrl: `${origin}/demo`,
    callbackPath: "/api/demo/callback",
    publicKey: newPublicKey(),
    secret: newSecret(),
    termsMode: "template",
    termsCustomText: null,
    termsVersion: DEMO_TERMS_VERSION,
    sessionTtlHours: 24,
    idleTimeoutHours: 3,
    otpTtlMinutes: 10,
    status: "active",
  });
  setJsonSetting(SETTING_KEY, id);

  return getPocById(id)!;
}
