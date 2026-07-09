import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { renderToBuffer } from "@react-pdf/renderer";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { clientIp } from "@/lib/auth/session";
import {
  getLatestAcceptance,
  insertAcceptance,
  insertAudit,
  setAcceptanceArtifacts,
} from "@/lib/db/repo";
import { newSignatureId } from "@/lib/ids";
import {
  checkGateSession,
  gateCookieName,
  resolveGatePoc,
} from "@/lib/gate";
import { gateDict, gateRequestLocale } from "@/lib/i18n/gate";
import { renderTerms, termsHash, termsParagraphs } from "@/lib/terms";
import { SignaturePdf } from "@/lib/pdf/signature-pdf";
import { sendMail } from "@/lib/mail/send";

/* Hosted gate — record the terms acceptance + electronic signature.
   Email is derived from the session; the text and hash are resolved
   server-side. The only client-supplied field is the typed full name —
   the visible signature — which is validated and stored verbatim. */

export const runtime = "nodejs";

const DB_PATH = process.env.POCX_DB_PATH ?? ".data/pocx.db";

const BodySchema = z
  .object({ name: z.string().trim().min(2).max(120) })
  .strict();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const poc = resolveGatePoc(slug);
  if (!poc) {
    return NextResponse.json({ error: "Unknown PoC" }, { status: 404 });
  }

  const check = checkGateSession(
    req.cookies.get(gateCookieName(poc.slug))?.value,
    poc,
  );
  if (!check.ok) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const email = check.session.email;
  const ip = clientIp(req.headers);
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    const t = gateDict[gateRequestLocale(req)];
    return NextResponse.json({ error: t.api.nameRequired }, { status: 400 });
  }
  const signerName = parsed.data.name;

  // Idempotent: if this version is already accepted, return the record.
  const existing = getLatestAcceptance(poc.id, email, poc.termsVersion);
  if (existing) {
    return NextResponse.json({ ok: true, signatureId: existing.id });
  }

  const signatureId = newSignatureId();
  const resolvedText = renderTerms(poc); // server-side truth
  const hash = termsHash(resolvedText);
  const acceptedAt = new Date();

  insertAcceptance({
    id: signatureId,
    pocId: poc.id,
    email,
    signerName,
    termsVersion: poc.termsVersion,
    termsHash: hash,
    termsText: resolvedText,
    ip,
    userAgent,
  });

  insertAudit({
    workspaceId: poc.workspaceId,
    pocId: poc.id,
    email,
    sessionId: check.session.id,
    event: "gate_terms_accepted",
    detail: `v${poc.termsVersion} · signed "${signerName}"`,
    source: "gate",
    ip,
    userAgent,
  });

  // Signed PDF + email are best-effort: the immutable acceptance row above
  // is the authoritative record either way.
  let pdfPath: string | null = null;
  let emailMessageId: string | null = null;
  try {
    const buffer = await renderToBuffer(
      SignaturePdf({
        pocName: poc.name,
        ownerEntity: poc.ownerEntity,
        signatureId,
        email,
        signerName,
        acceptedAtUtc: acceptedAt.toISOString(),
        ip,
        userAgent,
        termsVersion: poc.termsVersion,
        termsHashHex: hash,
        termsParagraphs: termsParagraphs(resolvedText),
      }),
    );

    const dir = join(dirname(DB_PATH), "signatures");
    await mkdir(dir, { recursive: true });
    pdfPath = join(dir, `${signatureId}.pdf`);
    await writeFile(pdfPath, buffer);

    const t = gateDict[gateRequestLocale(req)];
    const mailParams = {
      pocName: poc.name,
      termsVersion: poc.termsVersion,
      signatureId,
      acceptedAtUtc: acceptedAt.toISOString(),
      ip,
      hash,
      ownerEntity: poc.ownerEntity,
    };
    const result = await sendMail({
      to: email,
      subject: t.email.signedTerms.subject(poc.name),
      text: t.email.signedTerms.text(mailParams),
      html: t.email.signedTerms.html(mailParams),
      attachments: [
        {
          filename: `${poc.slug}-terms-${signatureId}.pdf`,
          content: buffer,
        },
      ],
      pocId: poc.id,
      workspaceId: poc.workspaceId,
    });
    emailMessageId = result.messageId;
  } catch (err) {
    console.warn("[pocx] terms PDF/email failed:", err);
  }

  setAcceptanceArtifacts(signatureId, { pdfPath, emailMessageId });

  return NextResponse.json({ ok: true, signatureId });
}
