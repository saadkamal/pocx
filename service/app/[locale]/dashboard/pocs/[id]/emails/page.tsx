import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { pocForWorkspace, requireOperator } from "@/lib/auth/operator";
import { listPocOutboundEmails } from "@/lib/db/repo";
import { EmptyState, Table, Td, Th } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { dashboardDict, resolveLocale } from "@/lib/i18n/dashboard";

export default async function EmailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const ctx = await requireOperator();
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale(rawLocale);
  const t = dashboardDict[locale].poc.emails;
  const poc = pocForWorkspace(ctx, id);
  if (!poc) notFound();

  const rows = listPocOutboundEmails(poc.id);
  const mockInbox = !process.env.RESEND_API_KEY;

  return (
    <div className="space-y-4">
      {mockInbox ? (
        <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info-subtle p-4 text-sm text-ink-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
          <p>{t.mockNotice}</p>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState title={t.emptyTitle} hint={t.emptyHint} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{t.thTime}</Th>
              <Th>{t.thTo}</Th>
              <Th>{t.thSubject}</Th>
              <Th>{t.thBody}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <Td className="whitespace-nowrap text-ink-600">
                  {formatDateTime(m.createdAt)}
                </Td>
                <Td className="font-medium text-ink-900">{m.recipient}</Td>
                <Td className="text-ink-700">{m.subject}</Td>
                <Td>
                  <details>
                    <summary className="cursor-pointer text-sm font-semibold text-brand select-none">
                      {t.viewBody}
                    </summary>
                    <pre className="mt-2 max-h-72 overflow-y-auto rounded-lg bg-ink-50 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-ink-800">
                      {m.body}
                    </pre>
                  </details>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
