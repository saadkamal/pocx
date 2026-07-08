import Link from "next/link";
import { LegalPage, LegalSection, P, Bullets } from "../legal-primitives";

export function TermsContentEn() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      updated="Last updated: 9 July 2026"
      intro={
        <>
          These terms govern your use of the hosted POCX service at{" "}
          <strong>pocx.dev</strong>, which is owned and operated by{" "}
          <strong>Haxo Pty Ltd</strong> (Australia). If you self-host the
          open-source version, that use is governed by the AGPL-3.0 license in
          the repository, not by these terms. Note these Terms of Service are
          different from the per-demo <em>Terms of Access</em> your viewers
          sign — see section 5.
        </>
      }
    >
      <LegalSection id="who-we-are" title="1. Who we are">
        <P>
          POCX and the hosted service at pocx.dev are owned, hosted and
          provided by Haxo Pty Ltd, a company incorporated in Australia
          (&ldquo;Haxo&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). You can
          reach us at{" "}
          <a
            href="mailto:pocx@haxo.com.au"
            className="font-semibold text-brand hover:underline"
          >
            pocx@haxo.com.au
          </a>
          .
        </P>
      </LegalSection>

      <LegalSection id="the-service" title="2. The service">
        <P>
          POCX is an access layer for demos, prototypes and proof-of-concept
          applications: an invite-only email-code gate, e-signed Terms of
          Access, revocable sessions and an audit trail, placed in front of an
          application you control. We provide the front door; your application
          and its content remain yours and run on your infrastructure.
        </P>
        <P>
          The software is open source (AGPL-3.0, SDK under MIT). These terms
          apply only to the hosted service we operate at pocx.dev. Self-hosted
          deployments are not operated by us and we are not responsible for
          them.
        </P>
      </LegalSection>

      <LegalSection id="accounts" title="3. Accounts and workspaces">
        <Bullets
          items={[
            "You must provide a working email address you control — it is your identity on POCX (we use one-time codes, not passwords).",
            "You are responsible for activity in your workspace, including team members you invite.",
            "You must be at least 18 and able to form a binding contract, and use the service on behalf of a business or professional activity.",
          ]}
        />
      </LegalSection>

      <LegalSection id="acceptable-use" title="4. Acceptable use">
        <P>You agree not to:</P>
        <Bullets
          items={[
            "use POCX to gate unlawful content, malware, phishing pages, or content that infringes someone else's rights;",
            "invite viewers whose email addresses you have no right to use, or use the gate to send unsolicited email;",
            "attempt to bypass, probe or overload the gate, other tenants' workspaces, or plan limits (good-faith security research reported responsibly per our security policy is welcome);",
            "resell or offer the hosted service under your own brand without our written agreement.",
          ]}
        />
      </LegalSection>

      <LegalSection id="terms-of-access" title="5. Your Terms of Access and your viewers">
        <P>
          The Terms of Access that viewers e-sign before entering your demo are
          an agreement <strong>between you and your viewer</strong>. We are not
          a party to it. We record the evidence — the signed text&rsquo;s
          SHA-256 hash, the verified email, timestamp, IP address and user
          agent — and issue a PDF certificate, but we do not review or enforce
          your terms.
        </P>
        <P>
          The standard template we provide is a starting point, not legal
          advice. Whether a given clause is enforceable in your jurisdiction is
          a question for your lawyer.
        </P>
        <P>
          You are responsible for having a lawful basis to invite your viewers
          and for the content of any custom terms you present through POCX.
        </P>
      </LegalSection>

      <LegalSection id="billing" title="6. Plans, billing and cancellation">
        <Bullets
          items={[
            "The Free plan is free. Pro is billed per workspace, monthly or yearly, via Stripe. Prices are shown on the pricing page and may change with notice — never mid-billing-period.",
            "You can cancel anytime from the dashboard; access continues to the end of the period you have paid for. After that your gates keep working within Free limits — viewers are not locked out.",
            "Except where required by law, payments are non-refundable once the billing period has started.",
          ]}
        />
      </LegalSection>

      <LegalSection id="ip" title="7. Intellectual property">
        <P>
          Your demos, your content and your data stay yours. The POCX software
          is licensed under AGPL-3.0 (service) and MIT (SDK). &ldquo;POCX&rdquo;
          and the POCX logo are trademarks of Haxo Pty Ltd — you may self-host
          and modify the software under its license, but you may not offer a
          derived product or service under the POCX name without written
          permission.
        </P>
      </LegalSection>

      <LegalSection id="availability" title="8. Availability and disclaimers">
        <P>
          We run the hosted service with care, but it is provided &ldquo;as
          is&rdquo; and &ldquo;as available&rdquo;. We do not guarantee
          uninterrupted availability, and scheduled or emergency maintenance
          may occur. POCX is an access-control layer — it makes taking your
          work accountable and evidenced; no system can make copying
          physically impossible.
        </P>
      </LegalSection>

      <LegalSection id="liability" title="9. Liability">
        <P>
          Nothing in these terms excludes rights you have under the Australian
          Consumer Law or other laws that cannot be excluded. To the maximum
          extent permitted by law, our total liability arising out of the
          service is limited to the amount you paid us in the twelve months
          before the claim, and we are not liable for indirect or
          consequential loss, loss of profits, or loss of business
          opportunities — including opportunities connected to a demo gated
          with POCX.
        </P>
      </LegalSection>

      <LegalSection id="termination" title="10. Suspension and termination">
        <P>
          You may delete your workspace at any time. We may suspend or
          terminate a workspace that materially breaches these terms (we will
          tell you why and, where reasonable, give you a chance to fix it
          first). On termination you can request an export of your audit data
          within 30 days.
        </P>
      </LegalSection>

      <LegalSection id="changes" title="11. Changes to these terms">
        <P>
          We may update these terms as the service evolves. For material
          changes we will notify workspace owners by email at least 14 days
          before they take effect. Continuing to use the service after that
          date means you accept the updated terms.
        </P>
      </LegalSection>

      <LegalSection id="law" title="12. Governing law">
        <P>
          These terms are governed by the laws of Australia, and disputes are
          subject to the exclusive jurisdiction of the Australian courts
          competent for Haxo Pty Ltd&rsquo;s registered office.
        </P>
      </LegalSection>

      <LegalSection id="contact" title="13. Contact">
        <P>
          Questions about these terms:{" "}
          <a
            href="mailto:pocx@haxo.com.au"
            className="font-semibold text-brand hover:underline"
          >
            pocx@haxo.com.au
          </a>
          . See also our{" "}
          <Link href="/privacy" className="font-semibold text-brand hover:underline">
            Privacy Policy
          </Link>
          .
        </P>
      </LegalSection>
    </LegalPage>
  );
}
