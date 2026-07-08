"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createTicketAction,
  type SupportActionResult,
} from "@/app/[locale]/dashboard/support/actions";
import {
  Badge,
  Card,
  CardTitle,
  EmptyState,
  Label,
  Table,
  Td,
  Th,
  buttonCn,
  inputCn,
} from "@/components/ui";
import type { TicketStatus } from "@/lib/db/tickets";
import { localePath, type Locale } from "@/lib/i18n/locales";
import { dashboardDict, type DashboardStrings } from "@/lib/i18n/dashboard";

export type TicketItem = {
  id: string;
  subject: string;
  status: TicketStatus;
  created: string;
  updated: string;
  createdBy: string;
};

/**
 * Customer-facing status badge. From the customer's perspective "open"
 * means "we're on it" and "pending" means "your turn".
 */
export function ticketStatusBadge(
  status: TicketStatus,
  t: DashboardStrings["support"],
) {
  if (status === "open") return <Badge tone="brand">{t.statusOpen}</Badge>;
  if (status === "pending")
    return <Badge tone="warning">{t.statusPending}</Badge>;
  return <Badge tone="neutral">{t.statusClosed}</Badge>;
}

export function SupportClient({
  rows,
  locale,
}: {
  rows: TicketItem[];
  locale: Locale;
}) {
  const router = useRouter();
  const t = dashboardDict[locale].support;
  const [result, setResult] = useState<SupportActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(fd: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await createTicketAction(fd);
      setResult(res);
      if ("ok" in res && res.ticketId) {
        router.push(localePath(locale, `/dashboard/support/${res.ticketId}`));
      }
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">
        {t.title}
      </h1>
      <p className="mt-2 mb-6 text-sm text-ink-600">
        {t.intro} {t.emailPrefix}
        <a
          href="mailto:pocx@haxo.com.au"
          className="font-semibold text-brand hover:underline"
        >
          pocx@haxo.com.au
        </a>
        {t.emailSuffix}
      </p>

      <div className="space-y-6">
        <Card>
          <CardTitle>{t.newTitle}</CardTitle>
          <p className="mb-4 text-sm text-ink-500">{t.newNote}</p>
          <form action={submit} className="space-y-4">
            <div>
              <Label htmlFor="ticket-subject">{t.subjectLabel}</Label>
              <input
                id="ticket-subject"
                name="subject"
                type="text"
                required
                maxLength={150}
                placeholder={t.subjectPlaceholder}
                className={inputCn}
              />
            </div>
            <div>
              <Label htmlFor="ticket-body">{t.bodyLabel}</Label>
              <textarea
                id="ticket-body"
                name="body"
                required
                rows={5}
                maxLength={10_000}
                placeholder={t.bodyPlaceholder}
                className={inputCn}
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className={buttonCn("primary", "md")}
            >
              {pending ? t.submitting : t.submit}
            </button>
          </form>
          {result && "error" in result ? (
            <p className="mt-3 text-sm font-medium text-danger">
              {result.error}
            </p>
          ) : null}
        </Card>

        {rows.length === 0 ? (
          <EmptyState title={t.emptyTitle} hint={t.emptyHint} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t.thSubject}</Th>
                <Th>{t.thStatus}</Th>
                <Th>{t.thUpdated}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <Td>
                    <Link
                      href={localePath(
                        locale,
                        `/dashboard/support/${row.id}`,
                      )}
                      className="font-medium text-ink-900 hover:text-brand hover:underline"
                    >
                      {row.subject}
                    </Link>
                  </Td>
                  <Td>{ticketStatusBadge(row.status, t)}</Td>
                  <Td className="text-ink-600">{row.updated}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
