"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  revokeAllSessionsAction,
  revokeSessionAction,
} from "@/app/[locale]/dashboard/actions";
import {
  Badge,
  EmptyState,
  Table,
  Td,
  Th,
  buttonCn,
} from "@/components/ui";
import type { Locale } from "@/lib/i18n/locales";
import { dashboardDict } from "@/lib/i18n/dashboard";

export type SessionItem = {
  id: string;
  email: string;
  signedIn: string;
  lastActive: string;
  ip: string | null;
  status: "active" | "idle" | "expired" | "revoked";
};

const STATUS_TONE: Record<
  SessionItem["status"],
  "success" | "warning" | "neutral" | "danger"
> = {
  active: "success",
  idle: "warning",
  expired: "neutral",
  revoked: "danger",
};

export function SessionsClient({
  pocId,
  rows,
  locale,
}: {
  pocId: string;
  rows: SessionItem[];
  locale: Locale;
}) {
  const router = useRouter();
  const t = dashboardDict[locale].poc.sessions;
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const statusLabels: Record<SessionItem["status"], string> = {
    active: t.statusActive,
    idle: t.statusIdle,
    expired: t.statusExpired,
    revoked: t.statusRevoked,
  };

  const revocable = rows.some(
    (s) => s.status === "active" || s.status === "idle",
  );

  function revokeOne(id: string) {
    setMessage(null);
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const res = await revokeSessionAction(pocId, id);
      setBusyId(null);
      if ("error" in res) setError(res.error);
      else router.refresh();
    });
  }

  function revokeAll() {
    if (!window.confirm(t.revokeAllConfirm)) {
      return;
    }
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await revokeAllSessionsAction(pocId);
      if ("error" in res) setError(res.error);
      else {
        setMessage(res.message ?? t.revokedFallback);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-ink-500">{t.intro}</p>
        <button
          type="button"
          onClick={revokeAll}
          disabled={pending || !revocable}
          className={buttonCn("danger", "sm")}
        >
          {t.revokeAll}
        </button>
      </div>

      {error ? (
        <p className="text-sm font-medium text-danger">{error}</p>
      ) : null}
      {message ? (
        <p className="text-sm font-medium text-success">{message}</p>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState title={t.emptyTitle} hint={t.emptyHint} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{t.thEmail}</Th>
              <Th>{t.thSignedIn}</Th>
              <Th>{t.thLastActive}</Th>
              <Th>{t.thIp}</Th>
              <Th>{t.thStatus}</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const canRevoke = s.status === "active" || s.status === "idle";
              return (
                <tr key={s.id}>
                  <Td className="font-medium text-ink-900">{s.email}</Td>
                  <Td className="text-ink-600">{s.signedIn}</Td>
                  <Td className="text-ink-600">{s.lastActive}</Td>
                  <Td className="text-ink-600">{s.ip ?? "—"}</Td>
                  <Td>
                    <Badge tone={STATUS_TONE[s.status]}>
                      {statusLabels[s.status]}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    {canRevoke ? (
                      <button
                        type="button"
                        onClick={() => revokeOne(s.id)}
                        disabled={pending && busyId === s.id}
                        className={buttonCn("danger", "sm")}
                      >
                        {pending && busyId === s.id ? t.revoking : t.revoke}
                      </button>
                    ) : null}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
