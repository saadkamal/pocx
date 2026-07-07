"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { splitLocaleFromPath } from "@/lib/i18n/locales";
import { dashboardDict } from "@/lib/i18n/dashboard";

/**
 * Small copy-to-clipboard icon button, used across the PoC pages.
 * Optional `label` renders inline text next to the icon.
 * Locale is derived from the pathname — the button is used in too many
 * places for a prop to be worth threading through.
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
  const [locale] = splitLocaleFromPath(usePathname() ?? "/");
  const t = dashboardDict[locale].poc.common;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return; // clipboard unavailable (very old browser / http)
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? t.copied : t.copy}
      title={copied ? t.copied : t.copy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md p-1.5 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900",
        className,
      )}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-success" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {label ? (
        <span className="text-xs font-medium">
          {copied ? t.copied : label}
        </span>
      ) : null}
    </button>
  );
}
