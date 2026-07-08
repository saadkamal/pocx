import type { ReactNode } from "react";
import Link from "next/link";
import { buttonCn } from "@/components/ui";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { localePath, type Locale } from "@/lib/i18n/locales";
import { marketingDict } from "@/lib/i18n/marketing";

function Wordmark() {
  return (
    <span className="text-lg font-bold tracking-tight text-ink-900">
      POC<span className="text-brand">X</span>
    </span>
  );
}

export default async function MarketingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = (await params).locale as Locale;
  const t = marketingDict[locale];

  const navLinks = [
    { href: localePath(locale, "/#how"), label: t.nav.how },
    { href: localePath(locale, "/#features"), label: t.nav.features },
    { href: localePath(locale, "/pricing"), label: t.nav.pricing },
    { href: localePath(locale, "/docs"), label: t.nav.docs },
    { href: localePath(locale, "/tutorials"), label: t.nav.tutorials },
    { href: localePath(locale, "/faq"), label: t.nav.faq },
  ];

  const footerColumns = [
    {
      title: t.footer.product,
      links: [
        { href: localePath(locale, "/pricing"), label: t.footer.pricing },
        { href: localePath(locale, "/docs"), label: t.footer.docs },
        { href: localePath(locale, "/tutorials"), label: t.footer.tutorials },
        { href: localePath(locale, "/faq"), label: t.footer.faq },
        { href: "/llms.txt", label: "llms.txt" },
      ],
    },
    {
      title: t.footer.forAgents,
      links: [
        { href: "/llms.txt", label: "/llms.txt" },
        { href: "/sdk/pocx.ts", label: "/sdk/pocx.ts" },
        {
          href: "https://github.com/saadkamal/pocx",
          label: t.footer.github,
          external: true,
        },
      ],
    },
    {
      title: t.footer.account,
      links: [
        { href: localePath(locale, "/login"), label: t.footer.login },
        { href: localePath(locale, "/signup"), label: t.footer.signup },
      ],
    },
    {
      title: t.footer.legal,
      links: [
        { href: localePath(locale, "/terms"), label: t.footer.terms },
        { href: localePath(locale, "/privacy"), label: t.footer.privacy },
        {
          href: "mailto:pocx@haxo.com.au",
          label: t.footer.contact,
          external: true,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-paper text-ink-900">
      <header className="sticky top-0 z-50 border-b border-ink-200 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-10">
            <Link href={localePath(locale, "/")} aria-label="POCX home">
              <Wordmark />
            </Link>
            <nav className="hidden items-center gap-7 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-ink-600 transition-colors hover:text-ink-900"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher tone="light" className="mr-1 hidden sm:inline-flex" />
            <Link href={localePath(locale, "/login")} className={buttonCn("ghost")}>
              {t.nav.login}
            </Link>
            <Link href={localePath(locale, "/signup")} className={buttonCn("primary")}>
              {t.nav.startFree}
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="rule">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-500">
              {t.footer.tagline}
            </p>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-ink-400">
              {t.footer.company}
            </p>
          </div>
          {footerColumns.map((col) => (
            <div key={col.title}>
              <p className="eyebrow">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-ink-500 transition-colors hover:text-ink-900"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-ink-500 transition-colors hover:text-ink-900"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="rule">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 py-6 sm:flex-row sm:items-center">
            <p className="text-sm text-ink-500">{t.footer.copyright}</p>
            <div className="flex items-center gap-5">
              <Link
                href={localePath(locale, "/terms")}
                className="text-sm text-ink-500 transition-colors hover:text-ink-900"
              >
                {t.footer.terms}
              </Link>
              <Link
                href={localePath(locale, "/privacy")}
                className="text-sm text-ink-500 transition-colors hover:text-ink-900"
              >
                {t.footer.privacy}
              </Link>
              <LocaleSwitcher tone="light" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
