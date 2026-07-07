"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { buttonCn } from "@/components/ui";
import { cn } from "@/lib/utils";
import { localePath, type Locale } from "@/lib/i18n/locales";
import { dashboardDict } from "@/lib/i18n/dashboard";

export default function LogoutButton({ locale }: { locale: Locale }) {
  const [busy, setBusy] = useState(false);
  const t = dashboardDict[locale].shell;

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Even if the request fails, send them to /login — the proxy will
      // bounce them back here if the session somehow survived.
    }
    window.location.assign(localePath(locale, "/login"));
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      disabled={busy}
      className={cn(buttonCn("ghost", "sm"), "-ml-2 w-[calc(100%+0.5rem)] justify-start")}
    >
      <LogOut className="h-4 w-4" aria-hidden />
      {busy ? t.loggingOut : t.logout}
    </button>
  );
}
