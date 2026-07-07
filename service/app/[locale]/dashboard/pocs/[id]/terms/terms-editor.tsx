"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateTermsAction,
  type ActionResult,
} from "@/app/[locale]/dashboard/actions";
import { Card, CardTitle, Label, Mono, buttonCn, inputCn } from "@/components/ui";
import type { Locale } from "@/lib/i18n/locales";
import { dashboardDict } from "@/lib/i18n/dashboard";

const PLACEHOLDERS = [
  "{{POC_NAME}}",
  "{{OWNER_ENTITY}}",
  "{{OWNER_REG_NO_CLAUSE}}",
  "{{CLIENT_ENTITY_CLAUSE}}",
  "{{PURPOSE}}",
  "{{SUPPORT_EMAIL_CLAUSE}}",
  "{{TERMS_VERSION}}",
];

export function TermsEditor({
  pocId,
  termsMode,
  termsCustomText,
  termsVersion,
  defaultTemplate,
  locale,
}: {
  pocId: string;
  termsMode: "template" | "custom";
  termsCustomText: string | null;
  termsVersion: string;
  defaultTemplate: string;
  locale: Locale;
}) {
  const router = useRouter();
  const t = dashboardDict[locale].poc.terms;
  const [mode, setMode] = useState<"template" | "custom">(termsMode);
  // Start from the saved custom text, else the standard template.
  const [customText, setCustomText] = useState(
    termsCustomText?.trim() ? termsCustomText : defaultTemplate,
  );
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(fd: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await updateTermsAction(pocId, fd);
      setResult(res);
      if ("ok" in res) router.refresh();
    });
  }

  return (
    <Card>
      <CardTitle>{t.editorTitle}</CardTitle>
      <p className="mb-5 text-sm text-ink-500">{t.editorDesc}</p>

      <form action={submit} className="space-y-5">
        <fieldset className="space-y-3">
          <legend className="mb-1.5 block text-sm font-medium text-ink-700">
            {t.textLegend}
          </legend>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-ink-200 p-3 has-checked:border-ink-900 has-checked:bg-ink-50">
            <input
              type="radio"
              name="termsMode"
              value="template"
              checked={mode === "template"}
              onChange={() => setMode("template")}
              className="mt-1 accent-ink-900"
            />
            <span>
              <span className="block text-sm font-semibold text-ink-900">
                {t.templateOption}{" "}
                <span className="font-normal text-ink-500">
                  {t.templateRecommended}
                </span>
              </span>
              <span className="block text-sm text-ink-500">
                {t.templateDesc}
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-ink-200 p-3 has-checked:border-ink-900 has-checked:bg-ink-50">
            <input
              type="radio"
              name="termsMode"
              value="custom"
              checked={mode === "custom"}
              onChange={() => setMode("custom")}
              className="mt-1 accent-ink-900"
            />
            <span>
              <span className="block text-sm font-semibold text-ink-900">
                {t.customOption}
              </span>
              <span className="block text-sm text-ink-500">
                {t.customDesc}
              </span>
            </span>
          </label>

          {mode === "custom" ? (
            <div>
              <textarea
                name="termsCustomText"
                rows={18}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className={`${inputCn} font-mono text-xs leading-relaxed`}
              />
              <p className="mt-2 text-xs text-ink-500">
                {t.placeholdersNote}{" "}
                {PLACEHOLDERS.map((p, i) => (
                  <span key={p}>
                    {i > 0 ? " " : null}
                    <Mono>{p}</Mono>
                  </span>
                ))}
              </p>
            </div>
          ) : (
            // Keep the drafted custom text through a template save.
            <input type="hidden" name="termsCustomText" value={customText} />
          )}
        </fieldset>

        <div>
          <Label htmlFor="terms-version">{t.versionLabel}</Label>
          <input
            id="terms-version"
            name="termsVersion"
            type="text"
            required
            defaultValue={termsVersion}
            className={`${inputCn} max-w-40`}
          />
          <p className="mt-2 text-xs text-warning">{t.versionWarning}</p>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            name="revokeSessions"
            value="yes"
            className="accent-ink-900"
          />
          {t.revokeCheckbox}
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className={buttonCn("primary", "md")}
          >
            {pending ? t.saving : t.save}
          </button>
          {result && "error" in result ? (
            <p className="text-sm font-medium text-danger">{result.error}</p>
          ) : null}
          {result && "ok" in result && result.message ? (
            <p className="text-sm font-medium text-success">
              {result.message}
            </p>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
