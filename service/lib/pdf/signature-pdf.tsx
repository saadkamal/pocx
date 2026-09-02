import { join } from "node:path";
import {
  Document,
  Font,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/locales";
import { LOCALE_LABELS, pdfDict } from "@/lib/i18n/pdf";
import { japaneseTextProps } from "./cjk-linebreak";

/**
 * Signed Terms-of-Access certificate. Rendered server-side at acceptance
 * time, stored beside the DB and emailed to the signer. The document
 * reproduces the exact terms text plus the evidentiary metadata (who,
 * when, from where, hash of what was shown) in the language that was
 * signed.
 *
 * Japanese needs things the built-ins do not give us — an embedded CJK
 * face and space-free line breaking. See `assets/fonts/README.md` and
 * `./cjk-linebreak`.
 */

export type SignaturePdfProps = {
  pocName: string;
  ownerEntity: string;
  signatureId: string;
  email: string;
  signerName?: string | null;
  acceptedAtUtc: string;
  ip: string;
  userAgent: string;
  termsVersion: string;
  termsHashHex: string;
  termsParagraphs: string[];
  /** Language of `termsParagraphs` — drives fonts and chrome. */
  termsLocale?: string;
};

const JP_FAMILY = "NotoSansJP";
let jpFontsRegistered = false;

/**
 * Register the bundled CJK faces. Lazy and idempotent: an English-only
 * deployment never touches the 6 MB of font files, and @react-pdf's font
 * store is global so registering twice is pointless.
 */
function ensureJapaneseFonts() {
  if (jpFontsRegistered) return;
  const dir = join(process.cwd(), "assets", "fonts");
  Font.register({
    family: JP_FAMILY,
    fonts: [
      { src: join(dir, "NotoSansJP-Regular-subset.otf"), fontWeight: 400 },
      { src: join(dir, "NotoSansJP-Bold-subset.otf"), fontWeight: 700 },
    ],
  });
  jpFontsRegistered = true;
}

/**
 * Latin comes from Helvetica for English documents (built in, nothing to
 * embed). Japanese documents run entirely on Noto Sans JP: `fontWeight`
 * selects a registered face but does *not* reach the built-in Helvetica
 * family, so mixing the two would silently lose every bold heading.
 */
function makeStyles(ja: boolean) {
  const body = ja ? JP_FAMILY : "Helvetica";
  const bold = ja
    ? { fontFamily: JP_FAMILY, fontWeight: 700 as const }
    : { fontFamily: "Helvetica-Bold" };

  return StyleSheet.create({
    page: {
      paddingTop: 48,
      paddingBottom: 56,
      paddingHorizontal: 52,
      fontSize: 9.5,
      fontFamily: body,
      color: "#16161f",
      lineHeight: 1.5,
    },
    brand: {
      fontSize: 10,
      letterSpacing: ja ? 1 : 2,
      color: "#D4551A",
      ...bold,
      marginBottom: 2,
    },
    title: { fontSize: 16, ...bold, marginBottom: 2 },
    subtitle: { fontSize: 10, color: "#4b4b58", marginBottom: 18 },
    h2: { fontSize: 11, ...bold, marginTop: 16, marginBottom: 6 },
    para: { marginBottom: 7 },
    metaBox: {
      borderWidth: 1,
      borderColor: "#c9c9d2",
      borderRadius: 6,
      padding: 12,
      marginTop: 6,
      backgroundColor: "#f8f8fa",
    },
    metaRow: { flexDirection: "row", marginBottom: 3 },
    metaKey: { width: ja ? 150 : 130, color: "#4b4b58" },
    metaVal: { flex: 1, ...bold },
    // The hash is ASCII hex, so Courier stays safe in both languages.
    mono: { fontFamily: "Courier", fontSize: 8, fontWeight: 400 },
    // The user agent is long and unimportant — undo metaVal's bold.
    plain: { fontFamily: body, fontWeight: 400 },
    footer: {
      position: "absolute",
      bottom: 28,
      left: 52,
      right: 52,
      fontSize: 8,
      color: "#6e6e7a",
      textAlign: "center",
    },
  });
}

export function SignaturePdf(props: SignaturePdfProps) {
  const locale: Locale = isLocale(props.termsLocale)
    ? props.termsLocale
    : DEFAULT_LOCALE;
  const ja = locale === "ja";
  if (ja) ensureJapaneseFonts();

  const t = pdfDict[locale];
  const styles = makeStyles(ja);
  const wrap = ja ? japaneseTextProps : {};

  type Row = { key: string; value: string; variant?: "plain" | "mono" };
  const meta: Row[] = [
    { key: t.signatureId, value: props.signatureId },
    ...(props.signerName
      ? [{ key: t.signedByName, value: props.signerName }]
      : []),
    { key: t.signedByEmail, value: props.email },
    { key: t.acceptedAt, value: props.acceptedAtUtc },
    { key: t.ip, value: props.ip },
    { key: t.language, value: LOCALE_LABELS[locale] },
    { key: t.browser, value: props.userAgent, variant: "plain" },
    { key: t.hash, value: props.termsHashHex, variant: "mono" },
  ];

  return (
    <Document
      title={t.docTitle(props.pocName)}
      author={t.docAuthor(props.ownerEntity)}
      language={locale}
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>{t.brand}</Text>
        <Text {...wrap} style={styles.title}>
          {t.title(props.pocName)}
        </Text>
        <Text {...wrap} style={styles.subtitle}>
          {t.subtitle({
            version: props.termsVersion,
            ownerEntity: props.ownerEntity,
          })}
        </Text>

        <Text style={styles.h2}>{t.recordHeading}</Text>
        <View style={styles.metaBox}>
          {meta.map((row) => (
            <View key={row.key} style={styles.metaRow}>
              <Text style={styles.metaKey}>{row.key}</Text>
              <Text
                style={
                  row.variant === "mono"
                    ? [styles.metaVal, styles.mono]
                    : row.variant === "plain"
                      ? [styles.metaVal, styles.plain]
                      : styles.metaVal
                }
              >
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.h2}>{t.termsHeading}</Text>
        {props.termsParagraphs.map((p, i) => (
          <Text key={i} {...wrap} style={styles.para}>
            {p}
          </Text>
        ))}

        <Text {...wrap} style={styles.footer} fixed>
          {t.footer}
        </Text>
      </Page>
    </Document>
  );
}
