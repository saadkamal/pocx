"use client";

import { useState } from "react";
import { Badge, Card, CardTitle } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/locales";
import { dashboardDict } from "@/lib/i18n/dashboard";

/**
 * Live preview of the resolved terms, per language — the operator sees the
 * same strings the gate will render, including the English fallback when a
 * custom-terms PoC has no Japanese version.
 */
export function TermsPreview({
  paragraphsByLocale,
  termsLocales,
  termsVersion,
  locale,
}: {
  paragraphsByLocale: Partial<Record<Locale, string[]>>;
  termsLocales: Locale[];
  termsVersion: string;
  locale: Locale;
}) {
  const t = dashboardDict[locale].poc.terms;
  const [shown, setShown] = useState<Locale>(
    termsLocales.includes(locale) ? locale : "en",
  );
  const paragraphs = paragraphsByLocale[shown] ?? [];

  return (
    <Card className="self-start">
      <div className="mb-3 flex items-center justify-between gap-3">
        <CardTitle className="mb-0">{t.previewTitle}</CardTitle>
        <Badge tone="brand">v{termsVersion}</Badge>
      </div>
      <p className="mb-4 text-sm text-ink-500">{t.previewDesc}</p>

      {termsLocales.length > 1 ? (
        <div
          className="mb-3 flex items-center gap-1 font-mono text-xs text-ink-500"
          role="group"
          aria-label={t.languageLegend}
        >
          {termsLocales.map((l, i) => (
            <span key={l} className="inline-flex items-center gap-1">
              {i > 0 && <span className="text-ink-300">/</span>}
              <button
                type="button"
                onClick={() => setShown(l)}
                aria-pressed={l === shown}
                className={cn(
                  "rounded px-1 py-0.5 transition-colors",
                  l === shown
                    ? "font-semibold text-ink-900"
                    : "hover:text-ink-900",
                )}
              >
                {l === "ja" ? t.languageJa : t.languageEn}
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div
        lang={shown}
        className="max-h-96 space-y-3 overflow-y-auto rounded-lg border border-ink-200 bg-ink-50 p-4"
      >
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className={
              i === 0
                ? "text-sm font-semibold text-ink-900"
                : "text-sm leading-relaxed text-ink-700"
            }
          >
            {p}
          </p>
        ))}
      </div>
    </Card>
  );
}
