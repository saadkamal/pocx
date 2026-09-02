import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import {
  checkGateSession,
  gateCookieName,
  hasAcceptedCurrentTerms,
  resolveGatePoc,
} from "@/lib/gate";
import {
  DEFAULT_LOCALE,
  isLocale,
  localePath,
  type Locale,
} from "@/lib/i18n/locales";
import {
  availableTermsLocales,
  renderTerms,
  resolveTermsLocale,
  termsParagraphs,
} from "@/lib/terms";
import TermsClient from "./terms-client";

/**
 * Terms-of-Access step: requires a valid gate session, shows the exact
 * resolved terms text (the same string that is hashed and PDF'd on
 * acceptance) and collects the e-signature consent.
 *
 * Every available language is rendered server-side and handed to the
 * client, so switching between them is instant and — more importantly —
 * the evaluator can only ever sign a string POCX itself produced.
 */
export default async function TermsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const sp = await searchParams;
  const returnTo =
    typeof sp.return_to === "string" && sp.return_to ? sp.return_to : null;
  const rtQuery = returnTo
    ? `?return_to=${encodeURIComponent(returnTo)}`
    : "";

  const poc = resolveGatePoc(slug);
  if (!poc) notFound();

  const jar = await cookies();
  const check = checkGateSession(
    jar.get(gateCookieName(poc.slug))?.value,
    poc,
  );
  if (!check.ok) redirect(localePath(locale, `/gate/${slug}${rtQuery}`));
  if (hasAcceptedCurrentTerms(poc, check.session.email)) {
    redirect(localePath(locale, `/gate/${slug}${rtQuery}`));
  }

  const localesAvailable = availableTermsLocales(poc);
  const paragraphsByLocale = Object.fromEntries(
    localesAvailable.map((l) => [l, termsParagraphs(renderTerms(poc, l))]),
  ) as Partial<Record<Locale, string[]>>;

  return (
    <TermsClient
      locale={locale}
      slug={slug}
      returnTo={returnTo}
      paragraphsByLocale={paragraphsByLocale}
      termsLocales={localesAvailable}
      initialTermsLocale={resolveTermsLocale(poc, locale)}
      brandColor={poc.brandColor}
      pocName={poc.name}
    />
  );
}
