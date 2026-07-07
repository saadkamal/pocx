import { notFound } from "next/navigation";
import { pocForWorkspace, requireOperator } from "@/lib/auth/operator";
import { listGateSessions } from "@/lib/db/repo";
import { formatDateTime } from "@/lib/utils";
import { resolveLocale } from "@/lib/i18n/dashboard";
import { SessionsClient, type SessionItem } from "./sessions-client";

export default async function SessionsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const ctx = await requireOperator();
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale(rawLocale);
  const poc = pocForWorkspace(ctx, id);
  if (!poc) notFound();

  const now = Date.now();
  const idleMs = poc.idleTimeoutHours * 60 * 60 * 1000;

  const rows: SessionItem[] = listGateSessions(poc.id).map((s) => {
    const status = s.revokedAt
      ? "revoked"
      : s.expiresAt.getTime() < now
        ? "expired"
        : now - s.lastActiveAt.getTime() > idleMs
          ? "idle"
          : "active";
    return {
      id: s.id,
      email: s.email,
      signedIn: formatDateTime(s.createdAt),
      lastActive: formatDateTime(s.lastActiveAt),
      ip: s.ip,
      status,
    };
  });

  return <SessionsClient pocId={poc.id} rows={rows} locale={locale} />;
}
