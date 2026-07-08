import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { resolveGatePoc } from "@/lib/gate";
import { DEFAULT_LOCALE, isLocale, localePath } from "@/lib/i18n/locales";
import { gateDict } from "@/lib/i18n/gate";
import { LocaleSwitcher } from "@/components/locale-switcher";

/**
 * Hosted-gate chrome: a quiet ivory page with a single white card.
 * The PoC identity sits above the card; the POCX trust line below it.
 * (Pages under this layout re-resolve the PoC themselves — that's fine,
 * the lookup is cheap and layouts can't pass data down.)
 */
export default async function GateLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = gateDict[locale].gate.layout;

  const poc = resolveGatePoc(slug);
  if (!poc) notFound();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper bg-grid px-4 py-12">
      <main className="w-full max-w-md">
        <header className="mb-6 text-center">
          <p className="eyebrow">
            {poc.ownerEntity} &middot; {t.proofOfConcept}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">
            {poc.name}
          </h1>
        </header>

        <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-pop sm:p-8">
          {children}
        </div>

        <footer className="mt-6 flex flex-col items-center gap-3 text-center">
          <Link
            href={localePath(locale, "/")}
            className="inline-flex items-center gap-1.5 text-xs text-ink-400 transition-colors hover:text-ink-600"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t.trustFooter}
          </Link>
          <p className="text-xs text-ink-400">
            <Link
              href={localePath(locale, "/terms")}
              className="transition-colors hover:text-ink-600"
            >
              {t.legalTerms}
            </Link>
            <span aria-hidden> · </span>
            <Link
              href={localePath(locale, "/privacy")}
              className="transition-colors hover:text-ink-600"
            >
              {t.legalPrivacy}
            </Link>
          </p>
          <LocaleSwitcher tone="light" />
        </footer>
      </main>
    </div>
  );
}
