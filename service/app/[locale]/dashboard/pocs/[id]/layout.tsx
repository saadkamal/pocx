import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { pocForWorkspace, requireOperator } from "@/lib/auth/operator";
import { Badge, Mono } from "@/components/ui";
import { hasAuditTrail } from "@/lib/plans";
import { pocxOrigin } from "@/lib/utils";
import { dashboardDict, resolveLocale } from "@/lib/i18n/dashboard";
import { PocTabs } from "./tabs";

/**
 * Per-PoC shell: name + status + gate URL, then the section tab bar.
 * Every child page re-loads and re-authorizes the PoC itself — this
 * layout is presentation, not the security boundary.
 */
export default async function PocLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; id: string }>;
}) {
  const ctx = await requireOperator();
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale(rawLocale);
  const t = dashboardDict[locale].poc.shell;
  const poc = pocForWorkspace(ctx, id);
  if (!poc) notFound();

  const gateUrl = `${pocxOrigin()}/gate/${poc.slug}`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          {poc.name}
        </h1>
        <Badge tone={poc.status === "active" ? "success" : "warning"}>
          {poc.status === "active" ? t.statusActive : t.statusPaused}
        </Badge>
        <span className="inline-flex items-center gap-1.5">
          <Mono>{gateUrl}</Mono>
          <a
            href={gateUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={t.openGateAria}
            title={t.openGateAria}
            className="text-ink-500 transition-colors hover:text-brand"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </span>
      </div>

      <PocTabs pocId={poc.id} showAuditLock={!hasAuditTrail(ctx.workspace.plan)} />

      <div className="mt-6">{children}</div>
    </div>
  );
}
