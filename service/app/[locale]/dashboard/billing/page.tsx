import type { Metadata } from "next";
import { requireOperator } from "@/lib/auth/operator";
import { planFor } from "@/lib/plans";
import { retentionOfferAvailable, stripeEnabled } from "@/lib/billing";
import { formatDateTime } from "@/lib/utils";
import { dashboardDict, resolveLocale } from "@/lib/i18n/dashboard";
import BillingClient from "./billing-client";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ upgraded?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  return { title: dashboardDict[locale].billing.metaTitle };
}

export default async function BillingPage({ params, searchParams }: PageProps) {
  const ctx = await requireOperator();
  const { workspace } = ctx;
  const locale = resolveLocale((await params).locale);
  const upgraded = (await searchParams).upgraded === "1";
  const t = dashboardDict[locale].billing;
  const plan = planFor(workspace.plan);

  const billingInterval =
    workspace.billingInterval === "year"
      ? ("year" as const)
      : workspace.billingInterval === "month"
        ? ("month" as const)
        : null;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">
        {t.title}
      </h1>
      <p className="mt-2 mb-6 text-sm text-ink-600">{t.intro}</p>
      <BillingClient
        locale={locale}
        plan={plan.id}
        billingInterval={billingInterval}
        cancelAtPeriodEnd={workspace.cancelAtPeriodEnd}
        currentPeriodEnd={
          workspace.currentPeriodEnd
            ? formatDateTime(workspace.currentPeriodEnd)
            : null
        }
        retentionAvailable={retentionOfferAvailable(workspace)}
        stripeOn={stripeEnabled()}
        workspaceName={workspace.name}
        upgraded={upgraded}
      />
    </div>
  );
}
