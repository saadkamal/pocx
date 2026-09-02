/**
 * Japanese line breaking for @react-pdf.
 *
 * @react-pdf splits text into words on ASCII spaces alone, so a Japanese
 * paragraph arrives at the line breaker as one enormous unbreakable word.
 * Left alone it overflows the page; handed to the Latin hyphenation engine
 * it gets chopped with a hyphen mid-sentence (規約-本文). Neither belongs on
 * a legal document.
 *
 * The fix is to hand textkit break opportunities as U+FEFF. That character
 * is zero-width, and `String.prototype.trim()` counts it as whitespace, so
 * textkit classifies it as *glue* — and glue breaks, unlike hyphenation
 * penalties, draw no hyphen (see @react-pdf/textkit `getNodes` and
 * `breakLines`). Pair it with a large `hyphenationPenalty` so the breaker
 * always prefers the invisible glue break over a hyphenated one.
 *
 * Opportunities are withheld around kinsoku (禁則) characters so a line
 * never starts with closing punctuation or ends with an opening bracket.
 */

/** Zero-width, and whitespace as far as String.trim() is concerned. */
export const BREAK_OPPORTUNITY = "﻿";

/** Kana, CJK ideographs, CJK punctuation and fullwidth forms. */
export const CJK_PATTERN =
  /[　-ヿ㐀-䶿一-鿿豈-﫿＀-￯]/;

/** Characters that may not begin a line (行頭禁則). */
const NO_LINE_START =
  "、。，．・：；！？）］｝」』】〉》〕〙〗ゝゞーァィゥェォッャュョヮヵヶ％‰°′″℃,.:;!?)]}";

/** Characters that may not end a line (行末禁則). */
const NO_LINE_END = "（［｛「『【〈《〔〘〖([{¥$￥＄";

/**
 * A `hyphenationCallback` for @react-pdf's `Text`.
 *
 * Non-CJK words are handed to the engine's own hyphenator (passed in as the
 * second argument), so English keeps its stock line breaking.
 */
export function cjkHyphenation(
  word: string,
  fallback?: (word: string) => string[],
): string[] {
  if (!CJK_PATTERN.test(word)) return fallback ? fallback(word) : [word];

  const chars = [...word];
  const parts: string[] = [];
  for (let i = 0; i < chars.length; i += 1) {
    const char = chars[i];
    const next = chars[i + 1];
    parts.push(char);
    if (next === undefined) break;
    // Only break where CJK is involved; "Acme Pte Ltd" stays whole.
    if (!CJK_PATTERN.test(char) && !CJK_PATTERN.test(next)) continue;
    if (NO_LINE_START.includes(next)) continue;
    if (NO_LINE_END.includes(char)) continue;
    parts.push(BREAK_OPPORTUNITY);
  }
  return parts;
}

/**
 * Props to spread onto a `Text` holding Japanese. Preferred over
 * `Font.registerHyphenationCallback`, which is global state that would
 * change English documents too.
 */
export const japaneseTextProps = {
  hyphenationCallback: cjkHyphenation,
  // Outbid textkit's default hyphenation penalty (600) so a hyphenated
  // break is never chosen over an invisible glue break.
  hyphenationPenalty: 10_000,
};
