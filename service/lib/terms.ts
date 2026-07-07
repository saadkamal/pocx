import { createHash } from "node:crypto";
import type { PocRow } from "@/lib/db/schema";

/**
 * Terms of Access — templated per PoC, fully customizable.
 *
 * `termsMode = "template"` renders DEFAULT_TERMS_TEMPLATE with the PoC's
 * own variables; `termsMode = "custom"` uses the operator-supplied text
 * verbatim (after variable substitution, so custom texts can still use
 * the placeholders).
 *
 * The on-screen terms, the signed PDF and the stored hash are all derived
 * from the same resolved string, so the three are guaranteed identical.
 * Bumping `termsVersion` forces every evaluator to re-accept.
 */

export const TERMS_VARIABLES = [
  "POC_NAME",
  "OWNER_ENTITY",
  "OWNER_REG_NO",
  "CLIENT_ENTITY",
  "PURPOSE",
  "SUPPORT_EMAIL",
  "TERMS_VERSION",
] as const;

export const DEFAULT_TERMS_TEMPLATE = `{{POC_NAME}} — Proof of Concept: Terms of Access (Version {{TERMS_VERSION}})

This proof-of-concept application (the "PoC") was conceived, designed and developed by {{OWNER_ENTITY}}{{OWNER_REG_NO_CLAUSE}} and is made available to you{{CLIENT_ENTITY_CLAUSE}} solely for the purpose of {{PURPOSE}}.

By logging in and accepting these terms you acknowledge and agree that:

1. Confidential & proprietary. The PoC, together with its designs, workflows, concepts, methodologies, content and source code, is the confidential information and intellectual property of {{OWNER_ENTITY}}. It is disclosed to you in confidence and only for the evaluation purpose above.

2. Permitted use only. You may access and evaluate the PoC internally. You must not copy, reproduce, distribute, publish, or share access with anyone outside the approved recipients, nor use it to build, specify or procure a competing or derivative solution.

3. No reuse without engagement. If you or your organisation (whether directly or through any third party) develop, commission or implement any product, service or solution that is derived from, substantially based on, or that incorporates the PoC or the concepts embodied in it, you agree to engage {{OWNER_ENTITY}} in respect of that work on terms to be agreed in good faith. This reflects the value of {{OWNER_ENTITY}}'s contribution and is without prejudice to any separate agreement (including any NDA) between the parties.

4. No warranty. The PoC is provided "as is" for evaluation, without warranties of any kind, and must not be used for live or production purposes.

5. Electronic signature. You consent to your acceptance being recorded electronically, including the date and time, your email address, IP address and browser information, and a cryptographic hash of the exact terms shown to you. A copy of this record will be emailed to you.

If you do not agree, do not proceed. Contact {{OWNER_ENTITY}}{{SUPPORT_EMAIL_CLAUSE}} if you have questions about these terms.`;

/** Substitute {{VARS}} (and the derived *_CLAUSE composites) for a PoC. */
export function renderTerms(poc: PocRow): string {
  const template =
    poc.termsMode === "custom" && poc.termsCustomText?.trim()
      ? poc.termsCustomText
      : DEFAULT_TERMS_TEMPLATE;

  const vars: Record<string, string> = {
    POC_NAME: poc.name,
    OWNER_ENTITY: poc.ownerEntity,
    OWNER_REG_NO: poc.ownerRegNo ?? "",
    CLIENT_ENTITY: poc.clientEntity ?? "",
    PURPOSE:
      poc.purpose?.trim() ||
      `evaluating a potential engagement with ${poc.ownerEntity}`,
    SUPPORT_EMAIL: poc.supportEmail ?? "",
    TERMS_VERSION: poc.termsVersion,
    // Composite clauses that gracefully disappear when a field is empty.
    OWNER_REG_NO_CLAUSE: poc.ownerRegNo
      ? ` ("${shortName(poc.ownerEntity)}", Company Registration No. ${poc.ownerRegNo})`
      : ` ("${shortName(poc.ownerEntity)}")`,
    CLIENT_ENTITY_CLAUSE: poc.clientEntity
      ? ` and ${poc.clientEntity}`
      : " and your organisation",
    SUPPORT_EMAIL_CLAUSE: poc.supportEmail ? ` at ${poc.supportEmail}` : "",
  };

  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key: string) =>
    key in vars ? vars[key] : `{{${key}}}`,
  );
}

/** First two words of the entity name — used as the defined short name. */
function shortName(entity: string): string {
  return entity.split(/\s+/).slice(0, 2).join(" ");
}

/** SHA-256 hex of the exact resolved terms text — the evidentiary hash. */
export function termsHash(resolvedText: string): string {
  return createHash("sha256").update(resolvedText, "utf8").digest("hex");
}

/** Terms split into paragraphs for on-screen / PDF rendering. */
export function termsParagraphs(resolvedText: string): string[] {
  return resolvedText.split("\n\n").map((p) => p.trim());
}
