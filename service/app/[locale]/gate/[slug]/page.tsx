import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, PauseCircle } from "lucide-react";
import {
  checkGateSession,
  gateCookieName,
  hasAcceptedCurrentTerms,
  resolveGatePoc,
} from "@/lib/gate";
import { DEFAULT_LOCALE, isLocale, localePath } from "@/lib/i18n/locales";
import { gateDict } from "@/lib/i18n/gate";
import { buttonCn } from "@/components/ui";
import LoginClient from "./login-client";
import SignOutButton from "./sign-out-button";

/**
 * Hosted gate landing: routes a valid session onward (terms, handoff,
 * or the "you're in" card) and shows the OTP login for everyone else.
 */
export default async function GatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = gateDict[locale].gate;
  const sp = await searchParams;
  const returnTo =
    typeof sp.return_to === "string" && sp.return_to ? sp.return_to : null;

  const poc = resolveGatePoc(slug);
  if (!poc) notFound();

  // Paused PoCs don't take logins or hand anyone off.
  if (poc.status !== "active") {
    return (
      <div className="text-center">
        <PauseCircle
          className="mx-auto h-10 w-10 text-warning"
          aria-hidden="true"
        />
        <h2 className="mt-4 text-lg font-semibold text-ink-900">
          {t.paused.title}
        </h2>
        <p className="mt-2 text-sm text-ink-600">
          {t.paused.body(poc.name)} {t.paused.contact(poc.ownerEntity)}
          {poc.supportEmail ? (
            <>
              {t.paused.emailOpen}
              <a
                href={`mailto:${poc.supportEmail}`}
                className="font-medium underline underline-offset-2"
                style={{ color: poc.brandColor }}
              >
                {poc.supportEmail}
              </a>
              {t.paused.emailClose}
            </>
          ) : null}
          {t.paused.contactEnd}
        </p>
      </div>
    );
  }

  const jar = await cookies();
  const check = checkGateSession(
    jar.get(gateCookieName(poc.slug))?.value,
    poc,
  );

  if (check.ok) {
    const email = check.session.email;

    if (!hasAcceptedCurrentTerms(poc, email)) {
      redirect(
        localePath(
          locale,
          `/gate/${slug}/terms${
            returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : ""
          }`,
        ),
      );
    }

    if (returnTo) {
      redirect(
        `/api/gate/${slug}/continue?return_to=${encodeURIComponent(returnTo)}`,
      );
    }

    return (
      <div className="text-center">
        <CheckCircle2
          className="mx-auto h-10 w-10 text-success"
          aria-hidden="true"
        />
        <h2 className="mt-4 text-lg font-semibold text-ink-900">
          {t.granted.title}
        </h2>
        <p className="mt-2 text-sm text-ink-600">
          {t.granted.signedInBefore}
          <span className="font-medium text-ink-900">{email}</span>
          {t.granted.signedInAfter}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {poc.appUrl ? (
            <a
              href={`/api/gate/${slug}/continue?return_to=${encodeURIComponent(
                poc.appUrl,
              )}`}
              className={`${buttonCn("primary", "lg")} hover:opacity-90`}
              style={{ backgroundColor: poc.brandColor }}
            >
              {t.granted.openApp(poc.name)}
            </a>
          ) : null}
          <SignOutButton slug={slug} locale={locale} />
        </div>
      </div>
    );
  }

  return (
    <LoginClient
      locale={locale}
      slug={slug}
      pocName={poc.name}
      ownerEntity={poc.ownerEntity}
      brandColor={poc.brandColor}
      supportEmail={poc.supportEmail}
      returnTo={returnTo}
    />
  );
}
