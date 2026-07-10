import { ImageResponse } from "next/og";

/**
 * The Open Graph card (1200×630) for every page — generated, so it can
 * never drift from the brand tokens. Kept in English for both locales
 * (link previews are brand-level; the default OG font has no CJK glyphs).
 */

export const runtime = "nodejs";
export const alt =
  "POCX — the digital NDA gate for demos, prototypes and PoCs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0f0d0b";
const PAPER = "#faf9f5";
const BRAND = "#d4551a";
const MUTED = "#8f8a82";

export default function OpengraphImage() {
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
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>
          <span style={{ color: PAPER }}>POC</span>
          <span style={{ color: BRAND }}>X</span>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 92,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            <span style={{ color: PAPER }}>Show the work.</span>
            <span style={{ color: BRAND }}>Keep the idea.</span>
          </div>
          <div
            style={{
              marginTop: 32,
              fontSize: 34,
              color: MUTED,
              display: "flex",
            }}
          >
            The digital NDA gate for demos, prototypes & PoCs
          </div>
        </div>

        {/* Footer strip */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 26,
            color: MUTED,
          }}
        >
          <span>pocx.dev</span>
          <span>open source · AGPL</span>
        </div>
      </div>
    ),
    size,
  );
}
