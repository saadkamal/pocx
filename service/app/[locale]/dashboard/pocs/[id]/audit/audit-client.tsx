"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import {
  Badge,
  EmptyState,
  Table,
  Td,
  Th,
  buttonCn,
  inputCn,
} from "@/components/ui";
import type { Locale } from "@/lib/i18n/locales";
import { dashboardDict } from "@/lib/i18n/dashboard";

export type AuditItem = {
  id: number;
  time: string;
  event: string;
  email: string | null;
  detail: string | null;
  path: string | null;
  source: string;
  ip: string | null;
};

type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger";

/** Event badge tone: denials/revocations always read as danger. */
function toneFor(event: string): BadgeTone {
  if (/denied|denial|revoked|revoke/.test(event)) return "danger";
  if (event.startsWith("gate_")) return "brand";
  if (event.startsWith("sdk_")) return "neutral";
  return "warning";
}

export function AuditClient({
  pocId,
  rows,
  locale,
}: {
  pocId: string;
  rows: AuditItem[];
  locale: Locale;
}) {
  const t = dashboardDict[locale].poc.audit;
  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("all");

  const eventTypes = useMemo(
    () => Array.from(new Set(rows.map((r) => r.event))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (eventFilter !== "all" && r.event !== eventFilter) return false;
      if (!q) return true;
      return [r.event, r.email, r.detail, r.path, r.source, r.ip, r.time]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, query, eventFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.filterPlaceholder}
          className={`${inputCn} max-w-xs`}
          aria-label={t.filterAria}
        />
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className={`${inputCn} w-auto`}
          aria-label={t.eventFilterAria}
        >
          <option value="all">{t.allEvents}</option>
          {eventTypes.map((ev) => (
            <option key={ev} value={ev}>
              {ev}
            </option>
          ))}
        </select>
        <span className="text-sm text-ink-500">
          {t.count(filtered.length, rows.length)}
        </span>
        <a
          href={`/api/dashboard/pocs/${pocId}/audit/export`}
          download
          className={`${buttonCn("secondary", "sm")} ml-auto`}
        >
          <Download className="h-3.5 w-3.5" />
          {t.exportCsv}
        </a>
      </div>

      {rows.length === 0 ? (
        <EmptyState title={t.emptyTitle} hint={t.emptyHint} />
      ) : filtered.length === 0 ? (
        <EmptyState title={t.noMatchTitle} hint={t.noMatchHint} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{t.thTime}</Th>
              <Th>{t.thEvent}</Th>
              <Th>{t.thEmail}</Th>
              <Th>{t.thDetail}</Th>
              <Th>{t.thPath}</Th>
              <Th>{t.thSource}</Th>
              <Th>{t.thIp}</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <Td className="whitespace-nowrap text-ink-600">{r.time}</Td>
                <Td>
                  <Badge tone={toneFor(r.event)}>{r.event}</Badge>
                </Td>
                <Td className="text-ink-700">{r.email ?? "—"}</Td>
                <Td className="max-w-56">
                  <span className="block truncate" title={r.detail ?? undefined}>
                    {r.detail ?? "—"}
                  </span>
                </Td>
                <Td className="max-w-40">
                  <span className="block truncate" title={r.path ?? undefined}>
                    {r.path ?? "—"}
                  </span>
                </Td>
                <Td className="text-ink-600">{r.source}</Td>
                <Td className="text-ink-600">{r.ip ?? "—"}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
