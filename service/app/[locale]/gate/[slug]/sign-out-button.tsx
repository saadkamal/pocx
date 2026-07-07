"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { buttonCn } from "@/components/ui";
import { localePath, type Locale } from "@/lib/i18n/locales";
import { gateDict } from "@/lib/i18n/gate";

/** Revoke the gate session server-side, then land back on the login. */
export default function SignOutButton({
  slug,
  locale,
}: {
  slug: string;
  locale: Locale;
}) {
  const [loading, setLoading] = useState(false);
  const t = gateDict[locale].gate.granted;

  async function signOut() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch(`/api/gate/${slug}/logout`, { method: "POST" });
    } catch {
      // Even if the request fails, reload — the page re-checks the session.
    }
    window.location.assign(localePath(locale, `/gate/${slug}`));
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={loading}
      className={`${buttonCn("ghost", "md")} w-full`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="h-4 w-4" aria-hidden="true" />
      )}
      {t.signOut}
    </button>
  );
}
