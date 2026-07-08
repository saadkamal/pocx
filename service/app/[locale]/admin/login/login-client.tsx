"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { buttonCn, Card, inputCn, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Two-step OTP sign-in for the ops console. The request endpoint always
 * answers with a generic ok (it must never confirm who runs the platform),
 * so a successful submit moves straight to the code step and shows the
 * server's message verbatim.
 */

type Step = "email" | "code";

export default function LoginClient() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    try {
      const res = await fetch("/api/admin/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
        error?: string;
      } | null;
      if (res.ok) {
        setNotice(data?.message ?? "If this email runs POCX, a code has been sent.");
        setCooldown(30);
        return true;
      }
      setError(data?.error ?? "Something went wrong. Try again.");
      return false;
    } catch {
      setError("Network error. Try again.");
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
      const res = await fetch("/api/admin/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code }),
      });
      if (res.ok) {
        window.location.assign("/admin");
        return; // keep the button disabled while the browser navigates
      }
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Invalid or expired code.");
      setBusy(false);
    } catch {
      setError("Network error. Try again.");
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-md overflow-hidden rounded-2xl border-t-4 border-t-ink-950 bg-white p-8 shadow-pop">
      <div className="mb-1 flex items-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-ink-500" aria-hidden />
        <p className="eyebrow">POCX · OPS CONSOLE</p>
      </div>
      <h1 className="text-lg font-semibold text-ink-900">Owner sign-in</h1>
      <p className="mt-1 mb-5 text-sm text-ink-500">
        {step === "email"
          ? "Enter the owner email to receive a one-time code."
          : (notice ?? `We sent a code to ${email.trim()}.`)}
      </p>

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-danger/30 bg-danger-subtle px-3 py-2 text-sm text-danger"
        >
          {error}
        </div>
      ) : null}

      {step === "email" ? (
        <form onSubmit={onRequestSubmit} className="space-y-4">
          <div>
            <Label htmlFor="admin-login-email">Owner email</Label>
            <input
              id="admin-login-email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
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
            {busy ? "Sending code…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={onVerifySubmit} className="space-y-4">
          <div>
            <Label htmlFor="admin-login-code">6-digit code</Label>
            <input
              ref={codeRef}
              id="admin-login-code"
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
            {busy ? "Verifying…" : "Sign in"}
          </button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
                setNotice(null);
              }}
              className="text-ink-500 hover:text-ink-900 hover:underline"
            >
              Use a different email
            </button>
            <button
              type="button"
              disabled={busy || cooldown > 0}
              onClick={() => void requestCode()}
              className="font-medium text-brand hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}
