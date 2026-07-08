"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminReplyTicketAction,
  setTicketStatusAction,
  type AdminActionResult,
} from "@/app/[locale]/admin/actions";
import { Label, buttonCn, inputCn } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/lib/db/tickets";

export type AdminThreadMessage = {
  id: string;
  authorRole: "customer" | "admin";
  authorEmail: string;
  body: string;
  at: string;
};

export function AdminThread({
  ticketId,
  status,
  createdBy,
  thread,
}: {
  ticketId: string;
  status: TicketStatus;
  createdBy: string;
  thread: AdminThreadMessage[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [replyResult, setReplyResult] = useState<AdminActionResult | null>(
    null,
  );
  const [statusResult, setStatusResult] = useState<AdminActionResult | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  function submitReply(fd: FormData) {
    setReplyResult(null);
    startTransition(async () => {
      const res = await adminReplyTicketAction(ticketId, fd);
      setReplyResult(res);
      if ("ok" in res) {
        formRef.current?.reset();
        router.refresh();
      }
    });
  }

  function setStatus(next: TicketStatus) {
    if (
      next === "closed" &&
      !confirm("Close this ticket? Either side can reopen it by replying.")
    ) {
      return;
    }
    setStatusResult(null);
    startTransition(async () => {
      const res = await setTicketStatusAction(ticketId, next);
      setStatusResult(res);
      if ("ok" in res) router.refresh();
    });
  }

  return (
    <div>
      <div className="space-y-4">
        {thread.map((m) => {
          const fromAdmin = m.authorRole === "admin";
          return (
            <div
              key={m.id}
              className={cn(
                "max-w-[85%] rounded-xl border p-4",
                fromAdmin
                  ? "ml-auto border-brand/20 bg-brand-subtle"
                  : "mr-auto border-ink-200 bg-ink-50",
              )}
            >
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p
                  className={cn(
                    "text-xs font-semibold",
                    fromAdmin ? "text-brand-active" : "text-ink-700",
                  )}
                  title={fromAdmin ? m.authorEmail : undefined}
                >
                  {fromAdmin ? "You" : m.authorEmail}
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

      <form ref={formRef} action={submitReply} className="mt-8">
        <Label htmlFor="admin-reply-body">Reply</Label>
        <textarea
          id="admin-reply-body"
          name="body"
          required
          rows={4}
          maxLength={10_000}
          placeholder="Write a reply…"
          className={inputCn}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className={buttonCn("primary", "md")}
          >
            {pending ? "Sending…" : "Send reply"}
          </button>
          <p className="text-xs text-ink-500">
            Sends an email to {createdBy}
          </p>
        </div>
        {replyResult && "error" in replyResult ? (
          <p className="mt-3 text-sm font-medium text-danger">
            {replyResult.error}
          </p>
        ) : null}
        {replyResult && "ok" in replyResult && replyResult.message ? (
          <p className="mt-3 text-sm font-medium text-success">
            {replyResult.message}
          </p>
        ) : null}
      </form>

      <div className="mt-8 border-t border-ink-200 pt-5">
        {status === "closed" ? (
          <button
            type="button"
            onClick={() => setStatus("open")}
            disabled={pending}
            className={buttonCn("secondary", "sm")}
          >
            Reopen ticket
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStatus("closed")}
            disabled={pending}
            className={buttonCn("secondary", "sm")}
          >
            Close ticket
          </button>
        )}
        {statusResult && "error" in statusResult ? (
          <p className="mt-3 text-sm font-medium text-danger">
            {statusResult.error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
