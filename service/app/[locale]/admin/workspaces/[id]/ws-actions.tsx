"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gift, Send } from "lucide-react";
import { buttonCn } from "@/components/ui";
import { sendNudgeAction, setCompPlanAction } from "../../actions";

type Result = { ok: boolean; text: string };

export default function WsActions({
  workspaceId,
  stage,
  plan,
  hasStripeSubscription,
  nudgeCooldownActive,
  lastNudgeAt,
}: {
  workspaceId: string;
  stage: string;
  plan: "free" | "pro";
  hasStripeSubscription: boolean;
  nudgeCooldownActive: boolean;
  lastNudgeAt: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"nudge" | "comp" | null>(null);
  const [nudgeResult, setNudgeResult] = useState<Result | null>(null);
  const [compResult, setCompResult] = useState<Result | null>(null);

  function nudge() {
    setBusy("nudge");
    startTransition(async () => {
      const res = await sendNudgeAction(workspaceId);
      setNudgeResult(
        "error" in res
          ? { ok: false, text: res.error }
          : { ok: true, text: res.message ?? "Nudge sent." },
      );
      setBusy(null);
      if ("ok" in res) router.refresh();
    });
  }

  function setComp(comped: boolean) {
    const prompt = comped
      ? "Comp this workspace onto Pro (no charge)?"
      : "Remove the comp and drop this workspace back to Free?";
    if (!window.confirm(prompt)) return;
    setBusy("comp");
    startTransition(async () => {
      const res = await setCompPlanAction(workspaceId, comped);
      setCompResult(
        "error" in res
          ? { ok: false, text: res.error }
          : { ok: true, text: res.message ?? "Done." },
      );
      setBusy(null);
      if ("ok" in res) router.refresh();
    });
  }

  const resultLine = (r: Result | null) =>
    r ? (
      <p
        className={
          r.ok
            ? "text-xs font-medium text-success"
            : "text-xs font-medium text-danger"
        }
      >
        {r.text}
      </p>
    ) : null;

  return (
    <div className="mt-3 space-y-5 text-sm">
      <div className="space-y-2">
        <p className="text-ink-600">
          Onboarding nudge — emails the owner the stage-appropriate next step.
          One per workspace per 7 days.
        </p>
        {stage === "active" ? (
          <p className="text-xs text-ink-400">
            This workspace is active — nothing to nudge.
          </p>
        ) : (
          <button
            type="button"
            onClick={nudge}
            disabled={(pending && busy === "nudge") || nudgeCooldownActive}
            title={
              nudgeCooldownActive && lastNudgeAt
                ? `Nudged ${lastNudgeAt}`
                : undefined
            }
            className={buttonCn("secondary", "sm")}
          >
            <Send className="h-3.5 w-3.5" aria-hidden />
            {pending && busy === "nudge"
              ? "Sending…"
              : nudgeCooldownActive
                ? `Nudged ${lastNudgeAt ?? "recently"}`
                : "Send nudge"}
          </button>
        )}
        {resultLine(nudgeResult)}
      </div>

      <div className="space-y-2 border-t border-ink-100 pt-4">
        <p className="text-ink-600">
          Comped Pro — support gesture or partner deal. Never touches Stripe.
        </p>
        {hasStripeSubscription ? (
          <p className="text-xs text-ink-400">
            This workspace has a live Stripe subscription — manage its plan in
            Stripe, not with comps.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setComp(plan === "free")}
            disabled={pending && busy === "comp"}
            className={buttonCn(plan === "free" ? "secondary" : "danger", "sm")}
          >
            <Gift className="h-3.5 w-3.5" aria-hidden />
            {pending && busy === "comp"
              ? "Working…"
              : plan === "free"
                ? "Comp Pro"
                : "Remove comp"}
          </button>
        )}
        {resultLine(compResult)}
      </div>
    </div>
  );
}
