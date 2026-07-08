import type { ReactNode } from "react";
import Link from "next/link";
import SignOutButton from "./sign-out-button";

/**
 * Ops-console shell. Purely visual — NO auth check here: the proxy and
 * every page's requireAdmin() guard the realm, and /admin/login shares
 * this layout. A dark slim top bar (deliberately unlike the customer
 * sidebar) so the owner always knows which door they walked through.
 */

const navLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/funnel", label: "Funnel" },
  { href: "/admin/workspaces", label: "Workspaces" },
  { href: "/admin/tickets", label: "Tickets" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="bg-ink-950 text-paper">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-8">
          <Link
            href="/admin"
            className="flex items-center gap-2.5"
            aria-label="POCX ops console home"
          >
            <span className="text-lg font-bold tracking-tight">
              <span className="text-paper">POC</span>
              <span className="text-brand">X</span>
            </span>
            <span className="rounded border border-brand/40 bg-brand/10 px-1.5 py-0.5 font-mono text-[0.625rem] font-semibold tracking-[0.14em] text-brand uppercase">
              OPS
            </span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-1.5 font-medium text-ink-300 transition-colors hover:bg-white/10 hover:text-paper"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto">
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="w-full flex-1">
        <div className="mx-auto max-w-6xl p-8">{children}</div>
      </main>
    </div>
  );
}
