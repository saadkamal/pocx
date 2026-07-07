import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/locales";
import { FaqContentEn } from "./content-en";
import { FaqContentJa } from "./content-ja";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  if (locale === "ja") {
    return {
      title: "よくある質問",
      description:
        "POCXについて寄せられる質問のすべて。評価者の体験、セキュリティとプライバシー、電子署名の証拠、規約のカスタマイズ、プランと課金。",
    };
  }
  return {
    title: "FAQ",
    description:
      "Everything people ask about POCX: evaluator experience, security and privacy, e-signature evidence, terms customization, plans and billing.",
  };
}

export default async function FaqPage({ params }: PageProps) {
  const locale = (await params).locale as Locale;
  return locale === "ja" ? <FaqContentJa /> : <FaqContentEn />;
}
