"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { localePath, splitLocaleFromPath } from "@/lib/i18n/locales";
import { dashboardDict, type DashboardStrings } from "@/lib/i18n/dashboard";

const TABS: { key: keyof DashboardStrings["poc"]["tabs"]; segment: string }[] =
  [
    { key: "overview", segment: "" },
    { key: "evaluators", segment: "/evaluators" },
    { key: "sessions", segment: "/sessions" },
    { key: "signatures", segment: "/signatures" },
    { key: "audit", segment: "/audit" },
    { key: "emails", segment: "/emails" },
    { key: "terms", segment: "/terms" },
    { key: "settings", segment: "/settings" },
  ];

/** Section tab bar — client-side so it can highlight the active route. */
export function PocTabs({ pocId }: { pocId: string }) {
  const pathname = usePathname() ?? "/";
  // Compare against the locale-stripped path so /ja/… highlights correctly.
  const [locale, strippedPath] = splitLocaleFromPath(pathname);
  const t = dashboardDict[locale].poc;
  const base = `/dashboard/pocs/${pocId}`;

  return (
    <nav
      aria-label={t.shell.sectionsAria}
      className="mt-5 flex gap-1 overflow-x-auto border-b border-ink-200"
    >
      {TABS.map((tab) => {
        const path = `${base}${tab.segment}`;
        const active =
          tab.segment === ""
            ? strippedPath === base
            : strippedPath.startsWith(path);
        return (
          <Link
            key={path}
            href={localePath(locale, path)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-ink-900 text-ink-900"
                : "border-transparent text-ink-500 hover:text-ink-800",
            )}
          >
            {t.tabs[tab.key]}
          </Link>
        );
      })}
    </nav>
  );
}
