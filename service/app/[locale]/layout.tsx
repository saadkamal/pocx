import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Inter, JetBrains_Mono, Noto_Sans_JP } from "next/font/google";
import { isLocale, LOCALES } from "@/lib/i18n/locales";
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
  title: {
    default: "POCX — Protect your proof of concept",
    template: "%s · POCX",
  },
  description:
    "POCX puts an access gate in front of your proof of concept: email OTP login, enforceable Terms of Access with electronic signatures, session control and a full audit trail. Add it to any app in minutes.",
  alternates: {
    languages: { en: "/", ja: "/ja" },
  },
  openGraph: {
    siteName: "POCX",
    type: "website",
    title: "POCX — Protect your proof of concept",
    description:
      "An identity-verified gate, e-signed Terms of Access and a complete audit trail in front of any proof of concept — in one file and three env vars.",
  },
  twitter: {
    card: "summary",
    title: "POCX — Protect your proof of concept",
    description:
      "An identity-verified gate, e-signed Terms of Access and a complete audit trail in front of any proof of concept.",
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
