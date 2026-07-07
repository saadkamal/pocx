import type { Metadata } from "next";
import { dashboardDict, resolveLocale } from "@/lib/i18n/dashboard";
import NewPocForm from "./new-poc-form";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  return { title: dashboardDict[locale].newPoc.metaTitle };
}

export default async function NewPocPage({ params }: PageProps) {
  const locale = resolveLocale((await params).locale);
  const t = dashboardDict[locale].newPoc;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">
        {t.title}
      </h1>
      <p className="mt-2 mb-6 text-sm text-ink-600">{t.intro}</p>
      <NewPocForm locale={locale} />
    </div>
  );
}
