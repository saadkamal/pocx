"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, Mail, UserX } from "lucide-react";
import { buttonCn, inputCn, Label } from "@/components/ui";
import { localePath, type Locale } from "@/lib/i18n/locales";
import { gateDict } from "@/lib/i18n/gate";

/**
 * Two-step OTP login for the hosted gate.
 * Step 1: email → POST request-otp. Step 2: 6-digit code → POST verify-otp.
 * On success the server sets the gate cookie; we navigate onward.
 * Server error messages arrive already localized (the gate API resolves
 * the locale from the cookie/header) and are shown verbatim.
 */
export default function LoginClient({
  locale,
  slug,
  pocName,
  ownerEntity,
  brandColor,
  supportEmail,
  returnTo,
}: {
  locale: Locale;
  slug: string;
  pocName: string;
  ownerEntity: string;
  brandColor: string;
  supportEmail: string | null;
  returnTo: string | null;
}) {
  const t = gateDict[locale].gate.login;
  const errs = gateDict[locale].errors;

  const [step, setStep] = useState<"email" | "code" | "denied">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  async function requestCode(isResend: boolean) {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/gate/${slug}/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        allowed?: boolean;
        error?: string;
      } | null;

      if (res.ok) {
        setCooldown(30);
        setCode("");
        setStep("code");
        if (isResend) setNotice(t.resendNotice);
        return;
      }
      if (res.status === 403 && data?.allowed === false) {
        setStep("denied");
        return;
      }
      if (res.status === 429) {
        setError(data?.error ?? errs.tooManyRequests);
        return;
      }
      setError(data?.error ?? errs.generic);
    } catch {
      setError(errs.network);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || loading) return;
    await requestCode(false);
  }

  async function handleCodeSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/gate/${slug}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        needsTerms?: boolean;
        error?: string;
      } | null;

      if (res.ok && data?.ok) {
        const rtQuery = returnTo
          ? `?return_to=${encodeURIComponent(returnTo)}`
          : "";
        window.location.assign(
          data.needsTerms
            ? localePath(locale, `/gate/${slug}/terms${rtQuery}`)
            : returnTo
              ? `/api/gate/${slug}/continue?return_to=${encodeURIComponent(returnTo)}`
              : localePath(locale, `/gate/${slug}`),
        );
        return; // keep the button in its loading state while we navigate
      }
      setError(data?.error ?? errs.generic);
      setLoading(false);
    } catch {
      setError(errs.network);
      setLoading(false);
    }
  }

  function backToEmail() {
    setStep("email");
    setCode("");
    setError(null);
    setNotice(null);
  }

  if (step === "denied") {
    return (
      <div className="text-center">
        <UserX className="mx-auto h-10 w-10 text-ink-400" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold text-ink-900">
          {t.deniedTitle}
        </h2>
        <p className="mt-3 rounded-lg bg-warning-subtle px-3 py-2 text-left text-sm text-ink-700">
          <span className="font-medium text-ink-900">{email}</span>
          {t.deniedNotOnList(pocName)}
          {t.deniedAsk(ownerEntity)}
          {supportEmail ? (
            <>
              {t.deniedEmailOpen}
              <a
                href={`mailto:${supportEmail}`}
                className="font-medium underline underline-offset-2"
                style={{ color: brandColor }}
              >
                {supportEmail}
              </a>
              {t.deniedEmailClose}
            </>
          ) : null}
          {t.deniedEnd}
        </p>
        <button
          type="button"
          onClick={backToEmail}
          className={`${buttonCn("secondary", "md")} mt-6 w-full`}
        >
          {t.deniedTryDifferent}
        </button>
      </div>
    );
  }

  if (step === "code") {
    return (
      <form onSubmit={handleCodeSubmit} noValidate>
        <h2 className="text-lg font-semibold text-ink-900">{t.codeTitle}</h2>
        <p className="mt-1 text-sm text-ink-600">
          {t.codeSentBefore}
          <span className="font-medium text-ink-900">{email}</span>
          {t.codeSentAfter}
        </p>

        <div className="mt-5">
          <Label htmlFor="gate-code">{t.codeLabel}</Label>
          <input
            ref={codeRef}
            id="gate-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className={`${inputCn} text-center font-mono text-lg tracking-[0.5em]`}
            disabled={loading}
          />
        </div>

        {notice ? (
          <p className="mt-3 rounded-lg bg-success-subtle px-3 py-2 text-sm text-success">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className={`${buttonCn("primary", "lg")} mt-5 w-full hover:opacity-90`}
          style={{ backgroundColor: brandColor }}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.verifying}
            </>
          ) : (
            t.verify
          )}
        </button>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={backToEmail}
            className="inline-flex items-center gap-1 text-ink-500 hover:text-ink-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t.useDifferentEmail}
          </button>
          <button
            type="button"
            onClick={() => requestCode(true)}
            disabled={loading || cooldown > 0}
            className="font-medium disabled:cursor-not-allowed disabled:opacity-50"
            style={{ color: brandColor }}
          >
            {cooldown > 0 ? t.resendCooldown(cooldown) : t.resend}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleEmailSubmit} noValidate>
      <h2 className="text-lg font-semibold text-ink-900">{t.emailTitle}</h2>
      <p className="mt-1 text-sm text-ink-600">{t.emailIntro}</p>

      <div className="mt-5">
        <Label htmlFor="gate-email">{t.emailLabel}</Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            id="gate-email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputCn} pl-9`}
            disabled={loading}
          />
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || !email.trim()}
        className={`${buttonCn("primary", "lg")} mt-5 w-full hover:opacity-90`}
        style={{ backgroundColor: brandColor }}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t.sendingCode}
          </>
        ) : (
          t.sendCode
        )}
      </button>
    </form>
  );
}
