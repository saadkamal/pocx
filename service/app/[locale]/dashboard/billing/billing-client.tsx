"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import {
  downgradeAction,
  renameWorkspaceAction,
  upgradeAction,
  type ActionResult,
} from "../actions";
import { Badge, buttonCn, Card, CardTitle, inputCn, Label } from "@/components/ui";
import { PLANS, PRO_PRICE_USD, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/locales";
import { dashboardDict } from "@/lib/i18n/dashboard";

type Notice = { kind: "ok" | "error"; text: string };

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
  currentPlan,
  workspaceName,
  locale,
}: {
  currentPlan: PlanId;
  workspaceName: string;
  locale: Locale;
}) {
  const router = useRouter();
  const t = dashboardDict[locale].billing;
  const [planNotice, setPlanNotice] = useState<Notice | null>(null);
  const [wsNotice, setWsNotice] = useState<Notice | null>(null);
  const [pending, startTransition] = useTransition();

  function runPlanAction(action: () => Promise<ActionResult>) {
    setPlanNotice(null);
    startTransition(async () => {
      const res = await action();
      // With Stripe configured, upgradeAction redirects to Checkout and we
      // never get here — Next performs the navigation.
      if (res && "error" in res) {
        setPlanNotice({ kind: "error", text: res.error });
      } else if (res && "ok" in res) {
        setPlanNotice(
          res.message ? { kind: "ok", text: res.message } : null,
        );
        router.refresh();
      }
    });
  }

  function onDowngrade() {
    if (!window.confirm(t.downgradeConfirm)) {
      return;
    }
    runPlanAction(downgradeAction);
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
      <div className="grid gap-4 md:grid-cols-2">
        {/* --- Free --- */}
        <Card
          className={cn(
            "flex flex-col gap-4",
            currentPlan === "free" && "border-ink-900 ring-1 ring-ink-900",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="mb-0">{PLANS.free.label}</CardTitle>
              <p className="text-sm text-ink-500">{t.freeTagline}</p>
            </div>
            {currentPlan === "free" ? (
              <Badge tone="brand">{t.currentPlan}</Badge>
            ) : null}
          </div>
          <p className="text-3xl font-bold tracking-tight text-ink-900">
            US$0
            <span className="text-sm font-medium text-ink-500">
              {t.freeForever}
            </span>
          </p>
          <FeatureList items={t.freeFeatures} />
          <div className="mt-auto pt-2">
            {currentPlan === "pro" ? (
              <button
                type="button"
                onClick={onDowngrade}
                disabled={pending}
                className={cn(buttonCn("ghost"), "w-full")}
              >
                {pending ? t.working : t.downgrade}
              </button>
            ) : null}
          </div>
        </Card>

        {/* --- Pro --- */}
        <Card
          className={cn(
            "flex flex-col gap-4",
            currentPlan === "pro" && "border-ink-900 ring-1 ring-ink-900",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="mb-0">{PLANS.pro.label}</CardTitle>
              <p className="text-sm text-ink-500">{t.proTagline}</p>
            </div>
            {currentPlan === "pro" ? (
              <Badge tone="brand">{t.currentPlan}</Badge>
            ) : null}
          </div>
          <p className="text-3xl font-bold tracking-tight text-ink-900">
            US${PRO_PRICE_USD}
            <span className="text-sm font-medium text-ink-500">
              {t.perWorkspaceMonth}
            </span>
          </p>
          <FeatureList items={t.proFeatures} />
          <div className="mt-auto pt-2">
            {currentPlan === "free" ? (
              <button
                type="button"
                onClick={() => runPlanAction(upgradeAction)}
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
      <p className="text-xs text-ink-500">{t.stripeNote}</p>

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
    </div>
  );
}
