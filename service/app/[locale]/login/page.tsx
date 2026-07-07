import type { Metadata } from "next";
import Link from "next/link";
import { DEFAULT_LOCALE, isLocale, localePath } from "@/lib/i18n/locales";
import { gateDict } from "@/lib/i18n/gate";
import { LocaleSwitcher } from "@/components/locale-switcher";
import LoginClient from "./login-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = gateDict[locale].auth.login;
  return { title: t.metaTitle, description: t.metaDescription };
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = gateDict[locale].auth.login;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper bg-grid px-4 py-12">
      <Link
        href={localePath(locale, "/")}
        className="mb-8 text-3xl font-bold tracking-tight"
        aria-label="POCX home"
      >
        <span className="text-ink-900">POC</span>
        <span className="text-brand">X</span>
      </Link>

      <LoginClient locale={locale} />

      <p className="mt-6 text-sm text-ink-500">
        {t.noAccount}{" "}
        <Link
          href={localePath(locale, "/signup")}
          className="font-semibold text-brand hover:underline"
        >
          {t.startFree}
        </Link>
      </p>

      <LocaleSwitcher tone="light" className="mt-6" />
    </main>
  );
}
