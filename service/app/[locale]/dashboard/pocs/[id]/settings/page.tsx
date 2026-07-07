import { notFound } from "next/navigation";
import { pocForWorkspace, requireOperator } from "@/lib/auth/operator";
import { resolveLocale } from "@/lib/i18n/dashboard";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const ctx = await requireOperator();
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale(rawLocale);
  const poc = pocForWorkspace(ctx, id);
  if (!poc) notFound();

  return (
    <SettingsClient
      pocId={poc.id}
      locale={locale}
      poc={{
        name: poc.name,
        ownerEntity: poc.ownerEntity,
        ownerRegNo: poc.ownerRegNo,
        clientEntity: poc.clientEntity,
        purpose: poc.purpose,
        supportEmail: poc.supportEmail,
        brandColor: poc.brandColor,
        appUrl: poc.appUrl,
        callbackPath: poc.callbackPath,
        sessionTtlHours: poc.sessionTtlHours,
        idleTimeoutHours: poc.idleTimeoutHours,
        otpTtlMinutes: poc.otpTtlMinutes,
        status: poc.status === "paused" ? "paused" : "active",
      }}
    />
  );
}
