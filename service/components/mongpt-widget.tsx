"use client";

import Script from "next/script";

/**
 * MonGPT support-chat widget — rendered only by the marketing layout, so
 * it never appears on hosted gates, the dashboard, admin or /demo. Chat
 * only (no microphone); the two origins it touches are allow-listed in the
 * CSP (next.config.ts). The tenant/chatbot ids are public client
 * identifiers, not secrets.
 *
 * We init from the loader's `onLoad` rather than a second inline script:
 * both scripts running `afterInteractive` don't have guaranteed ordering,
 * so an inline `MonGPT.init()` can execute before `window.MonGPT` exists
 * ("MonGPT is not defined"). onLoad fires only after the widget is ready.
 */

const TENANT_ID = "a57dad58-2dd1-4436-b40e-16d65c170753";
const CHATBOT_ID = "21759c02-7e70-4f12-96e3-c554006d6e82";

type MonGptGlobal = { init: (opts: Record<string, string>) => void };

export function MonGptWidget() {
  return (
    <Script
      src="https://pub-914801c5a75d4f30b86c82306e07f5ea.r2.dev/mongpt-widget.iife.js"
      strategy="afterInteractive"
      onLoad={() => {
        const mongpt = (window as unknown as { MonGPT?: MonGptGlobal }).MonGPT;
        mongpt?.init({ tenantId: TENANT_ID, chatbotId: CHATBOT_ID });
      }}
    />
  );
}
