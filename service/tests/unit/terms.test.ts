import { describe, expect, it } from "vitest";
import {
  DEFAULT_TERMS_TEMPLATE,
  renderTerms,
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
