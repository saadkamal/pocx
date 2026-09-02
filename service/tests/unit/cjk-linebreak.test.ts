import { describe, expect, it } from "vitest";
import {
  BREAK_OPPORTUNITY,
  cjkHyphenation,
} from "@/lib/pdf/cjk-linebreak";

/**
 * The break opportunity has to stay zero-width *and* whitespace-like:
 * textkit only treats a syllable as (hyphen-free) glue when
 * `String.trim()` erases it. If that ever stops holding, Japanese PDFs
 * silently regain mid-sentence hyphens.
 */
describe("break opportunity character", () => {
  it("is whitespace to String.trim(), which is what makes it glue", () => {
    expect(BREAK_OPPORTUNITY.trim()).toBe("");
    expect(BREAK_OPPORTUNITY).toHaveLength(1);
    // U+200B looks like the obvious choice but is *not* trimmable.
    expect("​".trim()).not.toBe("");
  });
});

describe("cjkHyphenation", () => {
  const join = (parts: string[]) => parts.join("");

  it("leaves non-CJK words to the engine's own hyphenator", () => {
    const fallback = (w: string) => [w.slice(0, 3), w.slice(3)];
    expect(cjkHyphenation("internationalization", fallback)).toEqual([
      "int",
      "ernationalization",
    ]);
  });

  it("returns the word untouched when there is no fallback", () => {
    expect(cjkHyphenation("plain")).toEqual(["plain"]);
  });

  it("adds a break opportunity between Japanese characters", () => {
    const parts = cjkHyphenation("秘密保持");
    expect(join(parts)).toBe(
      `秘${BREAK_OPPORTUNITY}密${BREAK_OPPORTUNITY}保${BREAK_OPPORTUNITY}持`,
    );
  });

  it("never loses or reorders a character", () => {
    const text =
      "本PoCは、Acme Pte Ltd（会社登記番号202312345K）が開発しました。";
    expect(join(cjkHyphenation(text)).replaceAll(BREAK_OPPORTUNITY, "")).toBe(
      text,
    );
  });

  it("does not let closing punctuation start a line (行頭禁則)", () => {
    for (const text of ["規約。", "規約、", "「本PoC」", "評価）"]) {
      const parts = cjkHyphenation(text);
      const chars = [...text];
      const closer = chars[chars.length - 1];
      // No opportunity immediately before the closing character.
      expect(parts[parts.length - 2]).not.toBe(BREAK_OPPORTUNITY);
      expect(parts[parts.length - 1]).toBe(closer);
    }
  });

  it("does not let an opening bracket end a line (行末禁則)", () => {
    const parts = cjkHyphenation("以下「本PoC」");
    const openerIndex = parts.indexOf("「");
    expect(parts[openerIndex + 1]).not.toBe(BREAK_OPPORTUNITY);
  });

  it("keeps embedded Latin words whole", () => {
    // Breaks may appear at the CJK/Latin boundaries but never inside "Acme".
    const parts = cjkHyphenation("株式会社Acmeが");
    expect(join(parts)).toContain("Acme");
    expect(join(parts)).not.toContain(`A${BREAK_OPPORTUNITY}c`);
  });

  it("handles surrogate pairs as single characters", () => {
    // U+20BB7 (𠮷) is outside the BMP — naive indexing would split it.
    const parts = cjkHyphenation("𠮷野家の話");
    expect(parts).toContain("𠮷");
    expect(join(parts).replaceAll(BREAK_OPPORTUNITY, "")).toBe("𠮷野家の話");
  });
});
