import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { readFile } from "node:fs/promises";
import { getOperatorContext } from "@/lib/auth/operator";
import { getAcceptanceById, getPocById } from "@/lib/db/repo";
import { SignaturePdf } from "@/lib/pdf/signature-pdf";
import { termsParagraphs } from "@/lib/terms";

/**
 * Download a signed-terms PDF from the dashboard. Serves the stored file
 * when present; otherwise regenerates it faithfully from the acceptance
 * row (which stores the exact terms text that was shown).
 */

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getOperatorContext();
  if (!ctx) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const acceptance = getAcceptanceById(id);
  const poc = acceptance ? getPocById(acceptance.pocId) : null;
  if (!acceptance || !poc || poc.workspaceId !== ctx.workspace.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let buffer: Buffer | null = null;
  if (acceptance.pdfPath) {
    buffer = await readFile(acceptance.pdfPath).catch(() => null);
  }
  if (!buffer) {
    buffer = await renderToBuffer(
      SignaturePdf({
        pocName: poc.name,
        ownerEntity: poc.ownerEntity,
        signatureId: acceptance.id,
        email: acceptance.email,
        acceptedAtUtc: acceptance.acceptedAt.toISOString(),
        ip: acceptance.ip,
        userAgent: acceptance.userAgent,
        termsVersion: acceptance.termsVersion,
        termsHashHex: acceptance.termsHash,
        termsParagraphs: acceptance.termsText
          ? termsParagraphs(acceptance.termsText)
          : ["(Terms text was not stored for this early record.)"],
      }),
    );
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${poc.slug}-terms-${acceptance.id}.pdf"`,
    },
  });
}
