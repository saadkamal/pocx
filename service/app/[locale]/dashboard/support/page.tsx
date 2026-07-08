import type { Metadata } from "next";
import { requireOperator } from "@/lib/auth/operator";
import { listWorkspaceTickets, type TicketStatus } from "@/lib/db/tickets";
import { formatDateTime } from "@/lib/utils";
import { dashboardDict, resolveLocale } from "@/lib/i18n/dashboard";
import { SupportClient } from "./support-client";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  return { title: dashboardDict[locale].support.metaTitle };
}

export default async function SupportPage({ params }: PageProps) {
  const ctx = await requireOperator();
  const locale = resolveLocale((await params).locale);

  const rows = listWorkspaceTickets(ctx.workspace.id).map((t) => ({
    id: t.id,
    subject: t.subject,
    status: t.status as TicketStatus,
    created: formatDateTime(t.createdAt),
    updated: formatDateTime(t.updatedAt),
    createdBy: t.createdBy,
  }));

  return <SupportClient rows={rows} locale={locale} />;
}
