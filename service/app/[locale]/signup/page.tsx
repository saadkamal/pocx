import type { Metadata } from "next";
import Link from "next/link";
import { DEFAULT_LOCALE, isLocale, localePath } from "@/lib/i18n/locales";
import { gateDict } from "@/lib/i18n/gate";
import { LocaleSwitcher } from "@/components/locale-switcher";
import SignupClient from "./signup-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = gateDict[locale].auth.signup;
  return { title: t.metaTitle, description: t.metaDescription };
}

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = gateDict[locale].auth.signup;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper bg-grid px-4 py-12">
      <Link
        href={localePath(locale, "/")}
        className="text-3xl font-bold tracking-tight"
        aria-label="POCX home"
      >
        <span className="text-ink-900">POC</span>
        <span className="text-brand">X</span>
      </Link>
      <p className="mt-2 mb-8 text-sm text-ink-500">{t.tagline}</p>

      <SignupClient locale={locale} />

      <p className="mt-4 max-w-sm text-center text-xs leading-relaxed text-ink-400">
        {t.agreePrefix}
        <Link
          href={localePath(locale, "/terms")}
          className="underline transition-colors hover:text-ink-600"
        >
          {t.agreeTerms}
        </Link>
        {t.agreeAnd}
        <Link
          href={localePath(locale, "/privacy")}
          className="underline transition-colors hover:text-ink-600"
        >
          {t.agreePrivacy}
        </Link>
        {t.agreeSuffix}
      </p>

      <p className="mt-6 text-sm text-ink-500">
        {t.haveAccount}{" "}
        <Link
          href={localePath(locale, "/login")}
          className="font-semibold text-brand hover:underline"
        >
          {t.logIn}
        </Link>
      </p>

      <LocaleSwitcher tone="light" className="mt-6" />
    </main>
  );
}
