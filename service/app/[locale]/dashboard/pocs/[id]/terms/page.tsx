import { notFound } from "next/navigation";
import { pocForWorkspace, requireOperator } from "@/lib/auth/operator";
import {
  DEFAULT_TERMS_TEMPLATE,
  renderTerms,
  termsParagraphs,
} from "@/lib/terms";
import { Badge, Card, CardTitle } from "@/components/ui";
import { dashboardDict, resolveLocale } from "@/lib/i18n/dashboard";
import { TermsEditor } from "./terms-editor";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const ctx = await requireOperator();
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale(rawLocale);
  const t = dashboardDict[locale].poc.terms;
  const poc = pocForWorkspace(ctx, id);
  if (!poc) notFound();

  const paragraphs = termsParagraphs(renderTerms(poc));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <TermsEditor
        pocId={poc.id}
        termsMode={poc.termsMode === "custom" ? "custom" : "template"}
        termsCustomText={poc.termsCustomText}
        termsVersion={poc.termsVersion}
        defaultTemplate={DEFAULT_TERMS_TEMPLATE}
        locale={locale}
      />

      <Card className="self-start">
        <div className="mb-3 flex items-center justify-between gap-3">
          <CardTitle className="mb-0">{t.previewTitle}</CardTitle>
          <Badge tone="brand">v{poc.termsVersion}</Badge>
        </div>
        <p className="mb-4 text-sm text-ink-500">{t.previewDesc}</p>
        <div className="max-h-96 space-y-3 overflow-y-auto rounded-lg border border-ink-200 bg-ink-50 p-4">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? "text-sm font-semibold text-ink-900"
                  : "text-sm leading-relaxed text-ink-700"
              }
            >
              {p}
            </p>
          ))}
        </div>
      </Card>
    </div>
  );
}
