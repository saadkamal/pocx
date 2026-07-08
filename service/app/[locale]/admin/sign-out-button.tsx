"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch {
      // Cookie may already be gone — landing on /admin/login is right anyway.
    }
    window.location.assign("/admin/login");
  }

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs font-semibold text-ink-300 transition-colors hover:bg-white/10 hover:text-paper disabled:cursor-not-allowed disabled:opacity-50"
    >
      <LogOut className="h-3.5 w-3.5" aria-hidden />
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
