/**
 * Plans — the single source of truth for pricing + limits.
 *
 * Free  → protect PoCs with up to 3 evaluator seats each; core gate
 *         (OTP login, Terms of Access e-signature, session control).
 * Pro   → USD $39 / workspace / month: unlimited seats, the full audit
 *         trail (every auth decision + SDK access events, CSV export).
 *
 * Audit events are always *written* — upgrading unlocks the history, it
 * doesn't start it.
 */

export type PlanId = "free" | "pro";
export type BillingInterval = "month" | "year";

export const PRO_PRICE_USD = 39;
/** Annual: ~32% off vs 12 × monthly (US$468) — "2.8 months free". */
export const PRO_PRICE_YEARLY_USD = 320;
export const YEARLY_SAVINGS_PCT = Math.round(
  (1 - PRO_PRICE_YEARLY_USD / (PRO_PRICE_USD * 12)) * 100,
);

export const PLANS: Record<
  PlanId,
  {
    id: PlanId;
    label: string;
    priceUsd: number;
    maxEvaluatorsPerPoc: number | null; // null = unlimited
    auditTrail: boolean;
    tagline: string;
  }
> = {
  free: {
    id: "free",
    label: "Free",
    priceUsd: 0,
    maxEvaluatorsPerPoc: 3,
    auditTrail: false,
    tagline: "Protect a PoC for up to 3 evaluators.",
  },
  pro: {
    id: "pro",
    label: "Pro",
    priceUsd: PRO_PRICE_USD,
    maxEvaluatorsPerPoc: null,
    auditTrail: true,
    tagline: "Unlimited evaluators and the full audit trail.",
  },
};

export function planFor(plan: string | null | undefined) {
  return PLANS[(plan as PlanId) ?? "free"] ?? PLANS.free;
}

/** Can this workspace add one more active evaluator to the PoC? */
export function canAddEvaluator(
  plan: string | null | undefined,
  activeEvaluatorCount: number,
): { ok: true } | { ok: false; reason: string } {
  const p = planFor(plan);
  if (p.maxEvaluatorsPerPoc === null || activeEvaluatorCount < p.maxEvaluatorsPerPoc) {
    return { ok: true };
  }
  return {
    ok: false,
    reason: `The Free plan includes ${p.maxEvaluatorsPerPoc} evaluator seats per PoC. Upgrade to Pro (US$${PRO_PRICE_USD}/mo) for unlimited seats.`,
  };
}

export function hasAuditTrail(plan: string | null | undefined): boolean {
  return planFor(plan).auditTrail;
}
