import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { localePath, type Locale } from "@/lib/i18n/locales";
import { dashboardDict } from "@/lib/i18n/dashboard";

/**
 * Getting-started checklist. Completion is auto-detected from real data
 * (repo.onboardingSignals) — no dismiss state to persist. Hidden once all
 * four steps are done.
 */

export type OnboardingSignals = {
  hasPoc: boolean;
  hasEvaluator: boolean;
  hasSdkConnection: boolean;
  hasGateLogin: boolean;
  firstPocId: string | null;
};

type Step = {
  done: boolean;
  title: string;
  detail: string;
  href: string;
  cta: string;
};

export function OnboardingChecklist({
  signals,
  locale,
}: {
  signals: OnboardingSignals;
  locale: Locale;
}) {
  const t = dashboardDict[locale].onboarding;
  const pocBase = signals.firstPocId
    ? `/dashboard/pocs/${signals.firstPocId}`
    : "/dashboard/new";

  const steps: Step[] = [
    {
      done: signals.hasPoc,
      title: t.steps.createPoc.title,
      detail: t.steps.createPoc.detail,
      href: localePath(locale, "/dashboard/new"),
      cta: t.steps.createPoc.cta,
    },
    {
      done: signals.hasEvaluator,
      title: t.steps.inviteEvaluators.title,
      detail: t.steps.inviteEvaluators.detail,
      href: localePath(
        locale,
        signals.firstPocId ? `${pocBase}/evaluators` : "/dashboard/new",
      ),
      cta: t.steps.inviteEvaluators.cta,
    },
    {
      done: signals.hasSdkConnection,
      title: t.steps.connectApp.title,
      detail: t.steps.connectApp.detail,
      href: localePath(locale, pocBase),
      cta: t.steps.connectApp.cta,
    },
    {
      done: signals.hasGateLogin,
      title: t.steps.testGate.title,
      detail: t.steps.testGate.detail,
      href: localePath(locale, pocBase),
      cta: t.steps.testGate.cta,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  return (
    <Card className="mb-6 bg-white">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink-900">{t.title}</h2>
          <p className="text-sm text-ink-500">{t.subtitle}</p>
        </div>
        <span className="shrink-0 rounded-full bg-ink-900 px-3 py-1 text-sm font-semibold text-paper">
          {t.progress(doneCount, steps.length)}
        </span>
      </div>

      <ol className="grid gap-3 md:grid-cols-2">
        {steps.map((step, i) => (
          <li
            key={step.title}
            className={cn(
              "rounded-lg border bg-paper p-4",
              step.done ? "border-success/30" : "border-ink-200",
            )}
          >
            <div className="flex items-start gap-3">
              {step.done ? (
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-success"
                  aria-hidden
                />
              ) : (
                <Circle
                  className="mt-0.5 h-5 w-5 shrink-0 text-ink-300"
                  aria-hidden
                />
              )}
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    step.done ? "text-ink-500 line-through" : "text-ink-900",
                  )}
                >
                  {i + 1}. {step.title}
                </p>
                <p className="mt-0.5 text-sm text-ink-500">{step.detail}</p>
                {!step.done && (
                  <Link
                    href={step.href}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
                  >
                    {step.cta}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-sm text-ink-500">
        {t.helpBefore}
        <a
          href={localePath(locale, "/tutorials")}
          target="_blank"
          className="font-semibold text-brand hover:underline"
        >
          {t.helpTutorials}
        </a>
        {t.helpBetween}
        <a
          href={localePath(locale, "/faq")}
          target="_blank"
          className="font-semibold text-brand hover:underline"
        >
          {t.helpFaq}
        </a>
        {t.helpAfter}
      </p>
    </Card>
  );
}
