import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { buttonCn } from "@/components/ui";
import { localePath, type Locale } from "@/lib/i18n/locales";
import { marketingDict } from "@/lib/i18n/marketing";
import { PRO_PRICE_USD } from "@/lib/plans";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = marketingDict[locale];
  return {
    title: t.meta.pricingTitle,
    description: t.meta.pricingDescription,
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = (await params).locale as Locale;
  const t = marketingDict[locale].pricing;

  return (
    <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
      <div className="max-w-2xl">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance text-ink-900 sm:text-5xl">
          {t.title}
        </h1>
        <p className="mt-5 text-lg text-ink-600">{t.subtitle}</p>
      </div>

      <div className="mx-auto mt-16 grid max-w-4xl gap-6 md:grid-cols-2">
        {/* Free */}
        <div className="flex flex-col rounded-xl border border-ink-200 bg-white p-8">
          <h2 className="text-lg font-semibold text-ink-900">{t.free.name}</h2>
          <p className="mt-3 text-5xl font-semibold tracking-tight text-ink-900">
            US$0
            <span className="text-base font-medium text-ink-500">
              {t.free.priceSuffix}
            </span>
          </p>
          <p className="mt-2 text-sm text-ink-500">{t.free.tagline}</p>
          <ul className="mt-7 flex-1 space-y-3 text-sm text-ink-600">
            {t.free.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-ink-400"
                  aria-hidden
                />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href={localePath(locale, "/signup")}
            className={`${buttonCn("secondary", "lg")} mt-9 w-full`}
          >
            {t.free.cta}
          </Link>
        </div>

        {/* Pro */}
        <div className="relative flex flex-col rounded-xl border border-ink-900 bg-white p-8">
          <span className="absolute -top-3 right-6 rounded-full border border-brand/20 bg-brand-subtle px-3 py-1 font-mono text-[10px] font-bold tracking-widest text-brand">
            {t.pro.badge}
          </span>
          <h2 className="text-lg font-semibold text-ink-900">{t.pro.name}</h2>
          <p className="mt-3 text-5xl font-semibold tracking-tight text-ink-900">
            US${PRO_PRICE_USD}
            <span className="text-base font-medium text-ink-500">
              {t.pro.priceSuffix}
            </span>
          </p>
          <p className="mt-2 text-sm font-medium text-success">
            {t.pro.yearlyLine}
          </p>
          <p className="mt-2 text-sm text-ink-500">{t.pro.tagline}</p>
          <ul className="mt-7 flex-1 space-y-3 text-sm text-ink-600">
            {t.pro.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-ink-400"
                  aria-hidden
                />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href={localePath(locale, "/signup")}
            className={`${buttonCn("primary", "lg")} mt-9 w-full`}
          >
            {t.pro.cta}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <div className="mx-auto mt-24 max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
          {t.faqTitle}
        </h2>
        <div className="mt-10 space-y-3">
          {t.faq.map((item) => (
            <details
              key={item.q}
              className="group rounded-lg border border-ink-200 bg-white open:border-ink-400"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 text-sm font-semibold text-ink-900 select-none">
                {item.q}
                <span
                  className="text-ink-400 transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="px-6 pb-5 text-sm leading-relaxed text-ink-600">
                {item.a}
              </p>
            </details>
          ))}
        </div>
        <p className="mt-14 text-sm text-ink-500">
          {t.still.prefix}
          <Link
            href={localePath(locale, "/docs")}
            className="font-semibold text-brand hover:underline"
          >
            {t.still.docsLabel}
          </Link>
          {t.still.middle}
          <Link
            href={localePath(locale, "/signup")}
            className="font-semibold text-brand hover:underline"
          >
            {t.still.startLabel}
          </Link>
          {t.still.suffix}
        </p>
      </div>
    </div>
  );
}
