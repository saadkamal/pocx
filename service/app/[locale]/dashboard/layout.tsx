import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, CreditCard, Layers, Users } from "lucide-react";
import { requireOperator } from "@/lib/auth/operator";
import { planFor } from "@/lib/plans";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { localePath } from "@/lib/i18n/locales";
import { dashboardDict, resolveLocale } from "@/lib/i18n/dashboard";
import { LocaleSwitcher } from "@/components/locale-switcher";
import LogoutButton from "./logout-button";

const navItemCn = cn(
  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium",
  "text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900",
);

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { operator, workspace } = await requireOperator();
  const plan = planFor(workspace.plan);
  const locale = resolveLocale((await params).locale);
  const t = dashboardDict[locale].shell;

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-ink-200 bg-paper">
        <div className="px-5 pt-5 pb-4">
          <Link
            href={localePath(locale, "/dashboard")}
            className="text-xl font-bold tracking-tight"
            aria-label={t.logoAria}
          >
            <span className="text-ink-900">POC</span>
            <span className="text-brand">X</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          <Link href={localePath(locale, "/dashboard")} className={navItemCn}>
            <Layers className="h-4 w-4" aria-hidden />
            {t.nav.pocs}
          </Link>
          <Link
            href={localePath(locale, "/dashboard/team")}
            className={navItemCn}
          >
            <Users className="h-4 w-4" aria-hidden />
            {t.nav.team}
          </Link>
          <Link
            href={localePath(locale, "/dashboard/billing")}
            className={navItemCn}
          >
            <CreditCard className="h-4 w-4" aria-hidden />
            {t.nav.billing}
          </Link>
          <a
            href={localePath(locale, "/docs")}
            target="_blank"
            rel="noreferrer"
            className={navItemCn}
          >
            <BookOpen className="h-4 w-4" aria-hidden />
            {t.nav.docs}
          </a>
        </nav>

        <div className="border-t border-ink-200 px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-ink-900">
              {workspace.name}
            </p>
            <Badge tone={plan.id === "pro" ? "brand" : "neutral"}>
              {plan.label.toUpperCase()}
            </Badge>
          </div>
          <div className="mt-2">
            <LocaleSwitcher tone="light" />
          </div>
          <p className="mt-1 truncate text-xs text-ink-500">
            {operator.email}
          </p>
          <div className="mt-3">
            <LogoutButton locale={locale} />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl p-8">{children}</div>
      </main>
    </div>
  );
}
