import { notFound } from "next/navigation";
import { pocForWorkspace, requireOperator } from "@/lib/auth/operator";
import {
  availableTermsLocales,
  DEFAULT_TERMS_TEMPLATES,
  renderTerms,
  termsParagraphs,
} from "@/lib/terms";
import type { Locale } from "@/lib/i18n/locales";
import { resolveLocale } from "@/lib/i18n/dashboard";
import { TermsEditor } from "./terms-editor";
import { TermsPreview } from "./terms-preview";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const ctx = await requireOperator();
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale(rawLocale);
  const poc = pocForWorkspace(ctx, id);
  if (!poc) notFound();

  // Preview every language the gate could actually serve for this PoC.
  const termsLocales = availableTermsLocales(poc);
  const paragraphsByLocale = Object.fromEntries(
    termsLocales.map((l) => [l, termsParagraphs(renderTerms(poc, l))]),
  ) as Partial<Record<Locale, string[]>>;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <TermsEditor
        pocId={poc.id}
        termsMode={poc.termsMode === "custom" ? "custom" : "template"}
        termsCustomText={poc.termsCustomText}
        termsCustomTextJa={poc.termsCustomTextJa}
        termsVersion={poc.termsVersion}
        defaultTemplates={DEFAULT_TERMS_TEMPLATES}
        locale={locale}
      />
      <TermsPreview
        paragraphsByLocale={paragraphsByLocale}
        termsLocales={termsLocales}
        termsVersion={poc.termsVersion}
        locale={locale}
      />
    </div>
  );
}
