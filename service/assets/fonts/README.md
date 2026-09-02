# Japanese PDF fonts

`NotoSansJP-{Regular,Bold}-subset.otf` — Noto Sans JP, subset for the signed
Terms-of-Access PDF. Upstream: [notofonts/noto-cjk](https://github.com/notofonts/noto-cjk)
(`Sans/SubsetOTF/JP`), SIL Open Font License 1.1 — see `../../NOTICE`.

Regenerate with `scripts/build-jp-font-subset.sh`.

## Why these are committed

`@react-pdf/renderer` ships Helvetica and Courier, neither of which has a
single CJK glyph. Without an embedded face the Japanese terms render blank in
the legal PDF. Fetching a font at signature time is not an option either —
the PDF is evidence, and it must render identically offline, forever.

Only the Japanese path loads them; English signatures still use the built-in
Helvetica and touch no font file.

## Two gotchas worth remembering

1. **Never strip the `name` table when subsetting.** `--name-IDs=''` produces
   a font that fontkit parses fine but that `@react-pdf`'s font store never
   resolves, so `renderToBuffer()` hangs forever instead of throwing.
2. **Kanji coverage is deliberately not reduced** to Jōyō or JIS X 0208.
   Japanese names use characters outside both (髙, 﨑, 邉), and the signer's
   typed name is reproduced in the PDF. ~3.2 MB per weight is the price of
   never rendering someone's own name as a tofu box.
