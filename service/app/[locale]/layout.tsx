import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Inter, JetBrains_Mono, Noto_Sans_JP } from "next/font/google";
import { isLocale, LOCALES } from "@/lib/i18n/locales";
import { pocxOrigin } from "@/lib/utils";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});
// Japanese glyph coverage — sits after Inter in the --font-sans stack, so
// Latin text keeps Inter's metrics and CJK falls through to Noto.
const notoJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-jp",
});

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(pocxOrigin()),
  title: {
    default: "POCX — The digital NDA gate for demos, prototypes & PoCs",
    template: "%s · POCX",
  },
  description:
    "Put a digital NDA on your demo, prototype or proof of concept (PoC): viewers verify their identity and e-sign your terms before the first screen — with a PDF certificate and full audit trail. Built for consultants, dev shops and forward-deployed engineers (FDEs). Open source, or hosted at pocx.dev.",
  keywords: [
    "digital NDA",
    "NDA gate",
    "NDA software",
    "sign NDA online",
    "NDA before demo",
    "click-wrap NDA",
    "demo protection",
    "protect proof of concept",
    "PoC protection",
    "prototype access control",
    "e-signature terms of access",
    "gated demo",
    "forward deployed engineer",
    "FDE prototype protection",
    "client demo protection",
  ],
  applicationName: "POCX",
  authors: [{ name: "Saad Kamal" }],
  creator: "Haxo Pty Ltd",
  publisher: "Haxo Pty Ltd",
  alternates: {
    languages: { en: "/", ja: "/ja" },
  },
  openGraph: {
    siteName: "POCX",
    type: "website",
    locale: "en_US",
    alternateLocale: "ja_JP",
    title: "POCX — The digital NDA gate for demos, prototypes & PoCs",
    description:
      "Viewers verify their identity and e-sign your terms before the first screen of your demo — with a PDF certificate and full audit trail. Open source, or hosted at pocx.dev.",
    // Explicit: the generated /opengraph-image route lives at the app
    // root (outside the [locale] segment), so the file convention does
    // not auto-inject the tag for localized pages.
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "POCX — Show the work. Keep the idea.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "POCX — The digital NDA gate for demos, prototypes & PoCs",
    description:
      "Show the work. Keep the idea. An NDA-grade e-signature gate in front of any demo, prototype or PoC — open source, or hosted at pocx.dev.",
    images: ["/opengraph-image"],
  },
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale}>
      <body
        className={`${inter.variable} ${jetbrains.variable} ${notoJp.variable} bg-paper text-ink-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
