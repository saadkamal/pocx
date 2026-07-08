import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, checkSession } from "@/lib/auth/session";
import { normalizeEmail } from "@/lib/auth/otp";
import type { SessionRow } from "@/lib/db/schema";

/**
 * Owner ops-console auth (/admin). Admins are a small env-defined
 * allowlist (`POCX_ADMIN_EMAILS`, comma-separated) — no DB management
 * surface for the keys to the whole platform. Login is the same OTP
 * machinery as everything else, in its own realm (sessions.kind="admin",
 * cookie pocx_admin), so an operator or gate cookie can never open /admin.
 */

export const ADMIN_TTL_HOURS = 12;
export const ADMIN_IDLE_HOURS = 2;

export function adminEmails(): string[] {
  return (process.env.POCX_ADMIN_EMAILS ?? "saad@haxo.com.au")
    .split(",")
    .map((e) => normalizeEmail(e))
    .filter((e) => e.includes("@"));
}

export function isAdminEmail(email: string): boolean {
  return adminEmails().includes(normalizeEmail(email));
}

export type AdminContext = { session: SessionRow; email: string };

export async function getAdminContext(): Promise<AdminContext | null> {
  const jar = await cookies();
  const check = checkSession(jar.get(ADMIN_COOKIE)?.value, {
    kind: "admin",
    idleHours: ADMIN_IDLE_HOURS,
  });
  if (!check.ok) return null;
  // Re-verify against the allowlist so removing an env email kills access
  // on the next request, not at session expiry.
  if (!isAdminEmail(check.session.email)) return null;
  return { session: check.session, email: check.session.email };
}

export async function requireAdmin(): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login");
  return ctx;
}
