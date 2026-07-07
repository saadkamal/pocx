"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tiny clipboard button for the marketing pages and docs. It always sits
 * on the dark code/terminal blocks (bg-ink-950), so it is styled for dark
 * surfaces; flashes a brand-accent "Copied" state for two seconds.
 */
export function CopyButton({
  text,
  label,
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions / non-secure context) — no-op.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : (label ?? "Copy to clipboard")}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-xs font-medium transition-colors",
        copied
          ? "border-brand/50 text-brand"
          : "border-white/15 text-ink-400 hover:border-white/30 hover:text-ink-100",
        className,
      )}
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      {copied ? "Copied" : (label ?? "Copy")}
    </button>
  );
}
