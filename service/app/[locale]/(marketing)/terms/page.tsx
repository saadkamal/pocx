import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/locales";
import { TermsContentEn } from "./content-en";
import { TermsContentJa } from "./content-ja";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  if (locale === "ja") {
    return {
      title: "利用規約",
      description:
        "pocx.devのホスト型POCXサービスの利用規約。運営: Haxo Pty Ltd。",
    };
  }
  return {
    title: "Terms of Service",
    description:
      "Terms of Service for the hosted POCX service at pocx.dev, operated by Haxo Pty Ltd.",
  };
}

export default async function TermsPage({ params }: PageProps) {
  const locale = (await params).locale as Locale;
  return locale === "ja" ? <TermsContentJa /> : <TermsContentEn />;
}
