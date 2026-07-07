import { notFound } from "next/navigation";
import { pocForWorkspace, requireOperator } from "@/lib/auth/operator";
import { countActiveEvaluators, listEvaluators } from "@/lib/db/repo";
import { planFor } from "@/lib/plans";
import { formatDateTime } from "@/lib/utils";
import { resolveLocale } from "@/lib/i18n/dashboard";
import { EvaluatorsClient } from "./evaluators-client";

export default async function EvaluatorsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const ctx = await requireOperator();
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale(rawLocale);
  const poc = pocForWorkspace(ctx, id);
  if (!poc) notFound();

  const plan = planFor(ctx.workspace.plan);
  const rows = listEvaluators(poc.id).map((e) => ({
    id: e.id,
    email: e.email,
    name: e.name,
    disabled: Boolean(e.disabledAt),
    added: formatDateTime(e.createdAt),
    addedBy: e.addedBy,
  }));

  return (
    <EvaluatorsClient
      pocId={poc.id}
      rows={rows}
      activeCount={countActiveEvaluators(poc.id)}
      maxSeats={plan.maxEvaluatorsPerPoc}
      planId={plan.id}
      locale={locale}
    />
  );
}
