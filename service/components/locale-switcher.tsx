"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LOCALE_COOKIE,
  localePath,
  splitLocaleFromPath,
  type Locale,
} from "@/lib/i18n/locales";

/**
 * Manual language switcher. Sets the locale cookie (so the choice beats
 * browser detection everywhere) and navigates to the same page in the
 * other locale. Rendered wherever users are: marketing nav/footer, auth
 * pages, the gate footer and the dashboard sidebar.
 */

const LABELS: Record<Locale, string> = { en: "English", ja: "日本語" };

export function LocaleSwitcher({
  className,
  tone = "light",
}: {
  className?: string;
  /** "light" for ivory surfaces, "dark" for ink-950 surfaces. */
  tone?: "light" | "dark";
}) {
  const pathname = usePathname() ?? "/";
  const [current, stripped] = splitLocaleFromPath(pathname);

  function switchTo(locale: Locale) {
    if (locale === current) return;
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    window.location.assign(localePath(locale, stripped) + window.location.search);
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 font-mono text-xs",
        tone === "light" ? "text-ink-500" : "text-ink-400",
        className,
      )}
      aria-label="Language"
    >
      {(Object.keys(LABELS) as Locale[]).map((locale, i) => (
        <span key={locale} className="inline-flex items-center gap-1">
          {i > 0 && (
            <span className={tone === "light" ? "text-ink-300" : "text-ink-600"}>
              /
            </span>
          )}
          <button
            type="button"
            onClick={() => switchTo(locale)}
            className={cn(
              "rounded px-1 py-0.5 transition-colors",
              locale === current
                ? tone === "light"
                  ? "font-semibold text-ink-900"
                  : "font-semibold text-ink-100"
                : tone === "light"
                  ? "hover:text-ink-900"
                  : "hover:text-ink-100",
            )}
            aria-current={locale === current ? "true" : undefined}
          >
            {LABELS[locale]}
          </button>
        </span>
      ))}
    </div>
  );
}
