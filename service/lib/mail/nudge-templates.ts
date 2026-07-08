import "server-only";
import type { LifecycleStage } from "@/lib/db/platform";
import { getJsonSetting, setJsonSetting } from "@/lib/db/settings";
import { pocxOrigin } from "@/lib/utils";

/**
 * Onboarding nudge email copy — warm, first-person founder outreach.
 *
 * Every nudge is a template with {{placeholders}}. The owner can override
 * any stage's subject/body and the signature from /admin/settings; saved
 * values are merged over these defaults field-by-field, so a partial edit
 * never loses the rest. Stored under the `nudge_config` setting key.
 *
 * The stages that get a nudge: no_poc, no_evaluators, not_connected,
 * no_logins, dormant. "active" workspaces are never nudged.
 */

export type NudgeStage = Exclude<LifecycleStage, "active">;
export const NUDGE_STAGES: NudgeStage[] = [
  "no_poc",
  "no_evaluators",
  "not_connected",
  "no_logins",
  "dormant",
];

export const NUDGE_STAGE_LABELS: Record<NudgeStage, string> = {
  no_poc: "Signed up, no PoC yet",
  no_evaluators: "PoC created, no evaluators invited",
  not_connected: "Evaluators invited, app not connected",
  no_logins: "Connected, no evaluator has logged in",
  dormant: "Gone quiet (no activity for 14+ days)",
};

export type NudgeTemplate = { subject: string; body: string };
export type NudgeConfig = {
  signature: string;
  stages: Record<NudgeStage, NudgeTemplate>;
};

/** Placeholders available in every template (shown in the editor UI). */
export const NUDGE_PLACEHOLDERS = [
  "{{first_name}}",
  "{{workspace}}",
  "{{signature}}",
  "{{new_poc_url}}",
  "{{dashboard_url}}",
  "{{support_url}}",
  "{{docs_url}}",
  "{{tutorials_url}}",
] as const;

export const DEFAULT_SIGNATURE = `Saad
Founder, POCX
pocx.dev`;

export const DEFAULT_NUDGE_TEMPLATES: Record<NudgeStage, NudgeTemplate> = {
  no_poc: {
    subject: "Anything I can help with getting started?",
    body: `Hi {{first_name}},

Saad here — I'm the founder of POCX. I saw you created the {{workspace}} workspace, so first off: thank you for giving it a try, it genuinely means a lot.

I noticed you haven't set up your first PoC yet. No pressure at all — I just wanted to check in, because it really does only take a minute:

1. Create the PoC → {{new_poc_url}}
2. Add the emails of the people who'll be reviewing it
3. Drop three env vars and one file into your app (or paste one line into your coding agent and let it do the rest)

If anything's unclear, or you'd rather I just walk you through it, hit reply to this email or drop me a note here → {{support_url}}. I read every message myself.

Rooting for you,
{{signature}}`,
  },
  no_evaluators: {
    subject: "Your PoC gate is up — one small step left",
    body: `Hi {{first_name}},

Nice — your PoC on POCX is set up. There's just one thing left before anyone can use it: no one's been invited yet, so there's no one the gate can let in.

Head to your PoC → Evaluators ({{dashboard_url}}) and add the emails of the people reviewing it. My honest tip: add yourself first and do one full login start to finish. It takes two minutes and you'll see the exact experience your client will get, which makes everything after that easier.

Stuck on anything or want a second pair of eyes? I'm right here → {{support_url}}.

Cheers,
{{signature}}`,
  },
  not_connected: {
    subject: "One file to go on your PoC",
    body: `Hi {{first_name}},

You're almost there with your PoC — the evaluators are invited, but your app hasn't checked in with POCX yet, which means the gate isn't actually protecting anything so far.

It's genuinely quick — three env vars and one file, about five minutes. Your PoC's Overview tab has everything ready to copy, including a one-line prompt you can paste straight into Claude Code or Cursor and let the agent wire it up for you.

- Docs: {{docs_url}}
- Step-by-step tutorials: {{tutorials_url}}

And if it's fighting you at all, tell me what you're seeing and I'll help you get unstuck → {{support_url}}.

Talk soon,
{{signature}}`,
  },
  no_logins: {
    subject: "Ready to share your PoC?",
    body: `Hi {{first_name}},

Good news — your PoC is protected and connected. The only thing left is getting the link into your reviewers' hands, and so far no one has signed in.

If you haven't sent it out yet, the Evaluators tab has a "Send invite" button that emails each person a short walkthrough. If you have sent it and someone's stuck, nine times out of ten it's the code email landing in spam — happy to help you check.

Either way, I'm one reply away → {{support_url}}.

Best,
{{signature}}`,
  },
  dormant: {
    subject: "Checking in on your PoC",
    body: `Hi {{first_name}},

Just checking in — things have been quiet on your PoC for a couple of weeks. If the review wrapped up, congratulations! A couple of housekeeping ideas for when you have a moment:

- Pause or archive the PoC in Settings so the gate stops accepting new logins
- Grab your evidence any time — the signatures and full audit trail live in your dashboard

And if you're kicking off something new, or something got in the way, I'd love to hear about it → {{support_url}}. Genuinely, feedback from early users like you shapes what I build next.

Thanks again,
{{signature}}`,
  },
};

/** The effective config = defaults with any saved overrides merged in. */
export function getNudgeConfig(): NudgeConfig {
  const saved = getJsonSetting<Partial<NudgeConfig>>("nudge_config", {});
  const stages = {} as Record<NudgeStage, NudgeTemplate>;
  for (const stage of NUDGE_STAGES) {
    const def = DEFAULT_NUDGE_TEMPLATES[stage];
    const override = saved.stages?.[stage];
    stages[stage] = {
      subject: override?.subject?.trim() ? override.subject : def.subject,
      body: override?.body?.trim() ? override.body : def.body,
    };
  }
  return {
    signature: saved.signature?.trim() ? saved.signature : DEFAULT_SIGNATURE,
    stages,
  };
}

export function saveNudgeConfig(config: NudgeConfig): void {
  setJsonSetting("nudge_config", config);
}

export function resetNudgeConfig(): void {
  setJsonSetting("nudge_config", {});
}

/** Turn a full email address / display name into a friendly first name. */
export function friendlyFirstName(
  name: string | null | undefined,
  email: string,
): string {
  const fromName = name?.trim().split(/\s+/)[0];
  if (fromName && /^[\p{L}'-]+$/u.test(fromName)) return fromName;
  // Fall back to the local-part if it looks like a name, else "there".
  const local = email.split("@")[0]?.replace(/[._-].*$/, "");
  if (local && /^[a-z]{2,}$/i.test(local)) {
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return "there";
}

/** Render a resolved template into { subject, body } for one recipient. */
export function renderNudge(
  template: NudgeTemplate,
  ctx: { firstName: string; workspace: string; signature: string },
): { subject: string; body: string } {
  const o = pocxOrigin();
  const vars: Record<string, string> = {
    first_name: ctx.firstName,
    workspace: ctx.workspace,
    signature: ctx.signature,
    new_poc_url: `${o}/dashboard/new`,
    dashboard_url: `${o}/dashboard`,
    support_url: `${o}/dashboard/support`,
    docs_url: `${o}/docs`,
    tutorials_url: `${o}/tutorials`,
  };
  const sub = (s: string) =>
    s.replace(/\{\{(\w+)\}\}/g, (_, k: string) =>
      k in vars ? vars[k] : `{{${k}}}`,
    );
  return { subject: sub(template.subject), body: sub(template.body) };
}
