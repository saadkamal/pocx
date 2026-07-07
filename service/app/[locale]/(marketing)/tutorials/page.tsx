import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/locales";
import { TutorialsContentEn } from "./content-en";
import { TutorialsContentJa } from "./content-ja";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  if (locale === "ja") {
    return {
      title: "チュートリアル",
      description:
        "ステップバイステップのPOCXガイド。Next.jsやExpressアプリの保護、コーディングエージェントへの委任、Terms of Accessのカスタマイズ、評価者のアクセス管理、証拠トレイルの構築。",
    };
  }
  return {
    title: "Tutorials",
    description:
      "Step-by-step POCX guides: protect a Next.js or Express app, hand the setup to a coding agent, customize your Terms of Access, manage evaluator access and build your evidence trail.",
  };
}

export default async function TutorialsPage({ params }: PageProps) {
  const locale = (await params).locale as Locale;
  return locale === "ja" ? <TutorialsContentJa /> : <TutorialsContentEn />;
}
