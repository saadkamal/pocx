import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/locales";
import { PrivacyContentEn } from "./content-en";
import { PrivacyContentJa } from "./content-ja";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  if (locale === "ja") {
    return {
      title: "プライバシーポリシー",
      description:
        "ホスト型POCXサービス（pocx.dev、運営: Haxo Pty Ltd）が収集する情報とその理由。最小限の収集、販売なし、広告トラッカーなし。",
    };
  }
  return {
    title: "Privacy Policy",
    description:
      "What the hosted POCX service at pocx.dev (operated by Haxo Pty Ltd) collects and why: the minimum an access-control product needs, never sold, no ad trackers.",
  };
}

export default async function PrivacyPage({ params }: PageProps) {
  const locale = (await params).locale as Locale;
  return locale === "ja" ? <PrivacyContentJa /> : <PrivacyContentEn />;
}
