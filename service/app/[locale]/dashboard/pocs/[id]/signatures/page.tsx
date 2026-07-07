import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { pocForWorkspace, requireOperator } from "@/lib/auth/operator";
import { listAcceptances } from "@/lib/db/repo";
import { EmptyState, Mono, Table, Td, Th } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { dashboardDict, resolveLocale } from "@/lib/i18n/dashboard";

export default async function SignaturesPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const ctx = await requireOperator();
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale(rawLocale);
  const t = dashboardDict[locale].poc.signatures;
  const poc = pocForWorkspace(ctx, id);
  if (!poc) notFound();

  const rows = listAcceptances(poc.id);

  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm text-ink-500">{t.intro}</p>

      {rows.length === 0 ? (
        <EmptyState title={t.emptyTitle} hint={t.emptyHint} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{t.thEmail}</Th>
              <Th>{t.thVersion}</Th>
              <Th>{t.thAccepted}</Th>
              <Th>{t.thIp}</Th>
              <Th>{t.thSignatureId}</Th>
              <Th>{t.thHash}</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <Td className="font-medium text-ink-900">{a.email}</Td>
                <Td className="text-ink-600">v{a.termsVersion}</Td>
                <Td className="text-ink-600">{formatDateTime(a.acceptedAt)}</Td>
                <Td className="text-ink-600">{a.ip}</Td>
                <Td>
                  <Mono>{a.id}</Mono>
                </Td>
                <Td>
                  <Mono title={a.termsHash}>{`${a.termsHash.slice(0, 16)}…`}</Mono>
                </Td>
                <Td className="text-right">
                  <a
                    href={`/api/dashboard/signatures/${a.id}/pdf`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {t.downloadPdf}
                  </a>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
