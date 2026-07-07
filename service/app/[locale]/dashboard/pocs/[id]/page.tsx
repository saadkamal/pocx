import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { pocForWorkspace, requireOperator } from "@/lib/auth/operator";
import { pocStats } from "@/lib/db/repo";
import { Card, CardTitle, Mono, buttonCn } from "@/components/ui";
import { pocxOrigin } from "@/lib/utils";
import { dashboardDict, resolveLocale } from "@/lib/i18n/dashboard";
import { CopyButton } from "./copy-button";
import { RevealSecret } from "./reveal-secret";

/** Dark code block with a floating copy button. */
function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-ink-950 p-4 font-mono text-xs leading-relaxed text-ink-100">
        {code}
      </pre>
      <CopyButton
        text={code}
        className="absolute top-2 right-2 text-ink-400 hover:bg-ink-700 hover:text-white"
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-ink-900">{value}</p>
    </Card>
  );
}

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const ctx = await requireOperator();
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale(rawLocale);
  const t = dashboardDict[locale].poc.overview;
  const poc = pocForWorkspace(ctx, id);
  if (!poc) notFound();

  const stats = pocStats(poc.id);
  const origin = pocxOrigin();
  const gateUrl = `${origin}/gate/${poc.slug}`;

  // Everything below that lands in a copy buffer (env block, setup
  // snippets, the agent prompt) intentionally stays English.
  const envBlock = [
    `POCX_URL=${origin}`,
    `POCX_PROJECT_KEY=${poc.publicKey}`,
    `POCX_SECRET=${poc.secret}`,
  ].join("\n");

  const setupShell = [
    "# 1. add the gate (single file, zero deps)",
    `curl -o lib/pocx.ts ${origin}/sdk/pocx.ts`,
    "",
    "# 2. create proxy.ts (Next 16) or middleware.ts (Next ≤15) at the project root:",
  ].join("\n");

  const setupTs = [
    'import { createPocxGate } from "./lib/pocx";',
    "const gate = createPocxGate();",
    "export const proxy = gate.nextProxy();      // Next 16",
    "// export const middleware = gate.nextProxy(); // Next ≤15",
    'export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };',
  ].join("\n");

  const agentPrompt = `Add POCX protection to this app. Follow the instructions at ${origin}/llms.txt exactly. My env: POCX_URL=${origin}, POCX_PROJECT_KEY=${poc.publicKey}, POCX_SECRET=<in .env.local>.`;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t.statActiveEvaluators} value={stats.evaluators} />
        <StatCard label={t.statLiveSessions} value={stats.activeSessions} />
        <StatCard label={t.statSignatures} value={stats.signatures} />
        <StatCard label={t.statAuditEvents} value={stats.auditEvents} />
      </div>

      {/* Integration */}
      <Card>
        <CardTitle>{t.integrationTitle}</CardTitle>
        <p className="mb-5 text-sm text-ink-500">{t.integrationDesc}</p>

        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-40 shrink-0 font-medium text-ink-700">
              POCX_URL
            </span>
            <Mono>{origin}</Mono>
            <CopyButton text={origin} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-40 shrink-0 font-medium text-ink-700">
              POCX_PROJECT_KEY
            </span>
            <Mono className="break-all">{poc.publicKey}</Mono>
            <CopyButton text={poc.publicKey} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-40 shrink-0 font-medium text-ink-700">
              POCX_SECRET
            </span>
            <RevealSecret secret={poc.secret} />
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-ink-700">
            {t.envFileBefore}
            <Mono>.env.local</Mono>
            {t.envFileAfter}
          </p>
          <CodeBlock code={envBlock} />
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-sm font-medium text-ink-700">{t.setup}</p>
          <CodeBlock code={setupShell} />
          <CodeBlock code={setupTs} />
        </div>

        <div className="mt-6 rounded-lg border border-ink-200 bg-ink-50 p-4">
          <p className="mb-2 text-sm font-semibold text-ink-900">
            {t.agentTitle}
          </p>
          <div className="flex items-start gap-2">
            <p className="font-mono text-xs leading-relaxed text-ink-800">
              {agentPrompt}
            </p>
            <CopyButton text={agentPrompt} className="shrink-0" />
          </div>
          <p className="mt-2 text-xs text-ink-500">{t.agentCaption}</p>
        </div>
      </Card>

      {/* Hosted gate */}
      <Card>
        <CardTitle>{t.gateTitle}</CardTitle>
        <p className="mb-4 text-sm text-ink-600">
          {t.gateBefore}
          <Mono>{gateUrl}</Mono>
          <CopyButton text={gateUrl} className="ml-1 align-middle" />
          {t.gateAfter}
        </p>
        <a
          href={gateUrl}
          target="_blank"
          rel="noreferrer"
          className={buttonCn("secondary", "sm")}
        >
          {t.openGate}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <p className="mt-3 text-xs text-ink-500">{t.chainNote}</p>
      </Card>
    </div>
  );
}
