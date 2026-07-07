import type { Metadata } from "next";
import { requireOperator } from "@/lib/auth/operator";
import { planFor } from "@/lib/plans";
import { dashboardDict, resolveLocale } from "@/lib/i18n/dashboard";
import BillingClient from "./billing-client";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  return { title: dashboardDict[locale].billing.metaTitle };
}

export default async function BillingPage({ params }: PageProps) {
  const { workspace } = await requireOperator();
  const locale = resolveLocale((await params).locale);
  const t = dashboardDict[locale].billing;
  const plan = planFor(workspace.plan);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">
        {t.title}
      </h1>
      <p className="mt-2 mb-6 text-sm text-ink-600">{t.intro}</p>
      <BillingClient
        currentPlan={plan.id}
        workspaceName={workspace.name}
        locale={locale}
      />
    </div>
  );
}
