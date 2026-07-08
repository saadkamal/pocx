"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, RotateCcw, Save, Send } from "lucide-react";
import { Badge, Card, CardTitle, Label, buttonCn, inputCn } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  resetNudgeConfigAction,
  saveNudgeConfigAction,
  sendTestNudgeAction,
} from "../actions";

type StageProps = {
  stage: string;
  label: string;
  subject: string;
  body: string;
  previewSubject: string;
  previewBody: string;
};

type Banner = { ok: boolean; text: string } | null;

/** One-word meaning for each placeholder, keyed by its bare name. */
const PLACEHOLDER_MEANINGS: Record<string, string> = {
  first_name: "the recipient's first name (or “there” if unknown)",
  workspace: "their workspace name",
  signature: "your signature, from the field below",
  new_poc_url: "link to create a new PoC",
  dashboard_url: "link to their dashboard",
  support_url: "link to support",
  docs_url: "link to the docs",
  tutorials_url: "link to the tutorials",
};

export default function SettingsClient({
  signature,
  stages,
  placeholders,
}: {
  signature: string;
  stages: StageProps[];
  placeholders: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"save" | "test" | "reset" | null>(null);

  const [saveResult, setSaveResult] = useState<Banner>(null);
  const [testResult, setTestResult] = useState<Banner>(null);
  const [resetResult, setResetResult] = useState<Banner>(null);
  const [testStage, setTestStage] = useState<string>(stages[0]?.stage ?? "");

  function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setBusy("save");
    startTransition(async () => {
      const res = await saveNudgeConfigAction(formData);
      setSaveResult(
        "error" in res
          ? { ok: false, text: res.error }
          : { ok: true, text: res.message ?? "Saved." },
      );
      setBusy(null);
      if ("ok" in res) router.refresh();
    });
  }

  function sendTest() {
    if (!testStage) return;
    setBusy("test");
    startTransition(async () => {
      const res = await sendTestNudgeAction(testStage);
      setTestResult(
        "error" in res
          ? { ok: false, text: res.error }
          : { ok: true, text: res.message ?? "Test sent." },
      );
      setBusy(null);
    });
  }

  function reset() {
    if (
      !window.confirm(
        "Restore the built-in default copy? Your edits to every stage and the signature will be discarded.",
      )
    )
      return;
    setBusy("reset");
    startTransition(async () => {
      const res = await resetNudgeConfigAction();
      setResetResult(
        "error" in res
          ? { ok: false, text: res.error }
          : { ok: true, text: res.message ?? "Reset." },
      );
      setBusy(null);
      if ("ok" in res) router.refresh();
    });
  }

  const banner = (r: Banner) =>
    r ? (
      <span
        className={cn(
          "text-sm font-medium",
          r.ok ? "text-success" : "text-danger",
        )}
      >
        {r.text}
      </span>
    ) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Settings
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          Onboarding nudge email copy.
        </p>
      </div>

      {/* Intro + placeholder legend */}
      <Card>
        <CardTitle>Onboarding email copy</CardTitle>
        <p className="mt-1 text-sm text-ink-600">
          These are the nudges you send from the Funnel. Write them in your own
          voice — <span className="font-mono text-ink-800">{"{{placeholders}}"}</span>{" "}
          get filled in per recipient when you hit send.
        </p>
        <div className="mt-5">
          <p className="font-mono text-[0.625rem] font-semibold tracking-[0.14em] text-ink-400 uppercase">
            Placeholders
          </p>
          <dl className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {placeholders.map((p) => {
              const key = p.replace(/[{}]/g, "");
              return (
                <div key={p} className="flex items-baseline gap-2 text-sm">
                  <dt>
                    <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[0.8em] text-ink-800">
                      {p}
                    </code>
                  </dt>
                  <dd className="text-ink-500">
                    {PLACEHOLDER_MEANINGS[key] ?? "the matching POCX link"}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </Card>

      {/* Main save form */}
      <form onSubmit={onSave} className="space-y-6">
        <Card>
          <CardTitle>Signature</CardTitle>
          <p className="mt-1 mb-3 text-sm text-ink-600">
            Signs off every nudge — dropped in wherever a template uses{" "}
            <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[0.8em] text-ink-800">
              {"{{signature}}"}
            </code>
            .
          </p>
          <Label htmlFor="signature">Your signature</Label>
          <textarea
            id="signature"
            name="signature"
            rows={3}
            defaultValue={signature}
            className={cn(inputCn, "resize-y font-mono text-sm")}
          />
        </Card>

        {stages.map((s) => (
          <Card key={s.stage}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Badge>{s.label}</Badge>
              <code className="font-mono text-[0.7rem] tracking-wide text-ink-400">
                {s.stage}
              </code>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor={`subject_${s.stage}`}>Subject</Label>
                <input
                  id={`subject_${s.stage}`}
                  name={`subject_${s.stage}`}
                  type="text"
                  defaultValue={s.subject}
                  className={inputCn}
                />
              </div>
              <div>
                <Label htmlFor={`body_${s.stage}`}>Body</Label>
                <textarea
                  id={`body_${s.stage}`}
                  name={`body_${s.stage}`}
                  rows={12}
                  defaultValue={s.body}
                  className={cn(inputCn, "resize-y font-mono text-sm")}
                />
              </div>

              <details className="group rounded-lg border border-ink-200 bg-ink-50/50">
                <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-medium text-ink-700 select-none marker:hidden hover:text-ink-900">
                  Preview (as Saad at Acme Pte Ltd)
                </summary>
                <div className="border-t border-ink-200 px-4 py-3">
                  <p className="text-xs text-ink-400">Subject</p>
                  <p className="font-semibold text-ink-900">
                    {s.previewSubject}
                  </p>
                  <div className="mt-3 rounded-lg bg-ink-50 p-4 text-sm whitespace-pre-wrap text-ink-800">
                    {s.previewBody}
                  </div>
                  <p className="mt-2 text-xs text-ink-400">
                    Preview reflects saved copy — save to refresh.
                  </p>
                </div>
              </details>
            </div>
          </Card>
        ))}

        <div className="sticky bottom-0 z-10 -mx-8 border-t border-ink-200 bg-paper/90 px-8 py-4 backdrop-blur">
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={pending && busy === "save"}
              className={buttonCn("primary", "md")}
            >
              <Save className="h-4 w-4" aria-hidden />
              {pending && busy === "save" ? "Saving…" : "Save copy"}
            </button>
            {banner(saveResult)}
          </div>
        </div>
      </form>

      {/* Controls OUTSIDE the save form */}
      <Card>
        <CardTitle>Send a test to yourself</CardTitle>
        <p className="mt-1 mb-3 text-sm text-ink-600">
          Emails you one stage&apos;s nudge, rendered with the currently saved
          copy, so you can see exactly how it lands.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Stage to send"
            value={testStage}
            onChange={(e) => setTestStage(e.target.value)}
            className={cn(inputCn, "w-auto")}
          >
            {stages.map((s) => (
              <option key={s.stage} value={s.stage}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={sendTest}
            disabled={pending && busy === "test"}
            className={buttonCn("secondary", "md")}
          >
            <Send className="h-4 w-4" aria-hidden />
            {pending && busy === "test" ? "Sending…" : "Send test email"}
          </button>
          {banner(testResult)}
        </div>
      </Card>

      <Card className="border-danger/20">
        <CardTitle>Reset to defaults</CardTitle>
        <p className="mt-1 mb-3 text-sm text-ink-600">
          Discards every edit and restores the built-in copy for all stages and
          the signature. Can&apos;t be undone.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={reset}
            disabled={pending && busy === "reset"}
            className={buttonCn("danger", "md")}
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            {pending && busy === "reset" ? "Resetting…" : "Reset to defaults"}
          </button>
          {banner(resetResult)}
        </div>
      </Card>

      <p className="flex items-center gap-1.5 text-xs text-ink-400">
        <Mail className="h-3.5 w-3.5" aria-hidden />
        Saved copy is used the next time you send a nudge from the Funnel.
      </p>
    </div>
  );
}
