import Link from "next/link";
import { pocxOrigin } from "@/lib/utils";
import { TERMS_VARIABLES } from "@/lib/terms";
import { CopyButton } from "../copy-button";
import {
  GuideHeading,
  P,
  Code,
  UiPath,
  CodeBlock,
  Steps,
  Step,
} from "./primitives";

const TOC = [
  { id: "protect-nextjs", label: "Protect a Next.js app end-to-end" },
  { id: "protect-express", label: "Protect an Express app" },
  { id: "coding-agent", label: "Let a coding agent do it" },
  { id: "customize-terms", label: "Customize your Terms of Access" },
  { id: "manage-access", label: "Invite, remove and revoke" },
  { id: "evidence", label: "Your evidence trail (Pro)" },
] as const;

export function TutorialsContentEn() {
  const origin = pocxOrigin();

  const envSnippet = `POCX_URL=${origin}
POCX_PROJECT_KEY=pocx_pk_…
POCX_SECRET=pocx_sk_…   # server-side only — never expose to the browser`;
  const curlCmd = `curl -o lib/pocx.ts ${origin}/sdk/pocx.ts`;
  const proxySnippet = `import { createPocxGate } from "./lib/pocx";

const gate = createPocxGate();

export const proxy = gate.nextProxy();
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};`;
  const expressSnippet = `import express from "express";
import { createPocxGate } from "./lib/pocx";

const app = express();
const gate = createPocxGate();

app.use(gate.expressMiddleware());

// …your routes below are now protected`;
  const agentPrompt = `Add POCX protection to this app. Follow the instructions at ${origin}/llms.txt exactly.`;

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
      <p className="eyebrow">Tutorials</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink-900">
        Tutorials
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-600">
        Six step-by-step guides that take you from a bare app to a protected
        PoC with signed terms, revocable sessions and an evidence trail.
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
        <GuideHeading id="protect-nextjs" time="~10 min">
          1. Protect a Next.js app end-to-end
        </GuideHeading>
        <P>
          The full journey: create a PoC, wire the SDK into a Next.js app,
          then walk through the gate yourself as an evaluator so you know
          exactly what your client will see.
        </P>
        <Steps>
          <Step title="Sign up">
            Go to{" "}
            <Link
              href="/signup"
              className="font-semibold text-brand hover:underline"
            >
              /signup
            </Link>{" "}
            and enter your email. POCX sends a 6-digit code — no password to
            invent, none to leak. Enter the code and you land in the
            dashboard.
          </Step>
          <Step title="Create the PoC">
            Click <UiPath>New PoC</UiPath> in the dashboard and fill in the
            fields. Each one does real work:
            <ul className="mt-3 space-y-2">
              <li>
                <strong className="text-ink-900">Name</strong> — shown on the
                hosted gate and substituted into the terms as{" "}
                <Code>{"{{POC_NAME}}"}</Code>.
              </li>
              <li>
                <strong className="text-ink-900">
                  Owner entity + registration number
                </strong>{" "}
                — your company, named as the IP owner throughout the Terms of
                Access.
              </li>
              <li>
                <strong className="text-ink-900">Client entity</strong> — the
                organisation evaluating the PoC; bound by the terms alongside
                the individual signer.
              </li>
              <li>
                <strong className="text-ink-900">Purpose</strong> — narrows
                what evaluators are allowed to use the PoC for (“solely for
                the purpose of …”).
              </li>
              <li>
                <strong className="text-ink-900">Brand color</strong> — the
                accent color of the hosted gate, so the login page looks like
                yours, not ours.
              </li>
            </ul>
          </Step>
          <Step title="Copy the three env vars">
            Open{" "}
            <UiPath>Dashboard → your PoC → Overview</UiPath> and copy the
            credentials into <Code>.env.local</Code> in your app:
            <CodeBlock
              title=".env.local"
              code={envSnippet}
              copyText={envSnippet}
            />
          </Step>
          <Step title="Download the SDK">
            One dependency-free TypeScript file, straight into your project:
            <CodeBlock title="terminal" code={curlCmd} copyText={curlCmd} />
          </Step>
          <Step title="Wire the gate">
            Create <Code>proxy.ts</Code> at the project root (Next.js 16). On
            Next.js 15 and earlier, name the file <Code>middleware.ts</Code>{" "}
            and export <Code>middleware</Code> instead of <Code>proxy</Code>:
            <CodeBlock
              title="proxy.ts"
              code={proxySnippet}
              copyText={proxySnippet}
            />
          </Step>
          <Step title="Set the protected app URL">
            In <UiPath>Dashboard → your PoC → Settings</UiPath>, set{" "}
            <strong className="text-ink-900">Protected app URL</strong> to
            where your app runs (e.g. its deployment URL). The gate only ever
            redirects evaluators back to this registered URL — it’s what makes
            the return leg of the flow safe.
          </Step>
          <Step title="Invite yourself as an evaluator">
            Go to <UiPath>Dashboard → your PoC → Evaluators</UiPath> and add
            your own email. Only allowlisted emails ever receive a login
            code — everyone else gets a polite dead end. The Free plan
            includes 3 evaluator seats per PoC; Pro removes the cap.
          </Step>
          <Step title="Test the full flow">
            Open your app in a private/incognito window. You should be
            307-redirected to the gate at <Code>{origin}/gate/&lt;slug&gt;</Code>.
            Enter your email, type the 6-digit code from your inbox, read and
            e-sign the Terms of Access, and land back in your app with a live
            session. Then check{" "}
            <UiPath>Dashboard → your PoC → Sessions</UiPath> and{" "}
            <UiPath>Signatures</UiPath> — you’ll see your own session and your
            signed terms record, exactly as you’ll later see your
            evaluators’.
          </Step>
        </Steps>

        {/* ---------------------------------------------------------- */}
        <GuideHeading id="protect-express" time="~5 min">
          2. Protect an Express app
        </GuideHeading>
        <P>
          Same PoC, same three env vars, same single SDK file — Express just
          mounts it as middleware instead of a proxy.
        </P>
        <Steps>
          <Step title="Reuse steps 1–4 above">
            Create the PoC, copy <Code>POCX_URL</Code>,{" "}
            <Code>POCX_PROJECT_KEY</Code> and <Code>POCX_SECRET</Code> into
            your server’s environment, and curl the SDK into{" "}
            <Code>lib/pocx.ts</Code>.
          </Step>
          <Step title="Mount the middleware before your routes">
            Everything registered after the gate is protected:
            <CodeBlock
              title="server.ts"
              code={expressSnippet}
              copyText={expressSnippet}
            />
          </Step>
          <Step title="Plain-JavaScript project?">
            The SDK ships as TypeScript. If your Express app isn’t on TS yet,
            run it with a TS-aware runner like <Code>tsx</Code> (or bundle
            with <Code>esbuild</Code>) — no config beyond{" "}
            <Code>npx tsx server.ts</Code>.
          </Step>
          <Step title="Set the protected app URL and test">
            As with Next.js: set{" "}
            <strong className="text-ink-900">Protected app URL</strong> in{" "}
            <UiPath>Settings</UiPath>, invite yourself in{" "}
            <UiPath>Evaluators</UiPath>, and walk the gate in a private
            window.
          </Step>
        </Steps>

        {/* ---------------------------------------------------------- */}
        <GuideHeading id="coding-agent" time="~2 min">
          3. Let a coding agent do it
        </GuideHeading>
        <P>
          The fastest integration is not doing it yourself. POCX publishes
          agent-executable instructions at{" "}
          <a
            href="/llms.txt"
            className="font-mono font-semibold text-brand hover:underline"
          >
            /llms.txt
          </a>
          .
        </P>
        <Steps>
          <Step title="Paste one prompt">
            Open Claude Code, Codex or Cursor inside your app’s repo and
            paste:
            <div className="mt-4 flex items-center gap-3 rounded-lg bg-ink-950 p-4">
              <p className="flex-1 font-mono text-sm leading-relaxed text-ink-100">
                {agentPrompt}
              </p>
              <CopyButton text={agentPrompt} />
            </div>
          </Step>
          <Step title="What the agent will do">
            It reads the instructions, adds the three env vars (asking you
            for the values from your PoC’s{" "}
            <UiPath>Overview</UiPath> tab), downloads{" "}
            <Code>lib/pocx.ts</Code>, and wires the right entry point for
            your stack — <Code>proxy.ts</Code> on Next.js 16,{" "}
            <Code>middleware.ts</Code> on older Next.js,{" "}
            <Code>expressMiddleware()</Code> on Express.
          </Step>
          <Step title="Verify its work">
            Open the app in a private window and confirm you’re redirected to{" "}
            <Code>{origin}/gate/&lt;slug&gt;</Code>. Complete the OTP + terms
            flow with an invited email, then check{" "}
            <UiPath>Sessions</UiPath> for your live session. If the redirect
            doesn’t fire, check the env vars loaded and that the middleware
            file is at the project root.
          </Step>
        </Steps>

        {/* ---------------------------------------------------------- */}
        <GuideHeading id="customize-terms" time="~5 min">
          4. Customize your Terms of Access
        </GuideHeading>
        <P>
          Every PoC starts with the standard protective template — including
          the “no reuse without engagement” clause. You can keep it, tune it,
          or replace it entirely.
        </P>
        <Steps>
          <Step title="Open the Terms tab">
            <UiPath>Dashboard → your PoC → Terms</UiPath>. Two modes:{" "}
            <strong className="text-ink-900">Template</strong> (the standard
            terms with your PoC’s details substituted in) or{" "}
            <strong className="text-ink-900">Custom</strong> (your own legal
            text, verbatim).
          </Step>
          <Step title="Use placeholders anywhere">
            Both modes resolve the same placeholders, auto-filled from your
            PoC’s fields:
            <div className="mt-3 flex flex-wrap gap-2">
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
          </Step>
          <Step title="Check the live preview">
            The Terms tab renders the fully resolved text as evaluators will
            see it — what’s previewed is byte-for-byte what gets signed,
            hashed and put in the PDF.
          </Step>
          <Step title="Understand version bumps">
            Editing the text under the{" "}
            <strong className="text-ink-900">same version</strong> applies
            only to future signers. Bumping the{" "}
            <strong className="text-ink-900">version</strong> forces every
            evaluator to re-accept before their next request goes through.
            Tick the optional{" "}
            <strong className="text-ink-900">
              “revoke all live sessions now”
            </strong>{" "}
            checkbox when the change is material and you want re-acceptance
            immediately, not at next revalidation.
          </Step>
          <Step title="Know where signed copies live">
            Every acceptance is recorded in{" "}
            <UiPath>Dashboard → your PoC → Signatures</UiPath> (with
            timestamp, IP, user agent and the SHA-256 hash of the exact
            text), and a signed PDF certificate is emailed to the signer.
          </Step>
        </Steps>

        {/* ---------------------------------------------------------- */}
        <GuideHeading id="manage-access" time="~5 min">
          5. Invite, remove and revoke
        </GuideHeading>
        <P>
          Access control day-to-day: who can log in, who’s logged in right
          now, and the levers you pull when either needs to change.
        </P>
        <Steps>
          <Step title="Add evaluators">
            <UiPath>Dashboard → your PoC → Evaluators</UiPath> → add their
            email. Only these addresses ever receive a login code. Free
            includes 3 seats per PoC; Pro (US$39/mo) is unlimited.
          </Step>
          <Step title="Disable a seat">
            Disabling an evaluator blocks their{" "}
            <strong className="text-ink-900">next login</strong> — they can no
            longer request a code. Their current session (if any) keeps
            running until it expires or you revoke it.
          </Step>
          <Step title="Revoke sessions">
            <UiPath>Dashboard → your PoC → Sessions</UiPath> lists every live
            session with a per-session <strong className="text-ink-900">Revoke</strong>{" "}
            and a <strong className="text-ink-900">Revoke all</strong>. The
            SDK revalidates with POCX every minute, so a revocation bites in
            the protected app within ~60 seconds.
          </Step>
          <Step title="Pause the whole PoC">
            <UiPath>Settings → Pause</UiPath> blocks new logins{" "}
            <em>and</em> live session validation in one switch — the demo is
            dark until you unpause. Session TTL, idle timeout and OTP expiry
            are configurable in the same tab.
          </Step>
          <Step title="Rotate the secret">
            When a contractor with env-file access leaves,{" "}
            <UiPath>Settings → Rotate secret</UiPath> issues a new{" "}
            <Code>POCX_SECRET</Code>; exchanges signed with the old one stop
            working immediately. Update your app’s environment and redeploy.
          </Step>
          <Step title="Archive when it's over">
            <UiPath>Settings → Archive</UiPath> retires the PoC once the
            evaluation ends. Records — signatures included — stay on file.
          </Step>
        </Steps>

        {/* ---------------------------------------------------------- */}
        <GuideHeading id="evidence" time="~5 min">
          6. Your evidence trail (Pro)
        </GuideHeading>
        <P>
          If a client ever ships something suspiciously familiar, what you
          want is a record. POCX keeps one from day one on every plan; the
          Pro plan unlocks the view.
        </P>
        <Steps>
          <Step title="What the audit log captures">
            Every OTP request and denial, every login, every terms signature,
            every revocation — each with actor, timestamp and context. Add{" "}
            <Code>logEvents: true</Code> to <Code>createPocxGate()</Code> and
            in-app <Code>page_view</Code> events stream in too, showing which
            screens each evaluator actually opened.
          </Step>
          <Step title="Filter and export">
            <UiPath>Dashboard → your PoC → Audit</UiPath> filters by
            evaluator and event type, and exports the lot as CSV for your
            records — or your lawyer’s.
          </Step>
          <Step title="How the pieces fit together">
            The signature record proves <em>who</em> agreed (OTP-verified
            email) and <em>to what</em> (the SHA-256 hash pins the exact
            text; the signed PDF is human-readable proof of the same string).
            The audit log proves <em>what they did</em> after agreeing. If
            you ever need to demonstrate what was agreed and accessed, the
            three line up on their own.
          </Step>
          <Step title="Recording starts before you upgrade">
            Events are recorded from day one on all plans — upgrading to Pro
            later unlocks the full history, not just events after the
            upgrade.
          </Step>
        </Steps>

        {/* ---------------------------------------------------------- */}
        <div className="mt-20 rounded-xl border border-ink-200 bg-white p-8">
          <h2 className="text-xl font-semibold tracking-tight text-ink-900">
            Still stuck?
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
            The{" "}
            <Link
              href="/faq"
              className="font-semibold text-brand hover:underline"
            >
              FAQ
            </Link>{" "}
            answers the common “what happens if…” questions, and the{" "}
            <Link
              href="/docs"
              className="font-semibold text-brand hover:underline"
            >
              docs
            </Link>{" "}
            cover the full configuration reference and security model.
          </p>
        </div>
      </div>
    </div>
  );
}
