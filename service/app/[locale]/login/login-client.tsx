"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { buttonCn, Card, inputCn, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { localePath, type Locale } from "@/lib/i18n/locales";
import { gateDict } from "@/lib/i18n/gate";

type Step = "email" | "code";

export default function LoginClient({ locale }: { locale: Locale }) {
  const t = gateDict[locale].auth.login;
  const errs = gateDict[locale].errors;

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [offerSignup, setOfferSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  async function requestCode(): Promise<boolean> {
    setBusy(true);
    setError(null);
    setOfferSignup(false);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), mode: "login" }),
      });
      if (res.ok) {
        setCooldown(30);
        return true;
      }
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? errs.generic);
      if (res.status === 404) setOfferSignup(true);
      return false;
    } catch {
      setError(errs.network);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function onRequestSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const sent = await requestCode();
    if (sent) {
      setCode("");
      setStep("code");
    }
  }

  async function onVerifySubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code }),
      });
      if (res.ok) {
        window.location.assign(localePath(locale, "/dashboard"));
        return; // keep the button disabled while the browser navigates
      }
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? errs.generic);
      setBusy(false);
    } catch {
      setError(errs.network);
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-md rounded-2xl bg-white p-8 shadow-pop">
      <h1 className="text-lg font-semibold text-ink-900">{t.title}</h1>
      <p className="mt-1 mb-5 text-sm text-ink-500">
        {step === "email" ? t.emailHint : t.codeSent(email.trim())}
        {step !== "email" ? (
          <span className="mt-1.5 block text-xs leading-relaxed text-ink-400">
            {t.spamHint}
          </span>
        ) : null}
      </p>

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-danger/30 bg-danger-subtle px-3 py-2 text-sm text-danger"
        >
          {error}
          {offerSignup ? (
            <>
              {" "}
              <Link
                href={localePath(locale, "/signup")}
                className="font-semibold underline"
              >
                {t.startFreeArrow}
              </Link>
            </>
          ) : null}
        </div>
      ) : null}

      {step === "email" ? (
        <form onSubmit={onRequestSubmit} className="space-y-4">
          <div>
            <Label htmlFor="login-email">{t.workEmail}</Label>
            <input
              id="login-email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              autoComplete="email"
              autoFocus
              required
              className={inputCn}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className={cn(buttonCn("primary"), "w-full")}
          >
            {busy ? t.sendingCode : t.sendCode}
          </button>
        </form>
      ) : (
        <form onSubmit={onVerifySubmit} className="space-y-4">
          <div>
            <Label htmlFor="login-code">{t.codeLabel}</Label>
            <input
              ref={codeRef}
              id="login-code"
              type="text"
              name="code"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              required
              className={cn(
                inputCn,
                "text-center font-mono text-2xl tracking-[0.4em]",
              )}
            />
          </div>
          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className={cn(buttonCn("primary"), "w-full")}
          >
            {busy ? t.verifying : t.submit}
          </button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
              className="text-ink-500 hover:text-ink-900 hover:underline"
            >
              {t.useDifferentEmail}
            </button>
            <button
              type="button"
              disabled={busy || cooldown > 0}
              onClick={() => void requestCode()}
              className="font-medium text-brand hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cooldown > 0 ? t.resendIn(cooldown) : t.resend}
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}
