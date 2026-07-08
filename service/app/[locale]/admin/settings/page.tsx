import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import {
  getNudgeConfig,
  renderNudge,
  NUDGE_STAGES,
  NUDGE_STAGE_LABELS,
  NUDGE_PLACEHOLDERS,
} from "@/lib/mail/nudge-templates";
import SettingsClient from "./settings-client";

export const metadata: Metadata = { title: "Settings · POCX Ops" };

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await requireAdmin();
  await params; // English-only; locale ignored.

  const config = getNudgeConfig();

  const stages = NUDGE_STAGES.map((stage) => {
    const template = config.stages[stage];
    const preview = renderNudge(template, {
      firstName: "Saad",
      workspace: "Acme Pte Ltd",
      signature: config.signature,
    });
    return {
      stage,
      label: NUDGE_STAGE_LABELS[stage],
      subject: template.subject,
      body: template.body,
      previewSubject: preview.subject,
      previewBody: preview.body,
    };
  });

  return (
    <SettingsClient
      signature={config.signature}
      stages={stages}
      placeholders={[...NUDGE_PLACEHOLDERS]}
    />
  );
}
