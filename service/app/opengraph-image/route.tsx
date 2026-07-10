import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { NextRequest } from "next/server";
import { ImageResponse } from "next/og";

/**
 * The Open Graph card, generated so it can never drift from the brand.
 * Rendered at 2× (2400×1260) so link previews stay crisp after platform
 * re-compression. `?locale=ja` renders the Japanese card using a
 * committed Noto Sans JP subset (assets/…-subset.woff, ~17 KB — satori's
 * default font has no CJK glyphs); if the font file is unreadable it
 * falls back to the English card rather than serving tofu.
 */

export const runtime = "nodejs";

const W = 2400;
const H = 1260;

const INK = "#0f0d0b";
const PAPER = "#faf9f5";
const BRAND = "#d4551a";
const MUTED = "#8f8a82";

let jpFont: Buffer | null | undefined;
async function loadJpFont(): Promise<Buffer | null> {
  if (jpFont !== undefined) return jpFont;
  try {
    jpFont = await readFile(
      join(process.cwd(), "assets", "noto-sans-jp-700-subset.woff"),
    );
  } catch {
    jpFont = null;
  }
  return jpFont;
}

export async function GET(req: NextRequest) {
  const wantsJa = req.nextUrl.searchParams.get("locale") === "ja";
  const font = wantsJa ? await loadJpFont() : null;
  const ja = wantsJa && font !== null;

  const headline = ja
    ? ["見せる。", "でも、渡さない。"]
    : ["Show the work.", "Keep the idea."];
  const tagline = ja
    ? "デモ・プロトタイプ・PoCのためのデジタルNDAゲート"
    : "The digital NDA gate for demos, prototypes & PoCs";
  const oss = ja ? "オープンソース · AGPL" : "open source · AGPL";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: INK,
          padding: "144px 160px",
          fontFamily: ja ? "NotoJP" : "sans-serif",
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", fontSize: 88, fontWeight: 700 }}>
          <span style={{ color: PAPER }}>POC</span>
          <span style={{ color: BRAND }}>X</span>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: ja ? 168 : 184,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
            }}
          >
            <span style={{ color: PAPER }}>{headline[0]}</span>
            <span style={{ color: BRAND }}>{headline[1]}</span>
          </div>
          <div
            style={{
              marginTop: 64,
              fontSize: 64,
              color: MUTED,
              display: "flex",
            }}
          >
            {tagline}
          </div>
        </div>

        {/* Footer strip */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 52,
            color: MUTED,
          }}
        >
          <span>pocx.dev</span>
          <span>{oss}</span>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: font
        ? [{ name: "NotoJP", data: font, weight: 700, style: "normal" }]
        : undefined,
    },
  );
}
