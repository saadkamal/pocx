"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { splitLocaleFromPath } from "@/lib/i18n/locales";
import { dashboardDict } from "@/lib/i18n/dashboard";
import { CopyButton } from "./copy-button";

/** Masked `pocx_sk_…` display with a Reveal/Hide toggle and copy button. */
export function RevealSecret({ secret }: { secret: string }) {
  const [locale] = splitLocaleFromPath(usePathname() ?? "/");
  const t = dashboardDict[locale].poc.common;
  const [revealed, setRevealed] = useState(false);
  const masked = `${secret.slice(0, 8)}${"•".repeat(20)}`;

  return (
    <span className="inline-flex items-center gap-1">
      <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[0.8em] break-all text-ink-800">
        {revealed ? secret : masked}
      </code>
      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        aria-label={revealed ? t.hideSecret : t.revealSecret}
        title={revealed ? t.hideSecret : t.revealSecret}
        className="inline-flex items-center rounded-md p-1.5 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
      >
        {revealed ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
      </button>
      <CopyButton text={secret} />
    </span>
  );
}
