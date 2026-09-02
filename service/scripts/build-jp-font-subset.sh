#!/usr/bin/env bash
# Rebuild the Japanese PDF fonts in assets/fonts/.
#
# The signed Terms-of-Access PDF is rendered by @react-pdf/renderer, whose
# built-in fonts (Helvetica/Courier) have no CJK glyphs — Japanese terms
# would come out blank. A CJK face therefore has to be embedded.
#
# Full Noto Sans JP is ~4.5 MB per weight. We subset to the ranges POCX can
# actually emit (kana, CJK punctuation, fullwidth forms, every kanji the
# font carries, plus Latin) which lands at ~3.2 MB per weight.
#
# Kanji are NOT reduced to Jōyō/JIS X 0208: Japanese company and personal
# names routinely use characters outside those sets (髙橋, 山﨑, 渡邉), and a
# signer's typed name goes straight into the legal PDF. Tofu there is not
# an option.
#
# Requires: python3 with fonttools (pip install fonttools).
set -euo pipefail

cd "$(dirname "$0")/.."
OUT="assets/fonts"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

BASE="https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/JP"

# Latin + punctuation + kana + CJK punctuation/fullwidth + all kanji
# (incl. U+F900-FAFF compatibility ideographs, where 﨑 lives).
UNICODES="U+0020-007E,U+00A0-00FF,U+2010-2027,U+2030-205E,U+20A0-20BF,\
U+2100-2103,U+2190-2193,U+25A0-25CF,U+3000-30FF,U+31F0-31FF,U+3220-3243,\
U+3280-32FF,U+4E00-9FFF,U+F900-FAFF,U+FE30-FE4F,U+FF01-FF60,U+FFE0-FFE6"

subset() { # <remote-name> <out-name>
  echo "→ $2"
  curl -sSLf -o "$TMP/$1" "$BASE/$1"
  # Keep the `name` table: @react-pdf's font store never resolves a face
  # without it and renderToBuffer() hangs forever rather than erroring.
  python3 -m fontTools.subset "$TMP/$1" \
    --unicodes="$UNICODES" \
    --output-file="$OUT/$2" \
    --layout-features='kern,palt,liga' \
    --no-hinting --desubroutinize \
    --drop-tables+=DSIG,vhea,vmtx,VORG
}

subset NotoSansJP-Regular.otf NotoSansJP-Regular-subset.otf
subset NotoSansJP-Bold.otf    NotoSansJP-Bold-subset.otf

ls -la "$OUT"
