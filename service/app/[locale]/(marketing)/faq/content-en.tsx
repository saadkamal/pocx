import Link from "next/link";
import { FaqSections, FaqCta, type Section } from "./primitives";

const SECTIONS: Section[] = [
  {
    title: "Getting started",
    items: [
      {
        q: "Do evaluators need to create accounts?",
        a: "No. There are no evaluator accounts and no passwords anywhere. You allowlist their email on the PoC; they enter it at the gate and receive a 6-digit one-time code. That's the entire login.",
      },
      {
        q: "How long does integration take?",
        a: "Minutes. Three env vars copied from the PoC's Overview tab, one dependency-free TypeScript file curled into your repo, and a three-line middleware. The docs quickstart walks it end to end.",
      },
      {
        q: "Does POCX work with my stack?",
        a: "Next.js 12 through 16, Express, and any Node server that can run a middleware chain. The SDK is a single TypeScript file with zero dependencies, built on Web APIs so it runs on Node and edge runtimes alike.",
      },
      {
        q: "Can a coding agent set it up for me?",
        a: (
          <>
            Yes — that&rsquo;s the recommended path. POCX publishes
            agent-executable instructions at{" "}
            <a
              href="/llms.txt"
              className="font-mono font-semibold text-brand hover:underline"
            >
              /llms.txt
            </a>
            . Paste one prompt into Claude Code, Codex or Cursor and it wires
            the env vars, the SDK file and the middleware itself. See the{" "}
            <Link
              href="/tutorials#coding-agent"
              className="font-semibold text-brand hover:underline"
            >
              coding-agent tutorial
            </Link>
            .
          </>
        ),
      },
    ],
  },
  {
    title: "Security & privacy",
    items: [
      {
        q: "Does POCX see my app's code or data?",
        a: "No. POCX only handles the front door: identity, terms and sessions. Once an evaluator is through the gate, their traffic goes straight to your app — nothing proxies through POCX.",
      },
      {
        q: "How are login codes stored?",
        a: "Codes are SHA-256 hashed at rest, single-use, expire quickly, and requests are rate-limited. Five failed attempts lock the email out. And because there are no passwords, there is no password database to breach.",
      },
      {
        q: "What if my POCX secret leaks?",
        a: "Rotate it in the PoC's Settings tab. A new secret is issued immediately and exchanges signed with the old secret stop working at once. Update your app's environment and redeploy — evaluators don't notice a thing.",
      },
      {
        q: "Can sessions be hijacked?",
        a: "Sessions live in HttpOnly cookies on your own domain, HMAC-signed so they can't be forged, and revocable server-side. The SDK revalidates against POCX every minute, so a stolen token you revoke dies within ~60 seconds.",
      },
      {
        q: "What happens if POCX is unreachable?",
        a: "Evaluators who are already authenticated keep working — their token is verified locally by the SDK. New logins wait until POCX is back. If the SDK can't even resolve its configuration, it fails closed rather than open.",
      },
    ],
  },
  {
    title: "Terms & signatures",
    items: [
      {
        q: "Are the e-signatures legally meaningful?",
        a: "Each signature records the signer's OTP-verified email identity, a timestamp, IP address and user agent, plus a SHA-256 hash of the exact terms text shown — and a signed PDF certificate is emailed to the signer. That's standard electronic-signature evidence. (This is product information, not legal advice.)",
      },
      {
        q: "Can I use my own legal text?",
        a: "Yes. Switch the PoC's Terms tab to custom mode and paste your text verbatim. Optional {{PLACEHOLDERS}} — owner entity, client entity, purpose and so on — still resolve if you use them.",
      },
      {
        q: "What happens when I edit the terms?",
        a: "Editing under the same version applies only to new signers — existing acceptances stand. Bumping the version forces every evaluator to re-accept before their next request is allowed through, with an optional checkbox to revoke all live sessions immediately.",
      },
      {
        q: "Where do signed PDFs go?",
        a: "Two places: emailed to the signer as a PDF certificate the moment they sign, and stored in the PoC's Signatures tab where you can download every record alongside its timestamp, IP, user agent and terms hash.",
      },
    ],
  },
  {
    title: "Evaluator experience",
    items: [
      {
        q: "What does an evaluator actually see?",
        a: "A gate page branded with your PoC's name and color. They enter their email, type the 6-digit code from their inbox, read and sign the Terms of Access, and land in your app. First visit takes under a minute; return visits skip straight through while their session is live.",
      },
      {
        q: "The code never arrived — now what?",
        a: 'Check spam first. Codes expire after about 10 minutes, so use "Resend code" for a fresh one. If you self-host POCX without a RESEND_API_KEY, mail runs in mock mode — the PoC owner can read every outbound message in the dashboard\'s Emails tab.',
      },
      {
        q: 'It says "you\'re not on the access list"?',
        a: "Only allowlisted emails receive codes. Ask the PoC owner to add your exact address — including the right domain and any plus-alias — in the Evaluators tab.",
      },
      {
        q: "How long do sessions last?",
        a: "By default a session lives 24 hours with a 3-hour idle timeout. Both — plus OTP expiry — are configurable per PoC in Settings, and the owner can revoke any session sooner.",
      },
    ],
  },
  {
    title: "Plans & billing",
    items: [
      {
        q: "What do I get for free?",
        a: "Up to 3 evaluator seats per PoC with the full product: hosted branded gate, email OTP, e-signed Terms of Access with PDF certificates, and session control with instant revoke. No card required.",
      },
      {
        q: "What does Pro add?",
        a: "US$39 per workspace per month: unlimited evaluator seats and the full audit trail — every OTP request, login, signature and revocation, plus optional in-app page-view events, with CSV export.",
      },
      {
        q: "What happens if I downgrade?",
        a: "Nothing breaks. Gates keep working, evaluators above the 3-seat limit keep their access — you just can't add more until you're back under the cap. The audit view locks, but events keep recording underneath, so upgrading again restores the full history.",
      },
      {
        q: "How do I cancel?",
        a: "Downgrade anytime from the dashboard. No lock-in, no exit interview — your PoCs stay protected within Free limits.",
      },
    ],
  },
];

export function FaqContentEn() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
      <p className="eyebrow">FAQ</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink-900">
        Frequently asked questions
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-600">
        Everything people ask before — and after — putting POCX in front of a
        proof of concept.
      </p>

      <FaqSections sections={SECTIONS} />

      <FaqCta
        heading="Question answered? Protect your PoC."
        body={
          <>
            Start free with 3 evaluator seats, or follow the step-by-step
            tutorials — the first gate takes about five minutes.
          </>
        }
        primaryHref="/signup"
        primaryLabel="Start free"
        secondaryHref="/tutorials"
        secondaryLabel="Browse the tutorials"
      />
    </div>
  );
}
