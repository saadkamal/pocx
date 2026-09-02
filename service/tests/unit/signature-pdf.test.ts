import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { SignaturePdf } from "@/lib/pdf/signature-pdf";
import { DEFAULT_TERMS_TEMPLATES } from "@/lib/terms";
import { termsParagraphs } from "@/lib/terms";

/**
 * The signed certificate is the artefact a dispute would turn on, so these
 * exercise the real renderer rather than a mock.
 *
 * The Japanese case guards two failure modes that are invisible in a diff:
 * @react-pdf's built-in Helvetica has no CJK glyphs (Japanese would come
 * out blank), and a font whose `name` table was stripped during subsetting
 * makes `renderToBuffer()` hang forever rather than throw.
 */

const base = {
  pocName: "Project Falcon",
  ownerEntity: "Acme Pte Ltd",
  signatureId: "sig_test123",
  email: "hanako@globex.co.jp",
  acceptedAtUtc: "2026-09-02T03:21:00.000Z",
  ip: "203.0.113.9",
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  termsVersion: "1.0",
  termsHashHex: "a".repeat(64),
};

const render = (props: Parameters<typeof SignaturePdf>[0]) =>
  renderToBuffer(SignaturePdf(props));

describe("signature PDF", () => {
  it(
    "renders Japanese terms with the CJK face embedded",
    async () => {
      const buffer = await render({
        ...base,
        signerName: "髙橋 邉子",
        termsParagraphs: termsParagraphs(DEFAULT_TERMS_TEMPLATES.ja),
        termsLocale: "ja",
      });
      const pdf = buffer.toString("latin1");
      expect(pdf.startsWith("%PDF-")).toBe(true);
      // Subset-prefixed font name, e.g. /ABCDEF+NotoSansJP-Regular.
      expect(pdf).toMatch(/\/[A-Z]{6}\+NotoSansJP-Regular/);
      expect(pdf).toMatch(/\/[A-Z]{6}\+NotoSansJP-Bold/);
    },
    60_000,
  );

  it(
    "leaves English certificates on the built-in fonts",
    async () => {
      const buffer = await render({
        ...base,
        signerName: "Ada Lovelace",
        termsParagraphs: termsParagraphs(DEFAULT_TERMS_TEMPLATES.en),
        termsLocale: "en",
      });
      const pdf = buffer.toString("latin1");
      expect(pdf.startsWith("%PDF-")).toBe(true);
      expect(pdf).not.toContain("NotoSansJP");
      expect(pdf).toContain("Helvetica");
    },
    60_000,
  );

  it(
    "treats a missing or unknown locale as English",
    async () => {
      for (const termsLocale of [undefined, "th"]) {
        const buffer = await render({
          ...base,
          termsParagraphs: ["Terms body."],
          termsLocale,
        });
        expect(buffer.toString("latin1")).not.toContain("NotoSansJP");
      }
    },
    60_000,
  );
});
