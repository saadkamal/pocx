import type { Metadata } from "next";
import { requireOperator } from "@/lib/auth/operator";
import { listOperators } from "@/lib/db/repo";
import { formatDateTime } from "@/lib/utils";
import { dashboardDict, resolveLocale } from "@/lib/i18n/dashboard";
import { TeamClient } from "./team-client";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  return { title: dashboardDict[locale].team.metaTitle };
}

export default async function TeamPage({ params }: PageProps) {
  const ctx = await requireOperator();
  const locale = resolveLocale((await params).locale);

  const rows = listOperators(ctx.workspace.id).map((o) => ({
    id: o.id,
    email: o.email,
    name: o.name,
    role: o.role === "owner" ? ("owner" as const) : ("member" as const),
    added: formatDateTime(o.createdAt),
    disabled: Boolean(o.disabledAt),
    addedBy: o.addedBy,
  }));

  return (
    <TeamClient
      rows={rows}
      isOwner={ctx.operator.role === "owner"}
      selfId={ctx.operator.id}
      locale={locale}
    />
  );
}
