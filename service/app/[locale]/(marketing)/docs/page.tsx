import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/locales";
import { DocsContentEn } from "./content-en";
import { DocsContentJa } from "./content-ja";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  if (locale === "ja") {
    return {
      title: "ドキュメント",
      description:
        "1ファイルと3つの環境変数で、どんなアプリにも5分でPOCXを追加。クイックスタート、設定リファレンス、規約のカスタマイズ、セキュリティモデル。",
    };
  }
  return {
    title: "Docs",
    description:
      "Add POCX to any app in five minutes: one file, three env vars. Quickstart, configuration reference, terms customization and the security model.",
  };
}

export default async function DocsPage({ params }: PageProps) {
  const locale = (await params).locale as Locale;
  return locale === "ja" ? <DocsContentJa /> : <DocsContentEn />;
}
