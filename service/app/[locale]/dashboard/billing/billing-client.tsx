"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle, ExternalLink, X } from "lucide-react";
import {
  acceptRetentionOfferAction,
  cancelSubscriptionAction,
  openBillingPortalAction,
  renameWorkspaceAction,
  resumeSubscriptionAction,
  switchToYearlyAction,
  upgradeAction,
  type ActionResult,
} from "../actions";
import { Badge, buttonCn, Card, CardTitle, inputCn, Label } from "@/components/ui";
import {
  PLANS,
  PRO_PRICE_USD,
  PRO_PRICE_YEARLY_USD,
  YEARLY_SAVINGS_PCT,
  type BillingInterval,
  type PlanId,
} from "@/lib/plans";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/locales";
import { dashboardDict } from "@/lib/i18n/dashboard";

type Notice = { kind: "ok" | "error"; text: string };

const YEARLY_PER_MONTH_APPROX = Math.round(PRO_PRICE_YEARLY_USD / 12); // ≈ 27
const RETENTION_PRICE = `US$${(PRO_PRICE_USD / 2).toFixed(2)}`; // US$19.50

function NoticeLine({ notice }: { notice: Notice }) {
  return (
    <p
      role={notice.kind === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        notice.kind === "error"
          ? "border-danger/30 bg-danger-subtle text-danger"
          : "border-success/30 bg-success-subtle text-success",
      )}
    >
      {notice.text}
    </p>
  );
}

function FeatureList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-ink-700">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function BillingClient({
  locale,
  plan,
  billingInterval,
  cancelAtPeriodEnd,
  currentPeriodEnd,
  retentionAvailable,
  stripeOn,
  workspaceName,
  upgraded,
}: {
  locale: Locale;
  plan: PlanId;
  billingInterval: BillingInterval | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null; // pre-formatted server-side
  retentionAvailable: boolean;
  stripeOn: boolean;
  workspaceName: string;
  upgraded: boolean;
}) {
  const router = useRouter();
  const t = dashboardDict[locale].billing;
  const [interval, setIntervalChoice] = useState<BillingInterval>("month");
  const [planNotice, setPlanNotice] = useState<Notice | null>(null);
  const [wsNotice, setWsNotice] = useState<Notice | null>(null);
  const [retentionOpen, setRetentionOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  /**
   * Run a billing action and surface the result inline. Redirecting actions
   * (Stripe Checkout / Billing Portal) never resolve with a payload — Next
   * performs the navigation — so the null checks matter. `after` runs once
   * the action settles either way (used to close the retention modal so the
   * inline notice is visible).
   */
  function runPlanAction(
    action: () => Promise<ActionResult>,
    after?: () => void,
  ) {
    setPlanNotice(null);
    startTransition(async () => {
      const res = await action();
      if (res && "error" in res) {
        setPlanNotice({ kind: "error", text: res.error });
        after?.();
      } else if (res && "ok" in res) {
        setPlanNotice(res.message ? { kind: "ok", text: res.message } : null);
        after?.();
        router.refresh();
      }
    });
  }

  function onCancelClick() {
    if (retentionAvailable) {
      setRetentionOpen(true);
      return;
    }
    if (!window.confirm(t.cancelConfirm)) return;
    runPlanAction(cancelSubscriptionAction);
  }

  function onSwitchToYearly() {
    if (!window.confirm(t.switchConfirm(PRO_PRICE_YEARLY_USD))) return;
    runPlanAction(switchToYearlyAction);
  }

  function onRename(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setWsNotice(null);
    startTransition(async () => {
      const res = await renameWorkspaceAction(formData);
      if (res && "error" in res) {
        setWsNotice({ kind: "error", text: res.error });
      } else if (res && "ok" in res) {
        setWsNotice({ kind: "ok", text: res.message ?? t.savedFallback });
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* --- Upgraded banner --- */}
      {upgraded && plan === "pro" ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-success/30 bg-success-subtle p-4"
        >
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-ink-900">
              {t.upgradedTitle}
            </p>
            <p className="mt-0.5 text-sm text-ink-700">{t.upgradedBody}</p>
          </div>
        </div>
      ) : null}

      {/* --- Pro: subscription management --- */}
      {plan === "pro" ? (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="mb-0">{t.subscriptionTitle}</CardTitle>
              <p className="mt-1 text-sm font-medium text-ink-800">
                {billingInterval === "year" ? t.statusYearly : t.statusMonthly}
              </p>
            </div>
            <Badge tone="brand">{t.currentPlan}</Badge>
          </div>

          {cancelAtPeriodEnd ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning-subtle px-3 py-2.5">
              <p className="text-sm font-medium text-warning">
                {currentPeriodEnd
                  ? t.cancelsOn(currentPeriodEnd)
                  : t.cancelsAtPeriodEnd}
              </p>
              <button
                type="button"
                onClick={() => runPlanAction(resumeSubscriptionAction)}
                disabled={pending}
                className={buttonCn("primary", "sm")}
              >
                {pending ? t.working : t.resume}
              </button>
            </div>
          ) : currentPeriodEnd ? (
            <p className="mt-2 text-sm text-ink-600">
              {t.renewsOn(currentPeriodEnd)}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-ink-100 pt-4">
            {stripeOn ? (
              <button
                type="button"
                onClick={() => runPlanAction(openBillingPortalAction)}
                disabled={pending}
                className={buttonCn("secondary", "sm")}
              >
                {t.manageBilling}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : null}
            {billingInterval === "month" && !cancelAtPeriodEnd ? (
              <button
                type="button"
                onClick={onSwitchToYearly}
                disabled={pending}
                className={buttonCn("secondary", "sm")}
              >
                {t.switchToYearly(YEARLY_SAVINGS_PCT)}
              </button>
            ) : null}
            {!cancelAtPeriodEnd ? (
              <button
                type="button"
                onClick={onCancelClick}
                disabled={pending}
                className="ml-auto text-sm font-medium text-ink-400 transition-colors hover:text-danger hover:underline"
              >
                {t.cancelSubscription}
              </button>
            ) : null}
          </div>
        </Card>
      ) : null}

      {/* --- Free: interval toggle --- */}
      {plan === "free" ? (
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="radiogroup"
            aria-label={t.intervalAria}
            className="inline-flex rounded-lg border border-ink-300 bg-paper p-1"
          >
            {(
              [
                ["month", t.intervalMonthly(PRO_PRICE_USD)],
                ["year", t.intervalYearly(PRO_PRICE_YEARLY_USD)],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={interval === value}
                onClick={() => setIntervalChoice(value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  interval === value
                    ? "bg-ink-900 text-paper"
                    : "text-ink-600 hover:text-ink-900",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <Badge tone="success">{t.saveBadge(YEARLY_SAVINGS_PCT)}</Badge>
        </div>
      ) : null}

      {/* --- Plan cards --- */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* --- Free --- */}
        <Card
          className={cn(
            "flex flex-col gap-4",
            plan === "free" && "border-ink-900 ring-1 ring-ink-900",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="mb-0">{PLANS.free.label}</CardTitle>
              <p className="text-sm text-ink-500">{t.freeTagline}</p>
            </div>
            {plan === "free" ? <Badge tone="brand">{t.currentPlan}</Badge> : null}
          </div>
          <p className="text-3xl font-bold tracking-tight text-ink-900">
            US$0
            <span className="text-sm font-medium text-ink-500">
              {t.freeForever}
            </span>
          </p>
          <FeatureList items={t.freeFeatures} />
        </Card>

        {/* --- Pro --- */}
        <Card
          className={cn(
            "flex flex-col gap-4",
            plan === "pro" && "border-ink-900 ring-1 ring-ink-900",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="mb-0">{PLANS.pro.label}</CardTitle>
              <p className="text-sm text-ink-500">{t.proTagline}</p>
            </div>
            {plan === "pro" ? <Badge tone="brand">{t.currentPlan}</Badge> : null}
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight text-ink-900">
              US$
              {plan === "free" && interval === "year"
                ? PRO_PRICE_YEARLY_USD
                : PRO_PRICE_USD}
              <span className="text-sm font-medium text-ink-500">
                {plan === "free" && interval === "year"
                  ? t.perWorkspaceYear
                  : t.perWorkspaceMonth}
              </span>
            </p>
            {plan === "free" && interval === "year" ? (
              <p className="mt-1 text-sm text-ink-500">
                {t.yearlyEquivalent(YEARLY_PER_MONTH_APPROX)}
              </p>
            ) : null}
          </div>
          <FeatureList items={t.proFeatures} />
          <div className="mt-auto pt-2">
            {plan === "free" ? (
              <button
                type="button"
                onClick={() => runPlanAction(() => upgradeAction(interval))}
                disabled={pending}
                className={cn(buttonCn("primary"), "w-full")}
              >
                {pending ? t.working : t.upgrade}
              </button>
            ) : null}
          </div>
        </Card>
      </div>

      {planNotice ? <NoticeLine notice={planNotice} /> : null}
      {!stripeOn ? <p className="text-xs text-ink-500">{t.demoNote}</p> : null}

      {/* --- Workspace --- */}
      <Card className="max-w-xl">
        <CardTitle>{t.workspaceTitle}</CardTitle>
        <p className="mb-4 text-sm text-ink-500">{t.workspaceDesc}</p>
        <form onSubmit={onRename} className="space-y-3">
          <div>
            <Label htmlFor="ws-name">{t.workspaceNameLabel}</Label>
            <div className="flex gap-2">
              <input
                id="ws-name"
                name="name"
                type="text"
                defaultValue={workspaceName}
                required
                minLength={2}
                maxLength={80}
                className={inputCn}
              />
              <button
                type="submit"
                disabled={pending}
                className={buttonCn("secondary")}
              >
                {t.save}
              </button>
            </div>
          </div>
          {wsNotice ? <NoticeLine notice={wsNotice} /> : null}
        </form>
      </Card>

      {/* --- Retention offer modal --- */}
      {retentionOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="retention-title"
        >
          <div className="relative w-full max-w-md rounded-xl border border-ink-200 bg-paper p-6 shadow-pop">
            <button
              type="button"
              onClick={() => setRetentionOpen(false)}
              aria-label={t.retentionClose}
              className="absolute top-4 right-4 text-ink-400 transition-colors hover:text-ink-900"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
            <h2
              id="retention-title"
              className="pr-8 text-lg font-bold tracking-tight text-ink-900"
            >
              {t.retentionTitle}
            </h2>
            <p className="mt-2 text-sm text-ink-700">
              {t.retentionBody(RETENTION_PRICE)}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  runPlanAction(acceptRetentionOfferAction, () =>
                    setRetentionOpen(false),
                  )
                }
                disabled={pending}
                className={buttonCn("primary")}
              >
                {pending ? t.working : t.retentionAccept}
              </button>
              <button
                type="button"
                onClick={() =>
                  runPlanAction(cancelSubscriptionAction, () =>
                    setRetentionOpen(false),
                  )
                }
                disabled={pending}
                className={buttonCn("ghost")}
              >
                {pending ? t.working : t.retentionDecline}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
