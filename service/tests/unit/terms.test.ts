import { describe, expect, it } from "vitest";
import {
  availableTermsLocales,
  customTermsFor,
  DEFAULT_TERMS_TEMPLATE,
  DEFAULT_TERMS_TEMPLATES,
  renderTerms,
  resolveTermsLocale,
  termsHash,
  termsParagraphs,
} from "@/lib/terms";
import type { PocRow } from "@/lib/db/schema";

function fakePoc(overrides: Partial<PocRow> = {}): PocRow {
  return {
    id: "poc_x",
    workspaceId: "ws_x",
    slug: "project-falcon",
    name: "Project Falcon",
    ownerEntity: "Acme Pte Ltd",
    ownerRegNo: "201912345K",
    clientEntity: "Globex Corporation",
    purpose: null,
    supportEmail: "poc@acme.com",
    brandColor: "#7C5CFF",
    logoUrl: null,
    appUrl: "https://falcon.acme.dev",
    callbackPath: "/api/pocx/callback",
    publicKey: "pocx_pk_test",
    secret: "pocx_sk_test",
    termsMode: "template",
    termsCustomText: null,
    termsCustomTextJa: null,
    termsVersion: "1.0",
    sessionTtlHours: 24,
    idleTimeoutHours: 3,
    otpTtlMinutes: 10,
    status: "active",
    createdAt: new Date(),
    archivedAt: null,
    ...overrides,
  };
}

describe("terms templating", () => {
  it("substitutes every placeholder for a fully-specified PoC", () => {
    const text = renderTerms(fakePoc());
    expect(text).toContain("Project Falcon — Proof of Concept: Terms of Access (Version 1.0)");
    expect(text).toContain("Acme Pte Ltd");
    expect(text).toContain("Company Registration No. 201912345K");
    expect(text).toContain("and Globex Corporation");
    expect(text).toContain("at poc@acme.com");
    // Default purpose falls back to the engagement wording.
    expect(text).toContain(
      "evaluating a potential engagement with Acme Pte Ltd",
    );
    expect(text).not.toMatch(/\{\{[A-Z_]+\}\}/);
  });

  it("drops optional clauses gracefully", () => {
    const text = renderTerms(
      fakePoc({ ownerRegNo: null, clientEntity: null, supportEmail: null }),
    );
    expect(text).not.toContain("Company Registration No.");
    expect(text).toContain("and your organisation");
    expect(text).not.toMatch(/\{\{[A-Z_]+\}\}/);
  });

  it("uses custom text when termsMode=custom, still substituting variables", () => {
    const text = renderTerms(
      fakePoc({
        termsMode: "custom",
        termsCustomText:
          "My terms for {{POC_NAME}} v{{TERMS_VERSION}} by {{OWNER_ENTITY}}.",
      }),
    );
    expect(text).toBe("My terms for Project Falcon v1.0 by Acme Pte Ltd.");
  });

  it("falls back to the template when custom text is blank", () => {
    const text = renderTerms(fakePoc({ termsMode: "custom", termsCustomText: "  " }));
    expect(text).toContain("Proof of Concept: Terms of Access");
  });

  it("hash is stable for identical text and differs on any change", () => {
    const a = renderTerms(fakePoc());
    const b = renderTerms(fakePoc());
    const c = renderTerms(fakePoc({ termsVersion: "1.1" }));
    expect(termsHash(a)).toBe(termsHash(b));
    expect(termsHash(a)).not.toBe(termsHash(c));
    expect(termsHash(a)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("splits into paragraphs", () => {
    const paras = termsParagraphs(DEFAULT_TERMS_TEMPLATE);
    expect(paras.length).toBeGreaterThan(5);
    expect(paras[0]).toContain("Terms of Access");
  });
});

describe("terms in Japanese", () => {
  it("renders the Japanese template with every placeholder filled", () => {
    const text = renderTerms(fakePoc(), "ja");
    expect(text).toContain(
      "Project Falcon — 概念実証（PoC）アクセス利用規約（バージョン1.0）",
    );
    expect(text).toContain("会社登記番号：201912345K");
    expect(text).toContain("およびGlobex Corporation");
    expect(text).toContain("（poc@acme.com）");
    // Default purpose is localized; proper nouns are not translated.
    expect(text).toContain("Acme Pte Ltdとの協業可能性の評価");
    expect(text).not.toMatch(/\{\{[A-Z_]+\}\}/);
    // No English boilerplate leaked through.
    expect(text).not.toContain("Terms of Access");
    expect(text).not.toContain("Company Registration No.");
  });

  it("drops optional clauses gracefully in Japanese", () => {
    const text = renderTerms(
      fakePoc({ ownerRegNo: null, clientEntity: null, supportEmail: null }),
      "ja",
    );
    expect(text).toContain("（以下「Acme Pte」といいます。）");
    expect(text).toContain("および貴組織");
    expect(text).not.toContain("会社登記番号");
    expect(text).not.toMatch(/\{\{[A-Z_]+\}\}/);
  });

  it("uses an operator-written purpose verbatim in both languages", () => {
    const poc = fakePoc({ purpose: "evaluating the claims triage prototype" });
    expect(renderTerms(poc, "en")).toContain(
      "evaluating the claims triage prototype",
    );
    expect(renderTerms(poc, "ja")).toContain(
      "evaluating the claims triage prototypeという目的に限り",
    );
  });

  it("English and Japanese hash differently — the language is evidence", () => {
    const poc = fakePoc();
    expect(termsHash(renderTerms(poc, "en"))).not.toBe(
      termsHash(renderTerms(poc, "ja")),
    );
  });

  it("defaults to English when no locale is given", () => {
    expect(renderTerms(fakePoc())).toBe(renderTerms(fakePoc(), "en"));
  });

  it("ships a Japanese standard template with the same paragraph count", () => {
    expect(termsParagraphs(DEFAULT_TERMS_TEMPLATES.ja).length).toBe(
      termsParagraphs(DEFAULT_TERMS_TEMPLATE).length,
    );
  });
});

describe("terms language resolution", () => {
  it("offers both languages for template-mode PoCs", () => {
    const poc = fakePoc();
    expect(availableTermsLocales(poc)).toEqual(["en", "ja"]);
    expect(resolveTermsLocale(poc, "ja")).toBe("ja");
  });

  it("falls back to English for custom terms with no Japanese version", () => {
    const poc = fakePoc({
      termsMode: "custom",
      termsCustomText: "My English-only terms for {{POC_NAME}}.",
    });
    expect(availableTermsLocales(poc)).toEqual(["en"]);
    expect(resolveTermsLocale(poc, "ja")).toBe("en");
    // Crucially: it serves the operator's English text, not the JA template.
    expect(renderTerms(poc, "ja")).toBe(
      "My English-only terms for Project Falcon.",
    );
  });

  it("uses the operator's Japanese custom text when they wrote one", () => {
    const poc = fakePoc({
      termsMode: "custom",
      termsCustomText: "English terms for {{POC_NAME}}.",
      termsCustomTextJa: "{{POC_NAME}}の日本語規約です。",
    });
    expect(availableTermsLocales(poc)).toEqual(["en", "ja"]);
    expect(resolveTermsLocale(poc, "ja")).toBe("ja");
    expect(renderTerms(poc, "ja")).toBe("Project Falconの日本語規約です。");
    expect(renderTerms(poc, "en")).toBe("English terms for Project Falcon.");
  });

  it("treats whitespace-only Japanese custom text as absent", () => {
    const poc = fakePoc({
      termsMode: "custom",
      termsCustomText: "English terms.",
      termsCustomTextJa: "   \n  ",
    });
    expect(customTermsFor(poc, "ja")).toBeNull();
    expect(availableTermsLocales(poc)).toEqual(["en"]);
    expect(renderTerms(poc, "ja")).toBe("English terms.");
  });

  it("ignores stale Japanese custom text once the PoC is back on template", () => {
    const poc = fakePoc({
      termsMode: "template",
      termsCustomTextJa: "leftover draft",
    });
    expect(renderTerms(poc, "ja")).toContain("概念実証（PoC）アクセス利用規約");
  });
});
