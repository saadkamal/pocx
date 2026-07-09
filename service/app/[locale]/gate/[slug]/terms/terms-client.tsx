"use client";

import { useState } from "react";
import { Loader2, ScrollText } from "lucide-react";
import { buttonCn } from "@/components/ui";
import { localePath, type Locale } from "@/lib/i18n/locales";
import { gateDict } from "@/lib/i18n/gate";

/**
 * Terms-of-Access consent: scrollable terms, explicit e-signature
 * acknowledgement, then POST accept-terms and continue onward.
 * (The terms text itself is the operator's resolved legal text — it is
 * rendered verbatim, whatever language the operator wrote it in.)
 */
export default function TermsClient({
  locale,
  slug,
  returnTo,
  paragraphs,
  brandColor,
  pocName,
}: {
  locale: Locale;
  slug: string;
  returnTo: string | null;
  paragraphs: string[];
  brandColor: string;
  pocName: string;
}) {
  const t = gateDict[locale].gate.terms;
  const errs = gateDict[locale].errors;

  const [agreed, setAgreed] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameOk = name.trim().length >= 2;

  const rtQuery = returnTo
    ? `?return_to=${encodeURIComponent(returnTo)}`
    : "";

  async function acceptTerms() {
    if (!agreed || !nameOk || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gate/${slug}/accept-terms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        window.location.assign(
          returnTo
            ? `/api/gate/${slug}/continue?return_to=${encodeURIComponent(returnTo)}`
            : localePath(locale, `/gate/${slug}`),
        );
        return; // stay in the loading state while we navigate
      }
      if (res.status === 401) {
        // Session expired mid-read — back to login (return_to preserved).
        window.location.assign(localePath(locale, `/gate/${slug}${rtQuery}`));
        return;
      }
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? errs.generic);
      setLoading(false);
    } catch {
      setError(errs.network);
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-start gap-3">
        <ScrollText
          className="mt-0.5 h-5 w-5 shrink-0"
          style={{ color: brandColor }}
          aria-hidden="true"
        />
        <div>
          <h2 className="text-lg font-semibold text-ink-900">{t.title}</h2>
          <p className="mt-0.5 text-sm text-ink-600">{t.intro(pocName)}</p>
        </div>
      </div>

      <div className="mt-4 max-h-72 overflow-y-auto rounded-lg border border-ink-200 bg-ink-50 p-4">
        {paragraphs.map((paragraph, i) =>
          i === 0 ? (
            <p key={i} className="text-sm font-semibold text-ink-900">
              {paragraph}
            </p>
          ) : (
            <p
              key={i}
              className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink-700"
            >
              {paragraph}
            </p>
          ),
        )}
      </div>

      {/* Typed-name signature — the visible, human part of the record. */}
      <div className="mt-4">
        <label
          htmlFor="signer-name"
          className="text-sm font-medium text-ink-900"
        >
          {t.nameLabel}
        </label>
        <input
          id="signer-name"
          type="text"
          autoComplete="name"
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          placeholder={t.namePlaceholder}
          className="mt-1.5 w-full rounded-lg border border-ink-300 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": brandColor } as React.CSSProperties}
        />
        <div className="mt-2 flex min-h-12 items-center justify-between gap-3 rounded-lg border border-dashed border-ink-300 bg-ink-50 px-4 py-2">
          <span
            className="truncate text-xl text-ink-900 italic"
            style={{ fontFamily: "'Snell Roundhand', 'Segoe Script', 'Brush Script MT', cursive" }}
            aria-hidden="true"
          >
            {name.trim() || "\u00A0"}
          </span>
          <span className="shrink-0 font-mono text-[10px] tracking-[0.12em] text-ink-400 uppercase">
            {t.signatureLabel}
          </span>
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          disabled={loading}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300"
          style={{ accentColor: brandColor }}
        />
        <span className="text-sm text-ink-600">{t.consent}</span>
      </label>

      {error ? (
        <p className="mt-3 rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={acceptTerms}
        disabled={!agreed || !nameOk || loading}
        className={`${buttonCn("primary", "lg")} mt-5 w-full hover:opacity-90`}
        style={{ backgroundColor: brandColor }}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t.recording}
          </>
        ) : (
          t.agree
        )}
      </button>
    </div>
  );
}
