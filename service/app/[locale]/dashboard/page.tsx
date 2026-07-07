import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireOperator } from "@/lib/auth/operator";
import { listPocs, onboardingSignals, pocStats } from "@/lib/db/repo";
import { Badge, buttonCn, Card, EmptyState, Mono } from "@/components/ui";
import { localePath } from "@/lib/i18n/locales";
import { dashboardDict, resolveLocale } from "@/lib/i18n/dashboard";
import { OnboardingChecklist } from "./onboarding";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  return { title: dashboardDict[locale].home.metaTitle };
}

export default async function DashboardPage({ params }: PageProps) {
  const { workspace } = await requireOperator();
  const locale = resolveLocale((await params).locale);
  const t = dashboardDict[locale].home;
  const rows = listPocs(workspace.id).map((poc) => ({
    poc,
    stats: pocStats(poc.id),
  }));
  const signals = onboardingSignals(workspace.id);

  return (
    <div>
      <OnboardingChecklist signals={signals} locale={locale} />
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          {t.title}
        </h1>
        <Link
          href={localePath(locale, "/dashboard/new")}
          className={buttonCn("primary")}
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t.newPoc}
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState title={t.emptyTitle} hint={t.emptyHint}>
          <Link
            href={localePath(locale, "/dashboard/new")}
            className={buttonCn("primary")}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t.newPoc}
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map(({ poc, stats }) => (
            <Link
              key={poc.id}
              href={localePath(locale, `/dashboard/pocs/${poc.id}`)}
              className="group block"
            >
              <Card className="flex h-full flex-col gap-4 transition-colors group-hover:border-ink-400">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-ink-900">
                      {poc.name}
                    </h2>
                    <p className="mt-0.5 truncate text-sm text-ink-500">
                      {poc.ownerEntity}
                      {poc.clientEntity ? ` → ${poc.clientEntity}` : ""}
                    </p>
                  </div>
                  {poc.status === "active" ? (
                    <Badge tone="success">{t.statusLive}</Badge>
                  ) : (
                    <Badge tone="warning">{t.statusPaused}</Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-600">
                  <span>
                    <span className="font-semibold text-ink-900">
                      {stats.evaluators}
                    </span>{" "}
                    {t.evaluatorsUnit(stats.evaluators)}
                  </span>
                  <span>
                    <span className="font-semibold text-ink-900">
                      {stats.activeSessions}
                    </span>{" "}
                    {t.sessionsUnit(stats.activeSessions)}
                  </span>
                  <span>
                    <span className="font-semibold text-ink-900">
                      {stats.signatures}
                    </span>{" "}
                    {t.signaturesUnit(stats.signatures)}
                  </span>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                  <Mono className="truncate">/gate/{poc.slug}</Mono>
                  <span className="shrink-0 text-sm font-semibold text-brand group-hover:underline">
                    {t.manage}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
