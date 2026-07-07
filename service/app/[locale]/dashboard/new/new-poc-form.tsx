"use client";

import {
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPocAction } from "../actions";
import { buttonCn, Card, inputCn, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/locales";
import { dashboardDict } from "@/lib/i18n/dashboard";

function Hint({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-xs text-ink-500">{children}</p>;
}

export default function NewPocForm({ locale }: { locale: Locale }) {
  const t = dashboardDict[locale].newPoc;
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await createPocAction(formData);
      // On success the action redirects to the new PoC — Next handles the
      // navigation, so we only need to surface errors here.
      if (res && "error" in res) setError(res.error);
    });
  }

  const optional = (
    <span className="font-normal text-ink-400">{t.optional}</span>
  );

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-5">
        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-danger/30 bg-danger-subtle px-3 py-2 text-sm text-danger"
          >
            {error}
          </div>
        ) : null}

        <div>
          <Label htmlFor="poc-name">{t.nameLabel}</Label>
          <input
            id="poc-name"
            name="name"
            type="text"
            placeholder="Project Falcon"
            required
            minLength={2}
            maxLength={80}
            className={inputCn}
          />
          <Hint>{t.nameHint}</Hint>
        </div>

        <div>
          <Label htmlFor="poc-owner">{t.ownerLabel}</Label>
          <input
            id="poc-owner"
            name="ownerEntity"
            type="text"
            placeholder="Acme Pte Ltd"
            required
            minLength={2}
            maxLength={120}
            className={inputCn}
          />
          <Hint>{t.ownerHint}</Hint>
        </div>

        <div>
          <Label htmlFor="poc-regno">
            {t.regNoLabel} {optional}
          </Label>
          <input
            id="poc-regno"
            name="ownerRegNo"
            type="text"
            placeholder="201912345K"
            maxLength={60}
            className={inputCn}
          />
          <Hint>{t.regNoHint}</Hint>
        </div>

        <div>
          <Label htmlFor="poc-client">
            {t.clientLabel} {optional}
          </Label>
          <input
            id="poc-client"
            name="clientEntity"
            type="text"
            placeholder="Globex Corporation"
            maxLength={120}
            className={inputCn}
          />
          <Hint>{t.clientHint}</Hint>
        </div>

        <div>
          <Label htmlFor="poc-purpose">
            {t.purposeLabel} {optional}
          </Label>
          <textarea
            id="poc-purpose"
            name="purpose"
            rows={3}
            placeholder={t.purposePlaceholder}
            maxLength={400}
            className={cn(inputCn, "resize-y")}
          />
          <Hint>{t.purposeHint}</Hint>
        </div>

        <div>
          <Label htmlFor="poc-appurl">
            {t.appUrlLabel} {optional}
          </Label>
          <input
            id="poc-appurl"
            name="appUrl"
            type="url"
            placeholder="https://falcon.acme.dev"
            maxLength={200}
            className={inputCn}
          />
          <Hint>{t.appUrlHint}</Hint>
        </div>

        <button
          type="submit"
          disabled={pending}
          className={cn(buttonCn("primary"), "w-full")}
        >
          {pending ? t.submitting : t.submit}
        </button>
      </form>
    </Card>
  );
}
