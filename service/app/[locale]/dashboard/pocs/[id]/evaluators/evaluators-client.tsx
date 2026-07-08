"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import {
  addEvaluatorAction,
  sendEvaluatorInviteAction,
  setEvaluatorDisabledAction,
  type ActionResult,
} from "@/app/[locale]/dashboard/actions";
import {
  Badge,
  Card,
  CardTitle,
  EmptyState,
  Label,
  Table,
  Td,
  Th,
  buttonCn,
  inputCn,
} from "@/components/ui";
import { localePath, type Locale } from "@/lib/i18n/locales";
import { dashboardDict } from "@/lib/i18n/dashboard";
import { PRO_PRICE_USD, PRO_PRICE_YEARLY_USD } from "@/lib/plans";

export type EvaluatorItem = {
  id: string;
  email: string;
  name: string | null;
  disabled: boolean;
  added: string;
  addedBy: string;
};

export function EvaluatorsClient({
  pocId,
  rows,
  activeCount,
  maxSeats,
  planId,
  locale,
}: {
  pocId: string;
  rows: EvaluatorItem[];
  activeCount: number;
  maxSeats: number | null; // null = unlimited
  planId: "free" | "pro";
  locale: Locale;
}) {
  const router = useRouter();
  const t = dashboardDict[locale].poc.evaluators;
  const formRef = useRef<HTMLFormElement>(null);
  const [addResult, setAddResult] = useState<ActionResult | null>(null);
  const [rowResult, setRowResult] = useState<ActionResult | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [inviteBusyId, setInviteBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const capped = maxSeats !== null && activeCount >= maxSeats;
  // Upgrade nudge: free plan, near or at the seat cap (e.g. 2 of 3 used).
  const nearCap =
    planId === "free" && maxSeats !== null && activeCount >= maxSeats - 1;

  function submitAdd(fd: FormData) {
    setAddResult(null);
    startTransition(async () => {
      const res = await addEvaluatorAction(pocId, fd);
      setAddResult(res);
      if ("ok" in res) {
        formRef.current?.reset();
        router.refresh();
      }
    });
  }

  function toggle(id: string, disabled: boolean) {
    setRowResult(null);
    setBusyId(id);
    startTransition(async () => {
      const res = await setEvaluatorDisabledAction(pocId, id, disabled);
      setBusyId(null);
      if ("error" in res) setRowResult(res);
      else router.refresh();
    });
  }

  function sendInvite(id: string) {
    setRowResult(null);
    setInviteBusyId(id);
    startTransition(async () => {
      const res = await sendEvaluatorInviteAction(pocId, id);
      setInviteBusyId(null);
      setRowResult(res);
    });
  }

  return (
    <div className="space-y-6">
      {nearCap && maxSeats !== null ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/20 bg-brand-subtle px-4 py-3">
          <p className="text-sm text-ink-800">
            {t.seatNudge(
              activeCount,
              maxSeats,
              PRO_PRICE_USD,
              PRO_PRICE_YEARLY_USD,
            )}
          </p>
          <Link
            href={localePath(locale, "/dashboard/billing")}
            className="text-sm font-semibold whitespace-nowrap text-brand hover:underline"
          >
            {t.seatNudgeCta} →
          </Link>
        </div>
      ) : null}

      <Card>
        <CardTitle>{t.addTitle}</CardTitle>
        <p className="mb-4 text-sm text-ink-500">
          {t.allowlistNote}{" "}
          <span className="font-medium text-ink-700">
            {t.seatsUsed(activeCount, String(maxSeats ?? "∞"))}
          </span>{" "}
          {capped && planId === "free" ? (
            <Link
              href={localePath(locale, "/dashboard/billing")}
              className="font-semibold text-brand hover:underline"
            >
              {t.upgradeCta}
            </Link>
          ) : null}
        </p>

        <form
          ref={formRef}
          action={submitAdd}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="min-w-56 flex-1">
            <Label htmlFor="evaluator-email">{t.emailLabel}</Label>
            <input
              id="evaluator-email"
              name="email"
              type="email"
              required
              placeholder="evaluator@client.com"
              className={inputCn}
            />
          </div>
          <div className="min-w-44 flex-1">
            <Label htmlFor="evaluator-name">{t.nameLabel}</Label>
            <input
              id="evaluator-name"
              name="name"
              type="text"
              placeholder="Jane Tan"
              className={inputCn}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className={buttonCn("primary", "md")}
          >
            {pending ? t.adding : t.add}
          </button>
          <label className="flex w-full cursor-pointer items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              name="invite"
              value="yes"
              defaultChecked
              className="h-4 w-4 rounded border-ink-300 accent-ink-900"
            />
            {t.inviteCheckbox}
          </label>
        </form>

        {addResult && "error" in addResult ? (
          <p className="mt-3 text-sm font-medium text-danger">
            {addResult.error}{" "}
            {addResult.error.includes("Upgrade to Pro") ? (
              <Link
                href={localePath(locale, "/dashboard/billing")}
                className="font-semibold text-brand hover:underline"
              >
                {t.upgradeLink}
              </Link>
            ) : null}
          </p>
        ) : null}
        {addResult && "ok" in addResult && addResult.message ? (
          <p className="mt-3 text-sm font-medium text-success">
            {addResult.message}
          </p>
        ) : null}
      </Card>

      {rowResult && "error" in rowResult ? (
        <p className="text-sm font-medium text-danger">{rowResult.error}</p>
      ) : null}
      {rowResult && "ok" in rowResult && rowResult.message ? (
        <p className="text-sm font-medium text-success">{rowResult.message}</p>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState title={t.emptyTitle} hint={t.emptyHint} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{t.thEmail}</Th>
              <Th>{t.thName}</Th>
              <Th>{t.thStatus}</Th>
              <Th>{t.thAdded}</Th>
              <Th>{t.thAddedBy}</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <Td className="font-medium text-ink-900">{e.email}</Td>
                <Td className="text-ink-600">{e.name ?? "—"}</Td>
                <Td>
                  <Badge tone={e.disabled ? "neutral" : "success"}>
                    {e.disabled ? t.statusDisabled : t.statusActive}
                  </Badge>
                </Td>
                <Td className="text-ink-600">{e.added}</Td>
                <Td className="text-ink-600">{e.addedBy}</Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!e.disabled ? (
                      <button
                        type="button"
                        onClick={() => sendInvite(e.id)}
                        disabled={pending && inviteBusyId === e.id}
                        className={buttonCn("ghost", "sm")}
                      >
                        <Mail className="h-3.5 w-3.5" aria-hidden />
                        {pending && inviteBusyId === e.id
                          ? t.sendingInvite
                          : t.sendInvite}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => toggle(e.id, !e.disabled)}
                      disabled={pending && busyId === e.id}
                      className={buttonCn(e.disabled ? "secondary" : "danger", "sm")}
                    >
                      {pending && busyId === e.id
                        ? t.saving
                        : e.disabled
                          ? t.reEnable
                          : t.disable}
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
