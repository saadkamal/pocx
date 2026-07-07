"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  archivePocAction,
  rotateSecretAction,
  updatePocAction,
  type ActionResult,
} from "@/app/[locale]/dashboard/actions";
import {
  Card,
  CardTitle,
  Label,
  buttonCn,
  inputCn,
} from "@/components/ui";
import type { Locale } from "@/lib/i18n/locales";
import { dashboardDict, type DashboardStrings } from "@/lib/i18n/dashboard";

export type PocSettings = {
  name: string;
  ownerEntity: string;
  ownerRegNo: string | null;
  clientEntity: string | null;
  purpose: string | null;
  supportEmail: string | null;
  brandColor: string;
  appUrl: string | null;
  callbackPath: string;
  sessionTtlHours: number;
  idleTimeoutHours: number;
  otpTtlMinutes: number;
  status: "active" | "paused";
};

type SettingsStrings = DashboardStrings["poc"]["settings"];

function ResultMessage({
  result,
  savedFallback,
}: {
  result: ActionResult | null;
  savedFallback: string;
}) {
  if (!result) return null;
  if ("error" in result) {
    return <p className="text-sm font-medium text-danger">{result.error}</p>;
  }
  return (
    <p className="text-sm font-medium text-success">
      {result.message ?? savedFallback}
    </p>
  );
}

/** One independently-submitting settings form → updatePocAction. */
function SettingsForm({
  pocId,
  title,
  description,
  t,
  children,
}: {
  pocId: string;
  title: string;
  description?: string;
  t: SettingsStrings;
  children: ReactNode;
}) {
  const router = useRouter();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(fd: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await updatePocAction(pocId, fd);
      setResult(res);
      if ("ok" in res) router.refresh();
    });
  }

  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      {description ? (
        <p className="mb-4 text-sm text-ink-500">{description}</p>
      ) : null}
      <form action={submit} className="space-y-4">
        {children}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className={buttonCn("primary", "sm")}
          >
            {pending ? t.saving : t.save}
          </button>
          <ResultMessage result={result} savedFallback={t.savedFallback} />
        </div>
      </form>
    </Card>
  );
}

export function SettingsClient({
  pocId,
  poc,
  locale,
}: {
  pocId: string;
  poc: PocSettings;
  locale: Locale;
}) {
  const router = useRouter();
  const t = dashboardDict[locale].poc.settings;
  const [brandColor, setBrandColor] = useState(poc.brandColor);
  const [dangerResult, setDangerResult] = useState<ActionResult | null>(null);
  const [dangerPending, startDanger] = useTransition();

  function rotateSecret() {
    if (!window.confirm(t.rotateConfirm)) {
      return;
    }
    setDangerResult(null);
    startDanger(async () => {
      const res = await rotateSecretAction(pocId);
      setDangerResult(res);
      if ("ok" in res) router.refresh();
    });
  }

  function archive() {
    if (!window.confirm(t.archiveConfirm)) {
      return;
    }
    setDangerResult(null);
    startDanger(async () => {
      // Redirects to /dashboard on success — Next handles it.
      const res = await archivePocAction(pocId);
      if (res && "error" in res) setDangerResult(res);
    });
  }

  return (
    <div className="space-y-6">
      <SettingsForm
        pocId={pocId}
        title={t.identityTitle}
        description={t.identityDesc}
        t={t}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="set-name">{t.nameLabel}</Label>
            <input
              id="set-name"
              name="name"
              type="text"
              required
              defaultValue={poc.name}
              className={inputCn}
            />
          </div>
          <div>
            <Label htmlFor="set-owner">{t.ownerLabel}</Label>
            <input
              id="set-owner"
              name="ownerEntity"
              type="text"
              required
              defaultValue={poc.ownerEntity}
              className={inputCn}
            />
          </div>
          <div>
            <Label htmlFor="set-regno">{t.regNoLabel}</Label>
            <input
              id="set-regno"
              name="ownerRegNo"
              type="text"
              defaultValue={poc.ownerRegNo ?? ""}
              className={inputCn}
            />
          </div>
          <div>
            <Label htmlFor="set-client">{t.clientLabel}</Label>
            <input
              id="set-client"
              name="clientEntity"
              type="text"
              defaultValue={poc.clientEntity ?? ""}
              className={inputCn}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="set-purpose">{t.purposeLabel}</Label>
          <textarea
            id="set-purpose"
            name="purpose"
            rows={3}
            defaultValue={poc.purpose ?? ""}
            placeholder={t.purposePlaceholder}
            className={inputCn}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="set-support">{t.supportEmailLabel}</Label>
            <input
              id="set-support"
              name="supportEmail"
              type="email"
              defaultValue={poc.supportEmail ?? ""}
              className={inputCn}
            />
          </div>
          <div>
            <Label htmlFor="set-color">{t.brandColorLabel}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                aria-label={t.brandColorAria}
                className="h-9 w-12 cursor-pointer rounded-md border border-ink-300 bg-paper p-1"
              />
              <input
                id="set-color"
                name="brandColor"
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                pattern="^#[0-9a-fA-F]{6}$"
                className={`${inputCn} max-w-32 font-mono`}
              />
            </div>
          </div>
        </div>
      </SettingsForm>

      <SettingsForm
        pocId={pocId}
        title={t.appTitle}
        description={t.appDesc}
        t={t}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="set-appurl">{t.appUrlLabel}</Label>
            <input
              id="set-appurl"
              name="appUrl"
              type="url"
              defaultValue={poc.appUrl ?? ""}
              placeholder="https://poc.yourcompany.com"
              className={inputCn}
            />
          </div>
          <div>
            <Label htmlFor="set-callback">{t.callbackLabel}</Label>
            <input
              id="set-callback"
              name="callbackPath"
              type="text"
              required
              defaultValue={poc.callbackPath}
              className={`${inputCn} font-mono`}
            />
            <p className="mt-1.5 text-xs text-ink-500">{t.callbackHelp}</p>
          </div>
        </div>
      </SettingsForm>

      <SettingsForm
        pocId={pocId}
        title={t.sessionTitle}
        description={t.sessionDesc}
        t={t}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="set-ttl">{t.ttlLabel}</Label>
            <input
              id="set-ttl"
              name="sessionTtlHours"
              type="number"
              min={1}
              max={720}
              required
              defaultValue={poc.sessionTtlHours}
              className={inputCn}
            />
            <p className="mt-1.5 text-xs text-ink-500">{t.ttlHelp}</p>
          </div>
          <div>
            <Label htmlFor="set-idle">{t.idleLabel}</Label>
            <input
              id="set-idle"
              name="idleTimeoutHours"
              type="number"
              min={1}
              max={168}
              required
              defaultValue={poc.idleTimeoutHours}
              className={inputCn}
            />
            <p className="mt-1.5 text-xs text-ink-500">{t.idleHelp}</p>
          </div>
          <div>
            <Label htmlFor="set-otp">{t.otpLabel}</Label>
            <input
              id="set-otp"
              name="otpTtlMinutes"
              type="number"
              min={3}
              max={60}
              required
              defaultValue={poc.otpTtlMinutes}
              className={inputCn}
            />
            <p className="mt-1.5 text-xs text-ink-500">{t.otpHelp}</p>
          </div>
        </div>
      </SettingsForm>

      <SettingsForm
        pocId={pocId}
        title={t.availabilityTitle}
        description={t.availabilityDesc}
        t={t}
      >
        <div>
          <Label htmlFor="set-status">{t.statusLabel}</Label>
          <select
            id="set-status"
            name="status"
            defaultValue={poc.status}
            className={`${inputCn} max-w-48`}
          >
            <option value="active">{t.statusActive}</option>
            <option value="paused">{t.statusPaused}</option>
          </select>
        </div>
      </SettingsForm>

      <Card className="border-danger/30">
        <CardTitle className="text-danger">{t.dangerTitle}</CardTitle>
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink-900">
                {t.rotateTitle}
              </p>
              <p className="text-sm text-ink-500">{t.rotateDesc}</p>
            </div>
            <button
              type="button"
              onClick={rotateSecret}
              disabled={dangerPending}
              className={buttonCn("danger", "sm")}
            >
              {t.rotateButton}
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4">
            <div>
              <p className="text-sm font-semibold text-ink-900">
                {t.archiveTitle}
              </p>
              <p className="text-sm text-ink-500">{t.archiveDesc}</p>
            </div>
            <button
              type="button"
              onClick={archive}
              disabled={dangerPending}
              className={buttonCn("danger", "sm")}
            >
              {t.archiveButton}
            </button>
          </div>
          <ResultMessage result={dangerResult} savedFallback={t.savedFallback} />
        </div>
      </Card>
    </div>
  );
}
