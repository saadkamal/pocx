import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireOperator } from "@/lib/auth/operator";
import {
  getWorkspaceTicket,
  listTicketMessages,
  type TicketStatus,
} from "@/lib/db/tickets";
import { formatDateTime } from "@/lib/utils";
import { dashboardDict, resolveLocale } from "@/lib/i18n/dashboard";
import { ThreadClient } from "./thread-client";

type PageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  return { title: dashboardDict[locale].support.metaTitle };
}

export default async function TicketThreadPage({ params }: PageProps) {
  const ctx = await requireOperator();
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale(rawLocale);

  const ticket = getWorkspaceTicket(ctx.workspace.id, id);
  if (!ticket) notFound();

  const thread = listTicketMessages(ticket.id).map((m) => ({
    id: m.id,
    authorRole: m.authorRole as "customer" | "admin",
    authorEmail: m.authorEmail,
    body: m.body,
    at: formatDateTime(m.createdAt),
  }));

  return (
    <ThreadClient
      ticket={{
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status as TicketStatus,
        opened: formatDateTime(ticket.createdAt),
      }}
      thread={thread}
      locale={locale}
    />
  );
}
