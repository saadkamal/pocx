"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  replyTicketAction,
  type SupportActionResult,
} from "@/app/[locale]/dashboard/support/actions";
import { Label, buttonCn, inputCn } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/lib/db/tickets";
import { localePath, type Locale } from "@/lib/i18n/locales";
import { dashboardDict } from "@/lib/i18n/dashboard";
import { ticketStatusBadge } from "../support-client";

export type ThreadMessage = {
  id: string;
  authorRole: "customer" | "admin";
  authorEmail: string;
  body: string;
  at: string;
};

export function ThreadClient({
  ticket,
  thread,
  locale,
}: {
  ticket: {
    id: string;
    subject: string;
    status: TicketStatus;
    opened: string;
  };
  thread: ThreadMessage[];
  locale: Locale;
}) {
  const router = useRouter();
  const t = dashboardDict[locale].support;
  const formRef = useRef<HTMLFormElement>(null);
  const [result, setResult] = useState<SupportActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(fd: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await replyTicketAction(ticket.id, fd);
      setResult(res);
      if ("ok" in res) {
        formRef.current?.reset();
        router.refresh();
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={localePath(locale, "/dashboard/support")}
        className="text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        {t.backToList}
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          {ticket.subject}
        </h1>
        {ticketStatusBadge(ticket.status, t)}
      </div>
      <p className="mt-1 mb-6 text-sm text-ink-500">
        {t.openedOn(ticket.opened)}
      </p>

      <div className="space-y-4">
        {thread.map((m) => {
          const fromSupport = m.authorRole === "admin";
          return (
            <div
              key={m.id}
              className={cn(
                "max-w-[85%] rounded-xl border p-4",
                fromSupport
                  ? "mr-auto border-brand/20 bg-brand-subtle"
                  : "ml-auto border-ink-200 bg-ink-50",
              )}
            >
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p
                  className={cn(
                    "text-xs font-semibold",
                    fromSupport ? "text-brand-active" : "text-ink-700",
                  )}
                >
                  {fromSupport ? t.supportLabel : m.authorEmail}
                </p>
                <p className="text-xs text-ink-500">{m.at}</p>
              </div>
              <p className="text-sm whitespace-pre-wrap text-ink-800">
                {m.body}
              </p>
            </div>
          );
        })}
      </div>

      <form ref={formRef} action={submit} className="mt-8">
        {ticket.status === "closed" ? (
          <p className="mb-3 rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-600">
            {t.closedNote}
          </p>
        ) : null}
        <Label htmlFor="reply-body">{t.replyLabel}</Label>
        <textarea
          id="reply-body"
          name="body"
          required
          rows={4}
          maxLength={10_000}
          placeholder={t.replyPlaceholder}
          className={inputCn}
        />
        <div className="mt-3">
          <button
            type="submit"
            disabled={pending}
            className={buttonCn("primary", "md")}
          >
            {pending ? t.sending : t.send}
          </button>
        </div>
        {result && "error" in result ? (
          <p className="mt-3 text-sm font-medium text-danger">
            {result.error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
