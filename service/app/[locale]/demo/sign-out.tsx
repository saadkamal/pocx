"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { localePath, type Locale } from "@/lib/i18n/locales";

/**
 * Revoke the underlying gate session (the same revocation a dashboard
 * owner could trigger), then leave the demo. The demo-app token instantly
 * fails its live session check — access dies, as advertised.
 */
export function FalconSignOut({
  slug,
  locale,
  label,
}: {
  slug: string;
  locale: Locale;
  label: string;
}) {
  const [loading, setLoading] = useState(false);

  async function signOut() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch(`/api/gate/${slug}/logout`, { method: "POST" });
    } catch {
      // Even if the request fails, navigate away — the page re-checks.
    }
    window.location.assign(localePath(locale, "/"));
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs font-medium text-ink-300 transition-colors hover:border-white/30 hover:text-paper"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {label}
    </button>
  );
}
