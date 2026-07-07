import Link from "next/link";
import { pocxOrigin } from "@/lib/utils";
import { TERMS_VARIABLES } from "@/lib/terms";
import { CopyButton } from "../copy-button";
import { H2, P, Code, CodeBlock, Steps, Step, Bullets } from "./primitives";

const TOC = [
  { id: "quickstart", label: "Quickstart (5 min)" },
  { id: "flow", label: "How the flow works" },
  { id: "express", label: "Express / any Node app" },
  { id: "configuration", label: "Configuration reference" },
  { id: "terms", label: "Terms customization" },
  { id: "security", label: "Security model" },
  { id: "agents", label: "For coding agents" },
] as const;

export function DocsContentEn() {
  const origin = pocxOrigin();

  const curlCmd = `curl -o lib/pocx.ts ${origin}/sdk/pocx.ts`;
  const proxySnippet = `import { createPocxGate } from "./lib/pocx";

const gate = createPocxGate();

export const proxy = gate.nextProxy();
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};`;
  const envSnippet = `POCX_URL=${origin}
POCX_PROJECT_KEY=pocx_pk_…
POCX_SECRET=pocx_sk_…   # server-side only — never expose to the browser`;
  const expressSnippet = `import express from "express";
import { createPocxGate } from "./lib/pocx";

const app = express();
const gate = createPocxGate();

app.use(gate.expressMiddleware());`;
  const optionsSnippet = `const gate = createPocxGate({
  cookieName: "pocx_session",        // default
  publicPaths: ["/api/health"],      // prefixes left unprotected
  logEvents: true,                   // stream page_view events (Pro)
});`;
  const agentPrompt = `Add POCX protection to this app. Follow the instructions at ${origin}/llms.txt exactly.`;

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
      <p className="eyebrow">Documentation</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink-900">
        Protect a PoC in five minutes
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-600">
        POCX is a hosted access gate. Your app keeps a single-file SDK that
        verifies signed session tokens; identity, terms and sessions run on
        POCX’s servers.
      </p>
      <p className="mt-4 text-sm text-ink-500">
        New here?{" "}
        <Link
          href="/tutorials"
          className="font-semibold text-brand hover:underline"
        >
          Start with the step-by-step tutorials →
        </Link>{" "}
        Or check the{" "}
        <Link href="/faq" className="font-semibold text-brand hover:underline">
          FAQ
        </Link>
        .
      </p>

      <nav className="mt-8 rounded-xl border border-ink-200 bg-ink-50 p-5">
        <p className="eyebrow">On this page</p>
        <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {TOC.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="text-sm text-brand hover:underline"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-16">
        {/* ---------------------------------------------------------- */}
        <H2 id="quickstart">Quickstart (5 min)</H2>
        <Steps>
          <Step title="Create your PoC">
            <Link
              href="/signup"
              className="font-semibold text-brand hover:underline"
            >
              Sign up
            </Link>{" "}
            (email OTP, no password), create a PoC in the dashboard and
            invite your evaluators’ emails. Only allowlisted emails will ever
            get a login code.
          </Step>
          <Step title="Copy the three env vars">
            <p>
              From the PoC’s Overview page, copy the credentials into your
              app’s server environment (<Code>.env.local</Code> for Next.js):
            </p>
            <CodeBlock title=".env.local" code={envSnippet} copyText={envSnippet} />
            <p className="mt-3">
              <Code>POCX_SECRET</Code> authenticates server-to-server calls.
              Keep it out of the browser and out of git.
            </p>
          </Step>
          <Step title="Download the SDK">
            <p>
              One TypeScript file, zero dependencies, runs on Node and edge
              runtimes:
            </p>
            <CodeBlock title="terminal" code={curlCmd} copyText={curlCmd} />
          </Step>
          <Step title="Wire the gate">
            <p>
              Next.js 16 (App Router): create <Code>proxy.ts</Code> at the
              project root. On Next.js 15 and earlier, name the file{" "}
              <Code>middleware.ts</Code> and export <Code>middleware</Code>{" "}
              instead of <Code>proxy</Code>.
            </p>
            <CodeBlock
              title="proxy.ts"
              code={proxySnippet}
              copyText={proxySnippet}
            />
          </Step>
          <Step title="Deploy">
            Visiting the app now 307-redirects to your branded gate at{" "}
            <Code>{origin}/gate/&lt;slug&gt;</Code>. After OTP login and
            terms acceptance, the evaluator lands back in your app with a
            signed session.
          </Step>
        </Steps>

        {/* ---------------------------------------------------------- */}
        <H2 id="flow">How the flow works</H2>
        <P>Under the hood, a first visit runs this sequence:</P>
        <Steps>
          <Step title="Redirect">
            An unauthenticated request hits the SDK, which 307-redirects to
            the hosted gate for this PoC.
          </Step>
          <Step title="Gate OTP">
            The evaluator enters their email. If it’s on the allowlist, POCX
            emails a 6-digit code (hashed at rest, single-use, rate-limited,
            5-attempt lockout).
          </Step>
          <Step title="Terms e-signature">
            The current Terms of Access are shown; the evaluator signs
            electronically. POCX records the timestamp, IP, user agent and
            the SHA-256 hash of the exact text, and emails a signed PDF
            certificate.
          </Step>
          <Step title="Single-use grant">
            POCX redirects back to your app’s callback with a single-use
            grant that expires in 2 minutes.
          </Step>
          <Step title="Server-side exchange">
            The SDK exchanges the grant server-to-server (authenticated with{" "}
            <Code>POCX_SECRET</Code>) for an HS256-signed session token.
          </Step>
          <Step title="Cookie on your domain">
            The session token is set as a cookie on your app’s own domain —
            POCX is out of the request path from here.
          </Step>
          <Step title="Local verification">
            Every request is verified locally against the token signature,
            and revalidated against POCX every 60 seconds — picking up
            revocations, PoC pauses and terms version bumps.
          </Step>
        </Steps>

        {/* ---------------------------------------------------------- */}
        <H2 id="express">Express / any Node app</H2>
        <P>
          The same SDK file ships an Express-style middleware. Mount it
          before your routes:
        </P>
        <CodeBlock
          title="server.ts"
          code={expressSnippet}
          copyText={expressSnippet}
        />
        <P>
          Anything that can run a Node middleware chain works the same way —
          the gate protects every route below it.
        </P>

        {/* ---------------------------------------------------------- */}
        <H2 id="configuration">Configuration reference</H2>
        <P>Environment variables (all required):</P>
        <div className="mt-5 overflow-x-auto rounded-xl border border-ink-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50">
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                  Variable
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "POCX_URL",
                  `Origin of your POCX deployment, e.g. ${origin}.`,
                ],
                [
                  "POCX_PROJECT_KEY",
                  "Public project key for this PoC (pocx_pk_…). Identifies the PoC to the gate.",
                ],
                [
                  "POCX_SECRET",
                  "Server secret (pocx_sk_…). Signs the exchange call and session verification. Server-side only.",
                ],
              ].map(([name, desc]) => (
                <tr key={name} className="border-b border-ink-100 last:border-b-0">
                  <td className="px-4 py-3 align-top font-mono text-xs whitespace-nowrap text-ink-900">
                    {name}
                  </td>
                  <td className="px-4 py-3 align-top text-ink-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <P>
          Options for <Code>createPocxGate(options)</Code>:
        </P>
        <div className="mt-5 overflow-x-auto rounded-xl border border-ink-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50">
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                  Option
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                  Default
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "cookieName",
                  '"pocx_session"',
                  "Name of the session cookie set on your app’s domain.",
                ],
                [
                  "publicPaths",
                  "[]",
                  "Path prefixes to leave unprotected (e.g. [\"/api/health\"]). Everything else is gated.",
                ],
                [
                  "logEvents",
                  "false",
                  "Stream page_view events into the Pro audit trail. Also settable via env POCX_LOG_EVENTS=true.",
                ],
              ].map(([name, def, desc]) => (
                <tr key={name} className="border-b border-ink-100 last:border-b-0">
                  <td className="px-4 py-3 align-top font-mono text-xs whitespace-nowrap text-ink-900">
                    {name}
                  </td>
                  <td className="px-4 py-3 align-top font-mono text-xs whitespace-nowrap text-ink-500">
                    {def}
                  </td>
                  <td className="px-4 py-3 align-top text-ink-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CodeBlock title="example" code={optionsSnippet} copyText={optionsSnippet} />

        {/* ---------------------------------------------------------- */}
        <H2 id="terms">Terms customization</H2>
        <P>
          Every PoC ships with the standard protective Terms of Access
          template — including the clause that makes POCX worth using:
        </P>
        <blockquote className="mt-5 border-l-2 border-brand bg-ink-50 p-5 text-[15px] leading-relaxed text-ink-700 italic">
          “No reuse without engagement. If you or your organisation (whether
          directly or through any third party) develop, commission or
          implement any product, service or solution that is derived from,
          substantially based on, or that incorporates the PoC or the
          concepts embodied in it, you agree to engage {"{{OWNER_ENTITY}}"}{" "}
          in respect of that work on terms to be agreed in good faith.”
        </blockquote>
        <P>
          The template resolves per-PoC placeholders; you can also supply
          fully custom text (which may still use the same placeholders):
        </P>
        <div className="mt-4 flex flex-wrap gap-2">
          {TERMS_VARIABLES.map((v) => (
            <span
              key={v}
              className="rounded-md border border-ink-200 bg-ink-50 px-2 py-1 font-mono text-xs text-ink-700"
            >
              {"{{"}
              {v}
              {"}}"}
            </span>
          ))}
        </div>
        <Bullets
          items={[
            <>
              <strong className="text-ink-900">Template mode</strong> — the
              standard protective terms with your entity, PoC name and
              purpose substituted in.
            </>,
            <>
              <strong className="text-ink-900">Custom mode</strong> — bring
              your own text verbatim; placeholders still resolve if you use
              them.
            </>,
            <>
              <strong className="text-ink-900">Version bumps</strong> —
              incrementing the terms version forces every evaluator to
              re-accept before their next request is allowed through.
            </>,
          ]}
        />
        <P>
          The on-screen terms, the signed PDF and the stored SHA-256 hash are
          all derived from the same resolved string, so the three are
          guaranteed identical.
        </P>

        {/* ---------------------------------------------------------- */}
        <H2 id="security">Security model</H2>
        <Bullets
          items={[
            "OTP codes are hashed at rest, single-use, rate-limited, and lock the email out after 5 failed attempts.",
            "No evaluator passwords exist anywhere — there is nothing to leak.",
            "Sessions are revocable server-side: the SDK revalidates against POCX every 60 seconds, so a revoke, PoC pause or terms bump takes effect within a minute.",
            <>
              <Code>POCX_SECRET</Code> never reaches the browser — the
              grant-for-token exchange happens server-to-server.
            </>,
            "The callback grant is single-use and expires after 2 minutes.",
            "The gate never open-redirects: it only returns evaluators to the registered protected app URL.",
          ]}
        />

        {/* ---------------------------------------------------------- */}
        <H2 id="agents">For coding agents</H2>
        <P>
          The fastest integration is not doing it yourself. POCX publishes
          agent-executable instructions at{" "}
          <a
            href="/llms.txt"
            className="font-mono font-semibold text-brand hover:underline"
          >
            /llms.txt
          </a>{" "}
          — paste this into Claude Code, Codex or Cursor:
        </P>
        <div className="mt-5 flex items-center gap-3 rounded-lg bg-ink-950 p-4">
          <p className="flex-1 font-mono text-sm leading-relaxed text-ink-100">
            {agentPrompt}
          </p>
          <CopyButton text={agentPrompt} />
        </div>
        <P>
          The agent reads the instructions, downloads the single-file SDK,
          wires the middleware and verifies the redirect — end-to-end.
        </P>
      </div>
    </div>
  );
}
