"use client";

import { usePathname } from "next/navigation";
import { splitLocaleFromPath, type Locale } from "@/lib/i18n/locales";

/**
 * Error boundaries receive no route params, so the locale is derived from
 * the URL itself (a /ja prefix) — same trick as the LocaleSwitcher.
 */
const STRINGS: Record<
  Locale,
  { eyebrow: string; title: string; body: string; retry: string }
> = {
  en: {
    eyebrow: "Something went wrong",
    title: "The gate hit a snag.",
    body: "An unexpected error occurred. Try again — if it keeps happening, come back in a minute.",
    retry: "Try again",
  },
  ja: {
    eyebrow: "エラーが発生しました",
    title: "ゲートに問題が発生しました。",
    body: "予期しないエラーが発生しました。もう一度お試しください。解消しない場合は、少し時間をおいてから再度アクセスしてください。",
    retry: "再試行",
  },
};

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale] = splitLocaleFromPath(usePathname() ?? "/");
  const t = STRINGS[locale];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="font-mono text-xs font-medium tracking-[0.14em] uppercase text-warning">
        {t.eyebrow}
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
        {t.title}
      </h1>
      <p className="mt-4 max-w-md text-base text-ink-600">{t.body}</p>
      {error.digest ? (
        <p className="mt-3 font-mono text-xs text-ink-400">
          Ref: {error.digest}
        </p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-lg bg-ink-900 px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-ink-700 active:bg-ink-950"
      >
        {t.retry}
      </button>
    </div>
  );
}
