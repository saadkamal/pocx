import Link from "next/link";
import { LegalPage, LegalSection, P, Bullets } from "../legal-primitives";

export function PrivacyContentEn() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated="Last updated: 9 July 2026"
      intro={
        <>
          This policy explains what <strong>Haxo Pty Ltd</strong>,
          the operator of the hosted POCX service at <strong>pocx.dev</strong>,
          collects and why. The short version: we collect the minimum an
          access-control product needs — identities, signatures and access
          events — we never sell data, and we run no advertising trackers. If
          you self-host POCX, nothing described here reaches us at all.
        </>
      }
    >
      <LegalSection id="who-we-are" title="1. Who we are">
        <P>
          The hosted POCX service is provided by Haxo Pty Ltd, an Australian
          company (&ldquo;Haxo&rdquo;, &ldquo;we&rdquo;). For anything
          privacy-related, contact{" "}
          <a
            href="mailto:pocx@haxo.com.au"
            className="font-semibold text-brand hover:underline"
          >
            pocx@haxo.com.au
          </a>
          .
        </P>
      </LegalSection>

      <LegalSection id="two-roles" title="2. Two kinds of people, two roles">
        <P>
          POCX handles data about two groups, and our role differs for each:
        </P>
        <Bullets
          items={[
            <>
              <strong>Operators</strong> (you, the workspace owner and your
              team): we decide how this data is handled — we are the data
              controller.
            </>,
            <>
              <strong>Viewers / evaluators</strong> (the people your demos are
              shared with): we process their data on your instructions, as
              your processor. You are responsible for having a lawful basis to
              invite them.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="what-we-collect" title="3. What we collect">
        <Bullets
          items={[
            <>
              <strong>Operator accounts</strong> — name, email address,
              workspace name, and one-time login codes (stored only as
              hashes; there are no passwords).
            </>,
            <>
              <strong>Viewer identity &amp; signatures</strong> — invited email
              addresses, OTP request metadata, and for each e-signature: a
              SHA-256 hash of the exact terms text, timestamp, IP address and
              user agent, plus the PDF certificate we email to the signer.
              This evidence is the product — it is what makes a signature
              defensible.
            </>,
            <>
              <strong>Access events</strong> — logins, denials, revocations
              and (if you enable SDK event logging) page-view events from
              your protected app.
            </>,
            <>
              <strong>Billing</strong> — handled by Stripe; we never see or
              store card numbers.
            </>,
            <>
              <strong>Operational logs</strong> — short-lived server logs (IP,
              user agent, request path) for security and debugging.
            </>,
          ]}
        />
        <P>
          We deliberately see nothing of your demo itself: once a viewer is
          through the gate, traffic goes directly to your application and does
          not pass through POCX.
        </P>
      </LegalSection>

      <LegalSection id="how-we-use" title="4. How we use it">
        <Bullets
          items={[
            "to run the gate: verify identities, record signatures, enforce sessions and plan limits;",
            "to send transactional email (login codes, signature certificates, product notices) — never marketing without consent;",
            "to keep the service secure (rate limiting, abuse and fraud prevention);",
            "to bill Pro workspaces via Stripe.",
          ]}
        />
        <P>
          We do not sell personal information, and we do not use it for
          advertising.
        </P>
      </LegalSection>

      <LegalSection id="cookies" title="5. Cookies">
        <P>POCX sets only functional cookies:</P>
        <Bullets
          items={[
            "session cookies (HMAC-sealed) for operator and gate logins;",
            "a locale cookie (pocx_locale) remembering your language choice.",
          ]}
        />
        <P>There are no analytics or advertising cookies.</P>
      </LegalSection>

      <LegalSection id="subprocessors" title="6. Who else touches the data">
        <P>We use a small set of subprocessors to run the service:</P>
        <Bullets
          items={[
            <>
              <strong>Railway</strong> — cloud hosting (application and
              database);
            </>,
            <>
              <strong>Resend</strong> — transactional email delivery (login
              codes, certificates) and inbound support email;
            </>,
            <>
              <strong>Stripe</strong> — payments.
            </>,
            <>
              <strong>MonGPT</strong> — the AI support chat on our marketing
              pages (it processes the messages a visitor types into that
              chat; it is not present on hosted gates or the dashboard).
            </>,
          ]}
        />
        <P>
          These providers may store data outside Australia (typically in the
          United States). We share only what each needs to do its job.
        </P>
      </LegalSection>

      <LegalSection id="retention" title="7. Retention">
        <Bullets
          items={[
            "Signature evidence and audit events are kept for as long as the workspace exists — they are the record your protection relies on.",
            "One-time login codes expire within minutes and are stored only as hashes.",
            "Operational logs are kept briefly and rotated.",
            "When a workspace is deleted, its data is removed from production systems within 30 days (backups age out on their own schedule).",
          ]}
        />
      </LegalSection>

      <LegalSection id="security" title="8. Security">
        <P>
          Login codes are hashed, single-use and rate-limited; sessions are
          HMAC-sealed and revocable; access is workspace-scoped and re-checked
          on every mutation. Security reports go to{" "}
          <a
            href="mailto:pocx@haxo.com.au"
            className="font-semibold text-brand hover:underline"
          >
            pocx@haxo.com.au
          </a>{" "}
          — see the security policy in our GitHub repository.
        </P>
      </LegalSection>

      <LegalSection id="your-rights" title="9. Your rights">
        <P>
          We handle personal information in accordance with the Australian
          Privacy Act 1988 (Cth) and the Australian Privacy Principles. Where
          the GDPR or similar laws apply to you, you have the corresponding
          rights under those laws. You can ask us to access, correct, export
          or delete personal information by emailing{" "}
          <a
            href="mailto:pocx@haxo.com.au"
            className="font-semibold text-brand hover:underline"
          >
            pocx@haxo.com.au
          </a>
          . If you are a viewer on someone else&rsquo;s demo, we may refer
          your request to the workspace owner, since the signature record
          exists on their instructions.
        </P>
      </LegalSection>

      <LegalSection id="self-host" title="10. Self-hosting">
        <P>
          If you run the open-source version on your own infrastructure, Haxo
          receives nothing: no accounts, no telemetry, no phone-home. This
          policy applies only to the hosted service at pocx.dev.
        </P>
      </LegalSection>

      <LegalSection id="changes" title="11. Changes">
        <P>
          We will update this policy as the service evolves and note the date
          at the top. Material changes are announced to workspace owners by
          email.
        </P>
      </LegalSection>

      <LegalSection id="contact" title="12. Contact">
        <P>
          Privacy questions and requests:{" "}
          <a
            href="mailto:pocx@haxo.com.au"
            className="font-semibold text-brand hover:underline"
          >
            pocx@haxo.com.au
          </a>
          . See also our{" "}
          <Link href="/terms" className="font-semibold text-brand hover:underline">
            Terms of Service
          </Link>
          .
        </P>
      </LegalSection>
    </LegalPage>
  );
}
