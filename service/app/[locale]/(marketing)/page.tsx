import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  FileSignature,
  KeyRound,
  ListChecks,
  Lock,
  Paintbrush,
  ScrollText,
  ShieldCheck,
  Star,
  TimerReset,
} from "lucide-react";
import { buttonCn, GithubMark } from "@/components/ui";
import { localePath, type Locale } from "@/lib/i18n/locales";
import { marketingDict, type MarketingStrings } from "@/lib/i18n/marketing";
import { PRO_PRICE_USD } from "@/lib/plans";
import { CopyButton } from "./copy-button";
import { ProblemDemo } from "./problem-demo";
import { Reveal } from "./reveal";

const GITHUB_URL = "https://github.com/saadkamal/pocx";

const PROXY_SNIPPET = `import { createPocxGate } from "./lib/pocx";
const gate = createPocxGate();
export const proxy = gate.nextProxy();`;

const CLONE_LINE = "git clone https://github.com/saadkamal/pocx";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = marketingDict[locale];
  return {
    title: { absolute: t.meta.landingTitle },
    description: t.meta.landingDescription,
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = (await params).locale as Locale;
  const t = marketingDict[locale];
  return (
    <>
      <Hero locale={locale} t={t} />
      <ProblemSection t={t} />
      <SolutionSection t={t} />
      <HowItWorks t={t} />
      <FeaturesGrid t={t} />
      <WhySection t={t} />
      <OpenSourceSection locale={locale} t={t} />
      <PricingTeaser locale={locale} t={t} />
      <FinalCta locale={locale} t={t} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 1 — Hero                                                            */
/* ------------------------------------------------------------------ */

function Hero({ locale, t }: { locale: Locale; t: MarketingStrings }) {
  return (
    <section>
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-14 pb-14 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <p className="eyebrow">{t.hero.eyebrow}</p>

          <h1 className="mt-5 text-5xl leading-[1.02] font-semibold tracking-tight text-balance text-ink-900 sm:text-6xl lg:text-7xl">
            {t.hero.titleMain}
            <span className="text-brand">{t.hero.titleAccent}</span>
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-600">
            {t.hero.subtitle}
          </p>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href={localePath(locale, "/signup")}
              className={buttonCn("primary", "lg")}
            >
              {t.hero.startFree}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className={buttonCn("secondary", "lg")}
            >
              <GithubMark className="size-4" />
              {t.hero.selfHost}
            </a>
            <Link
              href={localePath(locale, "/docs")}
              className="inline-flex items-center gap-1.5 px-2 text-sm font-semibold text-ink-600 transition-colors hover:text-ink-900"
            >
              {t.hero.readDocs}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <p className="mt-4 font-mono text-xs text-ink-500">
            {t.hero.finePrint}
          </p>

          {/* Audience strip — quiet mono labels, dot-separated. */}
          <p className="mt-6 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 font-mono text-[11px] tracking-[0.12em] text-ink-500 uppercase">
            {t.hero.audience.map((label, i) => (
              <span key={label} className="flex items-center gap-x-2.5">
                {i > 0 ? (
                  <span aria-hidden className="text-ink-300">
                    ·
                  </span>
                ) : null}
                {label}
              </span>
            ))}
          </p>
        </div>

        <HeroVisual t={t} />
      </div>
    </section>
  );
}

function HeroVisual({ t }: { t: MarketingStrings }) {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="hero-visual-in">
        {/* Terms card — clearly secondary, peeks out behind the frame. */}
        <div
          aria-hidden
          className="absolute -top-6 -right-4 z-0 hidden w-60 rounded-xl border border-ink-200 bg-white p-5 shadow-card md:block xl:-right-8"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-ink-900">
              {t.heroVisual.termsTitle}
            </p>
            <span className="rounded-full border border-ink-200 bg-ink-50 px-2 py-0.5 font-mono text-[10px] text-ink-500">
              v1.2
            </span>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-1.5 w-full rounded-full bg-ink-100" />
            <div className="h-1.5 w-11/12 rounded-full bg-ink-100" />
            <div className="h-1.5 w-full rounded-full bg-ink-100" />
            <div className="h-1.5 w-4/5 rounded-full bg-ink-100" />
            <div className="h-1.5 w-2/3 rounded-full bg-ink-100" />
          </div>
          <div className="mt-5 rounded-lg bg-ink-900 px-4 py-2 text-center text-xs font-semibold text-paper">
            {t.heroVisual.agreeContinue}
          </div>
        </div>

        {/* Browser frame: a real-looking demo app, visible but gated. */}
        <div className="relative z-10 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-pop">
          <div className="flex items-center gap-3 border-b border-ink-200 bg-ink-50 px-4 py-3">
            <div className="flex gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-ink-300" />
              <span className="size-2.5 rounded-full bg-ink-300" />
              <span className="size-2.5 rounded-full bg-ink-300" />
            </div>
            <div className="flex-1 rounded-md border border-ink-200 bg-white px-3 py-1.5 text-center font-mono text-xs text-ink-500">
              demo.acme.dev
            </div>
          </div>

          <div className="relative">
            {/* The demo app itself — skeleton UI in ink tones. */}
            <div aria-hidden className="flex min-h-[460px]">
              {/* Sidebar */}
              <div className="hidden w-28 shrink-0 flex-col border-r border-ink-100 bg-ink-50/60 p-3.5 sm:flex">
                <div className="flex items-center gap-2">
                  <span className="size-4 shrink-0 rounded bg-ink-300" />
                  <span className="h-2 w-12 rounded-full bg-ink-200" />
                </div>
                <div className="mt-6 space-y-3.5">
                  <div className="h-2 w-full rounded-full bg-ink-300" />
                  <div className="h-2 w-5/6 rounded-full bg-ink-200" />
                  <div className="h-2 w-4/6 rounded-full bg-ink-200" />
                  <div className="h-2 w-5/6 rounded-full bg-ink-200" />
                  <div className="h-2 w-3/6 rounded-full bg-ink-200" />
                </div>
              </div>

              {/* Main pane: header, stat cards, chart, table rows. */}
              <div className="min-w-0 flex-1 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="h-2.5 w-28 rounded-full bg-ink-300" />
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-16 rounded-md bg-ink-100" />
                    <div className="size-6 rounded-full bg-ink-200" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  <div className="rounded-lg border border-ink-100 p-2.5">
                    <div className="h-1.5 w-10 rounded-full bg-ink-200" />
                    <div className="mt-2 h-2.5 w-12 rounded-full bg-ink-300" />
                  </div>
                  <div className="rounded-lg border border-ink-100 p-2.5">
                    <div className="h-1.5 w-8 rounded-full bg-ink-200" />
                    <div className="mt-2 h-2.5 w-14 rounded-full bg-ink-300" />
                  </div>
                  <div className="rounded-lg border border-ink-100 p-2.5">
                    <div className="h-1.5 w-10 rounded-full bg-ink-200" />
                    <div className="mt-2 h-2.5 w-10 rounded-full bg-ink-300" />
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-ink-100 p-3">
                  <div className="h-1.5 w-16 rounded-full bg-ink-200" />
                  <div className="mt-3 flex h-20 items-end gap-1.5">
                    <div className="h-8 flex-1 rounded-sm bg-ink-200" />
                    <div className="h-12 flex-1 rounded-sm bg-ink-200" />
                    <div className="h-9 flex-1 rounded-sm bg-ink-200" />
                    <div className="h-14 flex-1 rounded-sm bg-ink-200" />
                    <div className="h-10 flex-1 rounded-sm bg-ink-200" />
                    <div className="h-16 flex-1 rounded-sm bg-brand/70" />
                    <div className="h-11 flex-1 rounded-sm bg-ink-200" />
                    <div className="h-12 flex-1 rounded-sm bg-ink-200" />
                  </div>
                </div>

                <div className="mt-3.5 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="size-4 shrink-0 rounded-full bg-ink-100" />
                    <span className="h-1.5 flex-1 rounded-full bg-ink-100" />
                    <span className="h-1.5 w-10 rounded-full bg-ink-100" />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="size-4 shrink-0 rounded-full bg-ink-100" />
                    <span className="h-1.5 flex-1 rounded-full bg-ink-100" />
                    <span className="h-1.5 w-14 rounded-full bg-ink-100" />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="size-4 shrink-0 rounded-full bg-ink-100" />
                    <span className="h-1.5 flex-1 rounded-full bg-ink-100" />
                    <span className="h-1.5 w-8 rounded-full bg-ink-100" />
                  </div>
                </div>
              </div>
            </div>

            {/* Frosted gate over the lower part of the app: visible, not accessible. */}
            <div className="absolute inset-x-0 top-[34%] bottom-0 flex items-center justify-center border-t border-ink-200/60 bg-paper/70 p-4 backdrop-blur-sm">
              <div className="w-full max-w-[300px] rounded-xl border border-ink-200 bg-white p-5 text-center shadow-pop">
                <span className="inline-flex size-9 items-center justify-center rounded-full border border-ink-200 bg-ink-50 text-ink-700">
                  <Lock className="size-4" aria-hidden />
                </span>
                <p className="eyebrow mt-3">ACME PTE LTD · PRIVATE DEMO</p>
                <p className="mt-1.5 text-lg font-bold text-ink-900">
                  Project Falcon
                </p>
                <div className="mt-4 rounded-lg border border-ink-300 bg-white px-3 py-2 text-left text-xs text-ink-400">
                  you@company.com
                </div>
                <div className="mt-2 rounded-lg bg-ink-900 px-4 py-2 text-xs font-semibold text-paper">
                  {t.heroVisual.emailCode}
                </div>
                <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] leading-snug text-ink-400">
                  <ShieldCheck className="size-3 shrink-0" aria-hidden />
                  <span className="text-left">{t.heroVisual.protectedLine}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2 — Problem (emotional core + animated demo)                        */
/* ------------------------------------------------------------------ */

function ProblemSection({ t }: { t: MarketingStrings }) {
  return (
    <section className="rule bg-grid">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">{t.problem.eyebrow}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance text-ink-900 sm:text-4xl">
            {t.problem.title}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-600">
            {t.problem.lead}
          </p>
        </Reveal>

        <Reveal className="mt-14 rounded-2xl border border-ink-200 bg-paper/70 p-5 shadow-card sm:p-8">
          <ProblemDemo demo={t.problem.demo} />
        </Reveal>

        {/* Three beats as a numbered horizontal flow. */}
        <div className="mt-16 grid gap-8 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-start sm:gap-4">
          {t.problem.beats.map((beat, i) => (
            <ProblemBeat
              key={beat.n}
              beat={beat}
              last={i === t.problem.beats.length - 1}
              delay={i * 90}
            />
          ))}
        </div>

        <Reveal className="mt-16 max-w-3xl">
          <p className="text-2xl leading-snug font-medium text-balance text-ink-900 sm:text-3xl">
            {t.problem.punch}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function ProblemBeat({
  beat,
  last,
  delay,
}: {
  beat: { n: string; text: string };
  last: boolean;
  delay: number;
}) {
  return (
    <>
      <Reveal delay={delay}>
        <span className="inline-flex size-9 items-center justify-center rounded-full border border-ink-300 font-mono text-xs font-semibold text-ink-500">
          {beat.n}
        </span>
        <p className="mt-4 text-base leading-relaxed text-ink-800">
          {beat.text}
        </p>
      </Reveal>
      {!last ? (
        <div
          aria-hidden
          className="hidden items-center pt-4 text-ink-300 sm:flex"
        >
          <ArrowRight className="size-5" />
        </div>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 3 — Solution                                                        */
/* ------------------------------------------------------------------ */

function SolutionSection({ t }: { t: MarketingStrings }) {
  return (
    <section className="rule bg-ink-950">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <Reveal className="max-w-2xl">
          <p className="eyebrow text-ink-400">{t.solution.eyebrow}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance text-paper sm:text-4xl">
            {t.solution.title}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-300">
            {t.solution.body}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 4 — How it works                                                    */
/* ------------------------------------------------------------------ */

function StepBlock({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-2 lg:px-8 lg:first:pl-0 lg:last:pr-0">
      <p className="eyebrow">{eyebrow}</p>
      <h3 className="mt-3 text-lg font-semibold text-ink-900">{title}</h3>
      <div className="mt-2.5 text-sm leading-relaxed text-ink-600">
        {children}
      </div>
    </div>
  );
}

function HowItWorks({ t }: { t: MarketingStrings }) {
  return (
    <section id="how" className="rule scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">{t.how.eyebrow}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            {t.how.title}
          </h2>
        </Reveal>

        <div className="rule mt-12 grid gap-10 pt-12 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-ink-200">
          <StepBlock eyebrow={t.how.step1.eyebrow} title={t.how.step1.title}>
            {t.how.step1.body}
          </StepBlock>

          <StepBlock eyebrow={t.how.step2.eyebrow} title={t.how.step2.title}>
            <p>{t.how.step2.body}</p>
            <div className="mt-4 overflow-hidden rounded-lg bg-ink-950">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2">
                <span className="font-mono text-xs text-ink-400">
                  proxy.ts
                </span>
                <CopyButton text={PROXY_SNIPPET} />
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-ink-100">
                <code>
                  <span className="text-ink-500">
                    {"# curl -o lib/pocx.ts https://pocx.dev/sdk/pocx.ts"}
                  </span>
                  {"\n\n"}
                  {PROXY_SNIPPET}
                </code>
              </pre>
            </div>
          </StepBlock>

          <StepBlock eyebrow={t.how.step3.eyebrow} title={t.how.step3.title}>
            {t.how.step3.body}
          </StepBlock>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 5 — Features                                                        */
/* ------------------------------------------------------------------ */

const FEATURE_ICONS = [
  KeyRound,
  FileSignature,
  TimerReset,
  ListChecks,
  Paintbrush,
  Bot,
] as const;

function FeaturesGrid({ t }: { t: MarketingStrings }) {
  return (
    <section id="features" className="rule scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">{t.features.eyebrow}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            {t.features.title}
          </h2>
          <p className="mt-4 text-lg text-ink-600">{t.features.subtitle}</p>
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-ink-200 bg-ink-200 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((f, i) => {
            const Icon = FEATURE_ICONS[i] ?? KeyRound;
            return (
              <div key={f.title} className="bg-paper p-8">
                <Icon className="h-5 w-5 text-ink-400" aria-hidden />
                <h3 className="mt-5 text-base font-semibold text-ink-900">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  {f.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 6 — Why / signature                                                 */
/* ------------------------------------------------------------------ */

function CertRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ink-100 py-2.5 last:border-b-0">
      <span className="font-mono text-xs text-ink-500">{label}</span>
      <span className="truncate font-mono text-xs text-ink-900">{value}</span>
    </div>
  );
}

function WhySection({ t }: { t: MarketingStrings }) {
  return (
    <section className="rule">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-24 sm:py-28 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow">{t.why.eyebrow}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance text-ink-900 sm:text-4xl">
            {t.why.title}
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-600">
            <p>{t.why.p1}</p>
            <p>
              {t.why.p2Before}
              <em className="rounded bg-brand-subtle px-1 py-0.5 font-medium text-brand-active not-italic">
                {t.why.p2Em}
              </em>
              {t.why.p2After}
            </p>
            <p>{t.why.p3}</p>
          </div>
        </Reveal>

        <Reveal
          delay={120}
          className="rounded-xl border border-ink-200 bg-white p-7 shadow-card"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-900">
              {t.why.cert.title}
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success-subtle px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest text-success">
              <Check className="size-3" aria-hidden />
              {t.why.cert.recorded}
            </span>
          </div>
          <div className="mt-5">
            <CertRow label={t.why.cert.sigId} value="sig_9f2ce41ab7" />
            <CertRow label={t.why.cert.signedBy} value="jane@client.com" />
            <CertRow label={t.why.cert.termsVersion} value="v1.2" />
            <CertRow
              label={t.why.cert.timestamp}
              value="2026-07-07 09:14:32 UTC"
            />
            <CertRow label={t.why.cert.ip} value="203.0.113.42" />
            <CertRow label="SHA-256" value="e3b0c44298fc1c149afbf4c8996fb924…" />
          </div>
          <p className="mt-5 flex items-center gap-1.5 text-xs text-ink-500">
            <ScrollText className="size-3.5" aria-hidden />
            {t.why.cert.footnote}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 7 — Open source                                                     */
/* ------------------------------------------------------------------ */

function OpenSourceSection({
  locale,
  t,
}: {
  locale: Locale;
  t: MarketingStrings;
}) {
  return (
    <section className="rule">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Reveal>
            <p className="eyebrow">{t.openSource.eyebrow}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance text-ink-900 sm:text-4xl">
              {t.openSource.title}
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-700">
              <p>{t.openSource.body1}</p>
              <p>{t.openSource.body2}</p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={localePath(locale, "/signup")}
                className={buttonCn("primary", "lg")}
              >
                {t.openSource.ctaCloud}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className={buttonCn("secondary", "lg")}
              >
                <GithubMark className="size-4" />
                {t.openSource.ctaGithub}
              </a>
            </div>
            <p className="mt-5 font-mono text-xs text-ink-500">
              {t.openSource.note}
            </p>
          </Reveal>

          <Reveal delay={120}>
            {/* A git-clone terminal + an open-source chip row. */}
            <div className="overflow-hidden rounded-xl border border-ink-200 bg-ink-950 shadow-card">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
                <span className="font-mono text-xs text-ink-400">
                  ~/your-project
                </span>
                <CopyButton text={CLONE_LINE} />
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-ink-100">
                <code>
                  <span className="text-brand" aria-hidden>
                    ${" "}
                  </span>
                  {CLONE_LINE}
                  {"\n"}
                  <span className="text-ink-500">
                    {"# every feature. no seat limits. your server."}
                  </span>
                </code>
              </pre>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 font-mono text-[11px] text-ink-600">
                <Star className="size-3 text-brand" aria-hidden />
                open source
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 font-mono text-[11px] text-ink-600">
                <GithubMark className="size-3" />
                AGPL-3.0
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 font-mono text-[11px] text-ink-600">
                <ShieldCheck className="size-3 text-ink-400" aria-hidden />
                self-host free
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 8 — Pricing teaser                                                  */
/* ------------------------------------------------------------------ */

function PricingTeaser({ locale, t }: { locale: Locale; t: MarketingStrings }) {
  return (
    <section className="rule">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <Reveal className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">{t.teaser.eyebrow}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              {t.teaser.title}
            </h2>
          </div>
          <Link
            href={localePath(locale, "/pricing")}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
          >
            {t.teaser.seePricing}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-ink-200 bg-white p-8">
            <h3 className="text-lg font-semibold text-ink-900">
              {t.teaser.free.name}
            </h3>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-ink-900">
              US$0
              <span className="text-base font-medium text-ink-500">
                {t.teaser.free.priceSuffix}
              </span>
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-ink-600">
              {t.teaser.free.bullets.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-ink-400"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href={localePath(locale, "/signup")}
              className={`${buttonCn("primary")} mt-8 w-full`}
            >
              {t.teaser.free.cta}
            </Link>
          </div>

          <div className="relative rounded-xl border border-ink-900 bg-white p-8">
            <span className="absolute -top-3 right-6 rounded-full border border-brand/20 bg-brand-subtle px-3 py-1 font-mono text-[10px] font-bold tracking-widest text-brand">
              {t.teaser.pro.badge}
            </span>
            <h3 className="text-lg font-semibold text-ink-900">
              {t.teaser.pro.name}
            </h3>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-ink-900">
              US${PRO_PRICE_USD}
              <span className="text-base font-medium text-ink-500">
                {t.teaser.pro.priceSuffix}
              </span>
            </p>
            <p className="mt-2 text-sm text-ink-500">{t.teaser.pro.yearlyLine}</p>
            <ul className="mt-6 space-y-2.5 text-sm text-ink-600">
              {t.teaser.pro.bullets.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-ink-400"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href={localePath(locale, "/signup")}
              className={`${buttonCn("primary")} mt-8 w-full`}
            >
              {t.teaser.pro.cta}
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-ink-500">
          {t.teaser.selfHostNote}{" "}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
          >
            <GithubMark className="size-3.5" />
            {t.footer.github}
          </a>
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 9 — Final CTA                                                        */
/* ------------------------------------------------------------------ */

function FinalCta({ locale, t }: { locale: Locale; t: MarketingStrings }) {
  return (
    <section className="bg-ink-950">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-10 px-6 py-24 sm:py-28 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-paper sm:text-5xl">
            {t.finalCta.titleMain}
            <span className="text-brand">{t.finalCta.titleAccent}</span>
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-300">
            {t.finalCta.subtitle}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
          <Link
            href={localePath(locale, "/signup")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-paper px-7 py-3.5 text-base font-semibold text-ink-900 transition-colors hover:bg-ink-100"
          >
            {t.finalCta.cta}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 px-7 py-3.5 text-base font-semibold text-paper transition-colors hover:border-white/50 hover:bg-white/5"
          >
            <GithubMark className="size-4" />
            {t.finalCta.ctaGithub}
          </a>
        </div>
      </div>
    </section>
  );
}
