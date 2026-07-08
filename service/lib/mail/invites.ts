import "server-only";
import type { PocRow } from "@/lib/db/schema";
import { sendMail, type SendMailResult } from "@/lib/mail/send";
import { escapeHtml, pocxOrigin } from "@/lib/utils";

/**
 * Invitation emails. Evaluator invites are bilingual (EN + JA) because the
 * recipient's language isn't known yet; operator invites are English
 * (dashboard-first language).
 */

export async function sendEvaluatorInvite(
  poc: PocRow,
  email: string,
): Promise<SendMailResult> {
  const gateUrl = `${pocxOrigin()}/gate/${poc.slug}`;
  const contact = poc.supportEmail ? ` (${poc.supportEmail})` : "";
  // Operator-controlled values — escape before they enter the HTML body.
  const nameH = escapeHtml(poc.name);
  const ownerH = escapeHtml(poc.ownerEntity);
  const contactH = poc.supportEmail
    ? ` (${escapeHtml(poc.supportEmail)})`
    : "";

  const text = `${poc.ownerEntity} has invited you to evaluate "${poc.name}", a private proof of concept.

How access works:
1. Open ${gateUrl}
2. Enter this email address — a 6-digit access code arrives within seconds.
3. Review and accept the Terms of Access (recorded as an electronic signature; a signed PDF copy is emailed to you).
4. You're in.

Access is personal to this email address — please don't share the link on. Questions? Contact ${poc.ownerEntity}${contact}.

――――――

${poc.ownerEntity} より、非公開の概念実証(PoC)「${poc.name}」の評価にご招待します。

アクセス方法:
1. ${gateUrl} を開く
2. このメールアドレスを入力すると、6桁のアクセスコードが届きます。
3. 利用規約(Terms of Access)を確認して同意します(電子署名として記録され、署名済みPDFがメールで届きます)。
4. 以上でアクセスできます。

アクセス権はこのメールアドレスに紐づいています。リンクの共有はご遠慮ください。

— Sent via POCX`;

  const html = `<p><strong>${ownerH}</strong> has invited you to evaluate <strong>${nameH}</strong>, a private proof of concept.</p>
<p>How access works:</p>
<ol>
<li>Open <a href="${gateUrl}">${gateUrl}</a></li>
<li>Enter this email address — a 6-digit access code arrives within seconds.</li>
<li>Review and accept the Terms of Access (recorded as an electronic signature; a signed PDF copy is emailed to you).</li>
<li>You're in.</li>
</ol>
<p>Access is personal to this email address — please don't share the link on. Questions? Contact ${ownerH}${contactH}.</p>
<hr>
<p lang="ja"><strong>${ownerH}</strong> より、非公開の概念実証(PoC)「<strong>${nameH}</strong>」の評価にご招待します。<br>
<a href="${gateUrl}">${gateUrl}</a> を開き、このメールアドレスを入力すると6桁のアクセスコードが届きます。利用規約に同意するとアクセスできます(同意は電子署名として記録されます)。</p>
<p style="color:#7c7365">— Sent via POCX</p>`;

  return sendMail({
    to: email,
    subject: `You're invited to evaluate ${poc.name} · ${poc.name} の評価にご招待`,
    text,
    html,
    pocId: poc.id,
    workspaceId: poc.workspaceId,
  });
}

export async function sendOperatorInvite(input: {
  to: string;
  workspaceName: string;
  invitedBy: string;
  workspaceId: string;
}): Promise<SendMailResult> {
  const loginUrl = `${pocxOrigin()}/login`;
  const text = `${input.invitedBy} added you to the "${input.workspaceName}" workspace on POCX — the access layer that protects proofs of concept.

Sign in (no password needed):
1. Open ${loginUrl}
2. Enter this email address and we'll send you a 6-digit login code.

You'll be able to manage the workspace's PoCs, evaluators, sessions and signatures.

— POCX`;

  const html = `<p><strong>${input.invitedBy}</strong> added you to the <strong>${input.workspaceName}</strong> workspace on POCX — the access layer that protects proofs of concept.</p>
<p>Sign in (no password needed):</p>
<ol>
<li>Open <a href="${loginUrl}">${loginUrl}</a></li>
<li>Enter this email address and we'll send you a 6-digit login code.</li>
</ol>
<p>You'll be able to manage the workspace's PoCs, evaluators, sessions and signatures.</p>
<p style="color:#7c7365">— POCX</p>`;

  return sendMail({
    to: input.to,
    subject: `You've been added to ${input.workspaceName} on POCX`,
    text,
    html,
    workspaceId: input.workspaceId,
  });
}
