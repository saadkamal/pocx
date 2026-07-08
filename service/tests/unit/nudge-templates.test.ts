import { describe, expect, it } from "vitest";
import {
  friendlyFirstName,
  renderNudge,
  DEFAULT_NUDGE_TEMPLATES,
  NUDGE_STAGES,
} from "@/lib/mail/nudge-templates";

describe("friendlyFirstName", () => {
  it("takes the first token of a display name", () => {
    expect(friendlyFirstName("Saad Kamal", "x@y.com")).toBe("Saad");
    expect(friendlyFirstName("  jane  ", "x@y.com")).toBe("jane");
  });
  it("derives a name from the email local-part when no name", () => {
    expect(friendlyFirstName(null, "saad@haxo.com.au")).toBe("Saad");
    expect(friendlyFirstName(undefined, "jane.doe@acme.com")).toBe("Jane");
  });
  it("falls back to 'there' for opaque locals", () => {
    expect(friendlyFirstName(null, "info+2@x.com")).toBe("there");
    expect(friendlyFirstName(null, "42@x.com")).toBe("there");
    expect(friendlyFirstName("", "a1b2@x.com")).toBe("there");
  });
});

describe("renderNudge", () => {
  it("substitutes every placeholder and greets by name", () => {
    const out = renderNudge(DEFAULT_NUDGE_TEMPLATES.no_poc, {
      firstName: "Saad",
      workspace: "Acme Pte Ltd",
      signature: "Saad\nFounder, POCX",
    });
    expect(out.body).toMatch(/^Hi Saad,/);
    expect(out.body).toContain("Acme Pte Ltd");
    expect(out.body).toContain("/dashboard/new");
    expect(out.body).toContain("Founder, POCX");
    expect(out.body).not.toMatch(/\{\{\w+\}\}/); // nothing left unresolved
    expect(out.subject.length).toBeGreaterThan(0);
  });

  it("every default stage has a greeting and a signature slot", () => {
    for (const stage of NUDGE_STAGES) {
      const t = DEFAULT_NUDGE_TEMPLATES[stage];
      expect(t.body).toContain("{{first_name}}");
      expect(t.body).toContain("{{signature}}");
      expect(t.subject.trim().length).toBeGreaterThan(0);
    }
  });
});
