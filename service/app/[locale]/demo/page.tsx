import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight, Bird, Lock, ShieldCheck } from "lucide-react";
import { getSessionRow } from "@/lib/db/repo";
import { DEMO_APP_COOKIE, ensureDemoPoc } from "@/lib/demo";
import { DEFAULT_LOCALE, isLocale, localePath } from "@/lib/i18n/locales";
import { marketingDict } from "@/lib/i18n/marketing";
import { verifyJwt } from "@/lib/tokens/jwt";
import { FalconSignOut } from "./sign-out";

/**
 * The "app" behind the public demo gate: Acme Pte Ltd's Project Falcon.
 * Deliberately silly — the punchline is that the visitor verified their
 * identity and e-signed a contract to see it.
 *
 * The access check mirrors what the SDK does in a protected app: verify
 * the HS256 token locally, then revalidate the underlying session against
 * POCX (here in-process) so revocation and terms bumps bite immediately.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = marketingDict[locale].falcon;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    robots: { index: false },
  };
}

export default async function FalconDemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = marketingDict[locale].falcon;

  const poc = ensureDemoPoc();
  const gateHref = `${localePath(locale, `/gate/${poc.slug}`)}?return_to=${encodeURIComponent(poc.appUrl ?? "")}`;

  const token = (await cookies()).get(DEMO_APP_COOKIE)?.value;
  if (!token) redirect(gateHref);

  const check = verifyJwt(token, poc.secret);
  if (!check.ok) redirect(gateHref);

  // Live revalidation — a revoked/expired gate session kills this page.
  const session = getSessionRow(check.claims.sid);
  if (
    !session ||
    session.revokedAt ||
    session.expiresAt.getTime() < Date.now() ||
    check.claims.tv !== poc.termsVersion
  ) {
    redirect(gateHref);
  }

  const email = check.claims.sub;

  return (
    <div className="min-h-screen bg-ink-950 text-paper">
      {/* Confidential bar */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] tracking-[0.14em] uppercase">
            <span className="inline-flex items-center gap-1.5 text-brand">
              <Lock className="h-3 w-3" aria-hidden="true" />
              {t.bannerConfidential}
            </span>
            <span className="text-ink-500" aria-hidden>
              ·
            </span>
            <span className="text-ink-300">Acme Pte Ltd</span>
            <span className="text-ink-500" aria-hidden>
              ·
            </span>
            <span className="text-ink-400 normal-case">
              {t.bannerSignedIn}{" "}
              <span className="text-ink-200">{email}</span>
            </span>
          </p>
          <FalconSignOut slug={poc.slug} locale={locale} label={t.signOut} />
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
        {/* The idea */}
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
            <Bird className="size-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.title}
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-ink-300">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {t.kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
            >
              <p className="font-mono text-[11px] tracking-[0.12em] text-ink-400 uppercase">
                {kpi.label}
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-paper">
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        {/* Dispatch log */}
        <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <p className="font-mono text-[11px] tracking-[0.12em] text-ink-400 uppercase">
              {t.logTitle}
            </p>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
          </div>
          <ul className="divide-y divide-white/5">
            {t.logs.map((line, i) => (
              <li
                key={i}
                className="flex gap-3 px-5 py-3 font-mono text-[13px] leading-relaxed text-ink-300"
              >
                <span className="shrink-0 text-ink-500">
                  {String(9 + i).padStart(2, "0")}:{String(41 + i * 3).padStart(2, "0")}
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        {/* The reveal */}
        <div className="mt-14 rounded-2xl bg-paper p-8 text-ink-900 sm:p-10">
          <p className="eyebrow">{t.reveal.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.reveal.title}
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-600">
            {t.reveal.p1}
          </p>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-600">
            {t.reveal.p2}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={localePath(locale, "/signup")}
              className="inline-flex items-center gap-2 rounded-lg bg-ink-950 px-6 py-3 text-sm font-semibold text-paper transition-opacity hover:opacity-90"
            >
              {t.reveal.ctaPrimary}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href={localePath(locale, "/docs")}
              className="inline-flex items-center gap-1.5 px-2 text-sm font-semibold text-ink-600 transition-colors hover:text-ink-900"
            >
              {t.reveal.ctaSecondary}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <p className="mt-10 flex items-center justify-center gap-1.5 text-center text-xs text-ink-500">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t.protectedLine}
        </p>
      </main>
    </div>
  );
}
