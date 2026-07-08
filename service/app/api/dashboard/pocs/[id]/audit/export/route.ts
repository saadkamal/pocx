import { getOperatorContext, pocForWorkspace } from "@/lib/auth/operator";
import { listAudit } from "@/lib/db/repo";
import { hasAuditTrail } from "@/lib/plans";

/**
 * RFC-4180-style field: always quoted, internal quotes doubled. Also
 * neutralizes spreadsheet formula injection — a field starting with
 * = + - @ (or a control char) is prefixed with a single quote so Excel /
 * Sheets treat it as text, since some audit fields (userAgent, detail)
 * originate from SDK-ingested app events.
 */
function csvField(value: string | number | null | undefined): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const ctx = await getOperatorContext();
  if (!ctx) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const poc = pocForWorkspace(ctx, id);
  if (!poc) return new Response("Not found", { status: 404 });

  if (!hasAuditTrail(ctx.workspace.plan)) {
    return new Response("Audit trail export is a Pro feature.", {
      status: 403,
    });
  }

  const rows = listAudit(poc.id, 5000);
  const lines = [
    "id,time,event,email,detail,path,source,ip,userAgent",
    ...rows.map((r) =>
      [
        r.id,
        new Date(r.createdAt).toISOString(),
        r.event,
        r.email,
        r.detail,
        r.path,
        r.source,
        r.ip,
        r.userAgent,
      ]
        .map(csvField)
        .join(","),
    ),
  ];

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${poc.slug}-audit.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
