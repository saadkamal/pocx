"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  inviteOperatorAction,
  setOperatorDisabledAction,
  type ActionResult,
} from "@/app/[locale]/dashboard/actions";
import {
  Badge,
  Card,
  CardTitle,
  Label,
  Table,
  Td,
  Th,
  buttonCn,
  inputCn,
} from "@/components/ui";
import type { Locale } from "@/lib/i18n/locales";
import { dashboardDict } from "@/lib/i18n/dashboard";

export type OperatorItem = {
  id: string;
  email: string;
  name: string | null;
  role: "owner" | "member";
  added: string;
  disabled: boolean;
  addedBy: string;
};

export function TeamClient({
  rows,
  isOwner,
  selfId,
  locale,
}: {
  rows: OperatorItem[];
  isOwner: boolean;
  selfId: string;
  locale: Locale;
}) {
  const router = useRouter();
  const t = dashboardDict[locale].team;
  const formRef = useRef<HTMLFormElement>(null);
  const [inviteResult, setInviteResult] = useState<ActionResult | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submitInvite(fd: FormData) {
    setInviteResult(null);
    startTransition(async () => {
      const res = await inviteOperatorAction(fd);
      setInviteResult(res);
      if ("ok" in res) {
        formRef.current?.reset();
        router.refresh();
      }
    });
  }

  function toggle(id: string, disabled: boolean, email: string) {
    if (disabled && !confirm(t.disableConfirm(email))) return;
    setRowError(null);
    setBusyId(id);
    startTransition(async () => {
      const res = await setOperatorDisabledAction(id, disabled);
      setBusyId(null);
      if ("error" in res) setRowError(res.error);
      else router.refresh();
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">
        {t.title}
      </h1>
      <p className="mt-2 mb-6 text-sm text-ink-600">{t.intro}</p>

      <div className="space-y-6">
        <Card>
          {isOwner ? (
            <>
              <CardTitle>{t.inviteTitle}</CardTitle>
              <p className="mb-4 text-sm text-ink-500">{t.inviteNote}</p>
              <form
                ref={formRef}
                action={submitInvite}
                className="flex flex-wrap items-end gap-3"
              >
                <div className="min-w-56 flex-1">
                  <Label htmlFor="operator-email">{t.emailLabel}</Label>
                  <input
                    id="operator-email"
                    name="email"
                    type="email"
                    required
                    placeholder="teammate@acme.com"
                    className={inputCn}
                  />
                </div>
                <div className="min-w-44 flex-1">
                  <Label htmlFor="operator-name">{t.nameLabel}</Label>
                  <input
                    id="operator-name"
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
                  {pending ? t.inviting : t.invite}
                </button>
              </form>

              {inviteResult && "error" in inviteResult ? (
                <p className="mt-3 text-sm font-medium text-danger">
                  {inviteResult.error}
                </p>
              ) : null}
              {inviteResult && "ok" in inviteResult && inviteResult.message ? (
                <p className="mt-3 text-sm font-medium text-success">
                  {inviteResult.message}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-ink-500">{t.memberNote}</p>
          )}
        </Card>

        {rowError ? (
          <p className="text-sm font-medium text-danger">{rowError}</p>
        ) : null}

        <Table>
          <thead>
            <tr>
              <Th>{t.thEmail}</Th>
              <Th>{t.thName}</Th>
              <Th>{t.thRole}</Th>
              <Th>{t.thAdded}</Th>
              <Th>{t.thAddedBy}</Th>
              <Th>{t.thStatus}</Th>
              {isOwner ? <Th /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <Td className="font-medium text-ink-900">
                  {o.email}
                  {o.id === selfId ? (
                    <span className="ml-1.5 font-normal text-ink-500">
                      {t.you}
                    </span>
                  ) : null}
                </Td>
                <Td className="text-ink-600">{o.name ?? "—"}</Td>
                <Td>
                  <Badge tone={o.role === "owner" ? "brand" : "neutral"}>
                    {o.role === "owner" ? "OWNER" : "MEMBER"}
                  </Badge>
                </Td>
                <Td className="text-ink-600">{o.added}</Td>
                <Td className="text-ink-600">{o.addedBy}</Td>
                <Td>
                  <Badge tone={o.disabled ? "danger" : "success"}>
                    {o.disabled ? t.statusDisabled : t.statusActive}
                  </Badge>
                </Td>
                {isOwner ? (
                  <Td className="text-right">
                    {o.role !== "owner" && o.id !== selfId ? (
                      <button
                        type="button"
                        onClick={() => toggle(o.id, !o.disabled, o.email)}
                        disabled={pending && busyId === o.id}
                        className={buttonCn(
                          o.disabled ? "secondary" : "danger",
                          "sm",
                        )}
                      >
                        {pending && busyId === o.id
                          ? t.saving
                          : o.disabled
                            ? t.reEnable
                            : t.disable}
                      </button>
                    ) : null}
                  </Td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
