import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { pocForWorkspace, requireOperator } from "@/lib/auth/operator";
import { listAudit } from "@/lib/db/repo";
import { PRO_PRICE_USD, hasAuditTrail } from "@/lib/plans";
import { Card, buttonCn } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { localePath } from "@/lib/i18n/locales";
import { dashboardDict, resolveLocale } from "@/lib/i18n/dashboard";
import { AuditClient, type AuditItem } from "./audit-client";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const ctx = await requireOperator();
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale(rawLocale);
  const t = dashboardDict[locale].poc.audit;
  const poc = pocForWorkspace(ctx, id);
  if (!poc) notFound();

  if (!hasAuditTrail(ctx.workspace.plan)) {
    return (
      <Card className="mx-auto max-w-xl py-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100">
          <Lock className="h-6 w-6 text-ink-400" />
        </div>
        <h2 className="text-lg font-semibold text-ink-900">{t.lockedTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
          {t.lockedBody}
        </p>
        <Link
          href={localePath(locale, "/dashboard/billing")}
          className={`${buttonCn("primary", "md")} mt-6`}
        >
          {t.lockedCta(PRO_PRICE_USD)}
        </Link>
      </Card>
    );
  }

  const rows: AuditItem[] = listAudit(poc.id, 500).map((r) => ({
    id: r.id,
    time: formatDateTime(r.createdAt),
    event: r.event,
    email: r.email,
    detail: r.detail,
    path: r.path,
    source: r.source,
    ip: r.ip,
  }));

  return <AuditClient pocId={poc.id} rows={rows} locale={locale} />;
}
