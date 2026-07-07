"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getOperatorContext, pocForWorkspace } from "@/lib/auth/operator";
import {
  addEvaluator,
  archivePoc,
  countActiveEvaluators,
  createOperator,
  createPoc,
  getEvaluator,
  getOperatorByEmail,
  getOperatorById,
  getPocBySlug,
  insertAudit,
  listEvaluators,
  renameWorkspace,
  revokeAllGateSessions,
  revokeSession,
  getSessionRow,
  rotatePocSecret,
  setEvaluatorDisabled,
  setOperatorDisabled,
  updatePoc,
} from "@/lib/db/repo";
import {
  newEvaluatorId,
  newOperatorId,
  newPocId,
  newPublicKey,
  newSecret,
} from "@/lib/ids";
import { sendEvaluatorInvite, sendOperatorInvite } from "@/lib/mail/invites";
import { normalizeEmail } from "@/lib/auth/otp";
import { canAddEvaluator } from "@/lib/plans";
import {
  createCheckoutUrl,
  demoDowngrade,
  demoUpgrade,
  stripeEnabled,
} from "@/lib/billing";
import { slugify } from "@/lib/utils";

/**
 * Dashboard mutations — every action re-authenticates the operator and
 * re-proves PoC ownership; plan limits are enforced here, server-side.
 * All actions return { ok } | { error } for inline form feedback.
 */

export type ActionResult = { ok: true; message?: string } | { error: string };

const err = (error: string): ActionResult => ({ error });

async function ctxOrNull() {
  return await getOperatorContext();
}

/* --- PoCs --- */

const CreatePocSchema = z.object({
  name: z.string().trim().min(2).max(80),
  ownerEntity: z.string().trim().min(2).max(120),
  ownerRegNo: z.string().trim().max(60).optional(),
  clientEntity: z.string().trim().max(120).optional(),
  purpose: z.string().trim().max(400).optional(),
  appUrl: z
    .string()
    .trim()
    .url()
    .max(200)
    .optional()
    .or(z.literal("")),
});

export async function createPocAction(formData: FormData): Promise<ActionResult> {
  const ctx = await ctxOrNull();
  if (!ctx) return err("Not signed in.");

  const parsed = CreatePocSchema.safeParse({
    name: formData.get("name"),
    ownerEntity: formData.get("ownerEntity"),
    ownerRegNo: formData.get("ownerRegNo") || undefined,
    clientEntity: formData.get("clientEntity") || undefined,
    purpose: formData.get("purpose") || undefined,
    appUrl: formData.get("appUrl") || undefined,
  });
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  // Unique slug from the name; suffix on collision.
  const base = slugify(parsed.data.name) || "poc";
  let slug = base;
  for (let i = 2; getPocBySlug(slug); i++) slug = `${base}-${i}`;

  const id = newPocId();
  createPoc({
    id,
    workspaceId: ctx.workspace.id,
    slug,
    name: parsed.data.name,
    ownerEntity: parsed.data.ownerEntity,
    ownerRegNo: parsed.data.ownerRegNo ?? null,
    clientEntity: parsed.data.clientEntity ?? null,
    purpose: parsed.data.purpose ?? null,
    supportEmail: ctx.operator.email,
    brandColor: "#17140F",
    logoUrl: null,
    appUrl: parsed.data.appUrl || null,
    callbackPath: "/api/pocx/callback",
    publicKey: newPublicKey(),
    secret: newSecret(),
    termsMode: "template",
    termsCustomText: null,
    termsVersion: "1.0",
    sessionTtlHours: 24,
    idleTimeoutHours: 3,
    otpTtlMinutes: 10,
    status: "active",
  });

  insertAudit({
    workspaceId: ctx.workspace.id,
    pocId: id,
    email: ctx.operator.email,
    event: "poc_created",
    detail: parsed.data.name,
    source: "dashboard",
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard/pocs/${id}`);
}

const UpdatePocSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  ownerEntity: z.string().trim().min(2).max(120).optional(),
  ownerRegNo: z.string().trim().max(60).nullable().optional(),
  clientEntity: z.string().trim().max(120).nullable().optional(),
  purpose: z.string().trim().max(400).nullable().optional(),
  supportEmail: z.string().trim().email().max(254).nullable().optional(),
  brandColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  appUrl: z.string().trim().url().max(200).nullable().optional(),
  callbackPath: z
    .string()
    .trim()
    .regex(/^\/[\w\-./]*$/)
    .max(120)
    .optional(),
  sessionTtlHours: z.coerce.number().int().min(1).max(720).optional(),
  idleTimeoutHours: z.coerce.number().int().min(1).max(168).optional(),
  otpTtlMinutes: z.coerce.number().int().min(3).max(60).optional(),
  status: z.enum(["active", "paused"]).optional(),
});

export async function updatePocAction(
  pocId: string,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await ctxOrNull();
  if (!ctx) return err("Not signed in.");
  const poc = pocForWorkspace(ctx, pocId);
  if (!poc) return err("PoC not found.");

  const raw: Record<string, unknown> = {};
  for (const key of Object.keys(UpdatePocSchema.shape)) {
    const v = formData.get(key);
    if (v !== null) raw[key] = v === "" ? null : v;
  }
  const parsed = UpdatePocSchema.safeParse(raw);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  updatePoc(poc.id, parsed.data);
  insertAudit({
    workspaceId: ctx.workspace.id,
    pocId: poc.id,
    email: ctx.operator.email,
    event: "poc_updated",
    detail: Object.keys(parsed.data).join(","),
    source: "dashboard",
  });
  revalidatePath(`/dashboard/pocs/${poc.id}`);
  return { ok: true, message: "Saved." };
}

/** Update the terms (template/custom + text) and/or bump the version. */
const TermsSchema = z.object({
  termsMode: z.enum(["template", "custom"]),
  termsCustomText: z.string().max(20_000).optional(),
  termsVersion: z.string().trim().min(1).max(20),
  revokeSessions: z.enum(["yes", "no"]).default("no"),
});

export async function updateTermsAction(
  pocId: string,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await ctxOrNull();
  if (!ctx) return err("Not signed in.");
  const poc = pocForWorkspace(ctx, pocId);
  if (!poc) return err("PoC not found.");

  const parsed = TermsSchema.safeParse({
    termsMode: formData.get("termsMode"),
    termsCustomText: formData.get("termsCustomText") ?? undefined,
    termsVersion: formData.get("termsVersion"),
    revokeSessions: formData.get("revokeSessions") ?? "no",
  });
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Invalid input.");
  }
  if (
    parsed.data.termsMode === "custom" &&
    !parsed.data.termsCustomText?.trim()
  ) {
    return err("Custom terms text cannot be empty.");
  }

  const versionBumped = parsed.data.termsVersion !== poc.termsVersion;
  updatePoc(poc.id, {
    termsMode: parsed.data.termsMode,
    termsCustomText: parsed.data.termsCustomText ?? null,
    termsVersion: parsed.data.termsVersion,
  });

  let revoked = 0;
  if (versionBumped && parsed.data.revokeSessions === "yes") {
    revoked = revokeAllGateSessions(poc.id);
  }

  insertAudit({
    workspaceId: ctx.workspace.id,
    pocId: poc.id,
    email: ctx.operator.email,
    event: versionBumped ? "terms_version_bumped" : "terms_updated",
    detail: `v${parsed.data.termsVersion}${revoked ? ` (+${revoked} sessions revoked)` : ""}`,
    source: "dashboard",
  });
  revalidatePath(`/dashboard/pocs/${poc.id}`);
  return {
    ok: true,
    message: versionBumped
      ? `Terms now at v${parsed.data.termsVersion} — every evaluator must re-accept.${revoked ? ` ${revoked} live session(s) revoked.` : ""}`
      : "Terms saved.",
  };
}

export async function rotateSecretAction(pocId: string): Promise<ActionResult> {
  const ctx = await ctxOrNull();
  if (!ctx) return err("Not signed in.");
  const poc = pocForWorkspace(ctx, pocId);
  if (!poc) return err("PoC not found.");

  rotatePocSecret(poc.id, newSecret());
  insertAudit({
    workspaceId: ctx.workspace.id,
    pocId: poc.id,
    email: ctx.operator.email,
    event: "secret_rotated",
    source: "dashboard",
  });
  revalidatePath(`/dashboard/pocs/${poc.id}`);
  return {
    ok: true,
    message:
      "Secret rotated. Update POCX_SECRET in the protected app — existing sessions stay valid, but token exchange with the old secret stops working now.",
  };
}

export async function archivePocAction(pocId: string): Promise<ActionResult> {
  const ctx = await ctxOrNull();
  if (!ctx) return err("Not signed in.");
  const poc = pocForWorkspace(ctx, pocId);
  if (!poc) return err("PoC not found.");

  revokeAllGateSessions(poc.id);
  archivePoc(poc.id);
  insertAudit({
    workspaceId: ctx.workspace.id,
    pocId: poc.id,
    email: ctx.operator.email,
    event: "poc_archived",
    detail: poc.name,
    source: "dashboard",
  });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/* --- Evaluators --- */

const AddEvaluatorSchema = z.object({
  email: z.string().trim().min(3).max(254).email(),
  name: z.string().trim().max(80).optional(),
});

export async function addEvaluatorAction(
  pocId: string,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await ctxOrNull();
  if (!ctx) return err("Not signed in.");
  const poc = pocForWorkspace(ctx, pocId);
  if (!poc) return err("PoC not found.");

  const parsed = AddEvaluatorSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") || undefined,
  });
  if (!parsed.success) return err("Enter a valid email address.");
  const email = normalizeEmail(parsed.data.email);

  // Re-enabling an existing seat doesn't consume a new one.
  const existing = getEvaluator(poc.id, email);
  if (!existing || existing.disabledAt) {
    const gate = canAddEvaluator(
      ctx.workspace.plan,
      countActiveEvaluators(poc.id),
    );
    if (!gate.ok) return err(gate.reason);
  }
  if (existing && !existing.disabledAt) {
    return err("That email is already on the list.");
  }

  addEvaluator({
    id: newEvaluatorId(),
    pocId: poc.id,
    email,
    name: parsed.data.name ?? null,
    addedBy: ctx.operator.email,
  });
  insertAudit({
    workspaceId: ctx.workspace.id,
    pocId: poc.id,
    email: ctx.operator.email,
    event: "evaluator_added",
    detail: email,
    source: "dashboard",
  });

  // Optional invitation email with the gate link (best-effort: the seat is
  // active either way).
  let invited = false;
  if (formData.get("invite") === "yes") {
    try {
      await sendEvaluatorInvite(poc, email);
      invited = true;
      insertAudit({
        workspaceId: ctx.workspace.id,
        pocId: poc.id,
        email: ctx.operator.email,
        event: "evaluator_invited",
        detail: email,
        source: "dashboard",
      });
    } catch (e) {
      console.warn("[pocx] evaluator invite failed:", e);
    }
  }

  revalidatePath(`/dashboard/pocs/${poc.id}`);
  return {
    ok: true,
    message: invited
      ? `${email} can now request access — invitation sent.`
      : `${email} can now request access.`,
  };
}

/** Send (or re-send) the invitation email for an existing active seat. */
export async function sendEvaluatorInviteAction(
  pocId: string,
  evaluatorId: string,
): Promise<ActionResult> {
  const ctx = await ctxOrNull();
  if (!ctx) return err("Not signed in.");
  const poc = pocForWorkspace(ctx, pocId);
  if (!poc) return err("PoC not found.");

  const evaluator = listEvaluators(poc.id).find((e) => e.id === evaluatorId);
  if (!evaluator) return err("Evaluator not found.");
  if (evaluator.disabledAt) return err("This seat is disabled — re-enable it first.");

  try {
    await sendEvaluatorInvite(poc, evaluator.email);
  } catch {
    return err("The invitation email could not be sent — try again in a moment.");
  }
  insertAudit({
    workspaceId: ctx.workspace.id,
    pocId: poc.id,
    email: ctx.operator.email,
    event: "evaluator_invited",
    detail: evaluator.email,
    source: "dashboard",
  });
  return { ok: true, message: `Invitation sent to ${evaluator.email}.` };
}

export async function setEvaluatorDisabledAction(
  pocId: string,
  evaluatorId: string,
  disabled: boolean,
): Promise<ActionResult> {
  const ctx = await ctxOrNull();
  if (!ctx) return err("Not signed in.");
  const poc = pocForWorkspace(ctx, pocId);
  if (!poc) return err("PoC not found.");

  const evaluator = listEvaluators(poc.id).find((e) => e.id === evaluatorId);
  if (!evaluator) return err("Evaluator not found.");

  if (!disabled) {
    // Re-enabling consumes a seat — enforce the plan cap.
    const gate = canAddEvaluator(
      ctx.workspace.plan,
      countActiveEvaluators(poc.id),
    );
    if (!gate.ok) return err(gate.reason);
  }

  setEvaluatorDisabled(evaluatorId, disabled);
  insertAudit({
    workspaceId: ctx.workspace.id,
    pocId: poc.id,
    email: ctx.operator.email,
    event: disabled ? "evaluator_disabled" : "evaluator_enabled",
    detail: evaluator.email,
    source: "dashboard",
  });
  revalidatePath(`/dashboard/pocs/${poc.id}`);
  return { ok: true };
}

/* --- Sessions --- */

export async function revokeSessionAction(
  pocId: string,
  sessionId: string,
): Promise<ActionResult> {
  const ctx = await ctxOrNull();
  if (!ctx) return err("Not signed in.");
  const poc = pocForWorkspace(ctx, pocId);
  if (!poc) return err("PoC not found.");

  const session = getSessionRow(sessionId);
  if (!session || session.pocId !== poc.id) return err("Session not found.");

  revokeSession(sessionId);
  insertAudit({
    workspaceId: ctx.workspace.id,
    pocId: poc.id,
    email: ctx.operator.email,
    sessionId,
    event: "session_revoked",
    detail: session.email,
    source: "dashboard",
  });
  revalidatePath(`/dashboard/pocs/${poc.id}`);
  return { ok: true };
}

export async function revokeAllSessionsAction(
  pocId: string,
): Promise<ActionResult> {
  const ctx = await ctxOrNull();
  if (!ctx) return err("Not signed in.");
  const poc = pocForWorkspace(ctx, pocId);
  if (!poc) return err("PoC not found.");

  const n = revokeAllGateSessions(poc.id);
  insertAudit({
    workspaceId: ctx.workspace.id,
    pocId: poc.id,
    email: ctx.operator.email,
    event: "all_sessions_revoked",
    detail: `${n} session(s)`,
    source: "dashboard",
  });
  revalidatePath(`/dashboard/pocs/${poc.id}`);
  return { ok: true, message: `${n} session(s) revoked.` };
}

/* --- Team --- */

const InviteOperatorSchema = z.object({
  email: z.string().trim().min(3).max(254).email(),
  name: z.string().trim().max(80).optional(),
});

/** Owner-only: add a teammate to this workspace and email them a login link. */
export async function inviteOperatorAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await ctxOrNull();
  if (!ctx) return err("Not signed in.");
  if (ctx.operator.role !== "owner") {
    return err("Only the workspace owner can invite teammates.");
  }

  const parsed = InviteOperatorSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") || undefined,
  });
  if (!parsed.success) return err("Enter a valid email address.");
  const email = normalizeEmail(parsed.data.email);

  if (getOperatorByEmail(email)) {
    return err(
      "That email already has a POCX account (operator emails are unique across workspaces).",
    );
  }

  createOperator({
    id: newOperatorId(),
    workspaceId: ctx.workspace.id,
    email,
    name: parsed.data.name ?? null,
    role: "member",
    addedBy: ctx.operator.email,
  });

  try {
    await sendOperatorInvite({
      to: email,
      workspaceName: ctx.workspace.name,
      invitedBy: ctx.operator.name ?? ctx.operator.email,
      workspaceId: ctx.workspace.id,
    });
  } catch (e) {
    console.warn("[pocx] operator invite email failed:", e);
  }

  insertAudit({
    workspaceId: ctx.workspace.id,
    email: ctx.operator.email,
    event: "operator_invited",
    detail: email,
    source: "dashboard",
  });
  revalidatePath("/dashboard/team");
  return { ok: true, message: `${email} was added — they can log in with a one-time code.` };
}

/** Owner-only: disable / re-enable a teammate (never yourself, never owners). */
export async function setOperatorDisabledAction(
  operatorId: string,
  disabled: boolean,
): Promise<ActionResult> {
  const ctx = await ctxOrNull();
  if (!ctx) return err("Not signed in.");
  if (ctx.operator.role !== "owner") {
    return err("Only the workspace owner can manage teammates.");
  }

  const target = getOperatorById(operatorId);
  if (!target || target.workspaceId !== ctx.workspace.id) {
    return err("Teammate not found.");
  }
  if (target.id === ctx.operator.id) return err("You can't disable yourself.");
  if (target.role === "owner") return err("The workspace owner can't be disabled.");

  setOperatorDisabled(operatorId, disabled);
  insertAudit({
    workspaceId: ctx.workspace.id,
    email: ctx.operator.email,
    event: disabled ? "operator_disabled" : "operator_enabled",
    detail: target.email,
    source: "dashboard",
  });
  revalidatePath("/dashboard/team");
  return { ok: true };
}

/* --- Workspace / billing --- */

export async function renameWorkspaceAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await ctxOrNull();
  if (!ctx) return err("Not signed in.");
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 80) return err("Enter a name.");
  renameWorkspace(ctx.workspace.id, name);
  revalidatePath("/dashboard");
  return { ok: true, message: "Saved." };
}

export async function upgradeAction(): Promise<ActionResult> {
  const ctx = await ctxOrNull();
  if (!ctx) return err("Not signed in.");
  if (ctx.workspace.plan === "pro") return err("Already on Pro.");

  if (stripeEnabled()) {
    const url = await createCheckoutUrl(ctx.workspace.id, ctx.operator.email);
    redirect(url);
  }
  demoUpgrade(ctx.workspace.id, ctx.operator.email);
  revalidatePath("/dashboard");
  return {
    ok: true,
    message: "Workspace upgraded to Pro (demo mode — Stripe not configured).",
  };
}

export async function downgradeAction(): Promise<ActionResult> {
  const ctx = await ctxOrNull();
  if (!ctx) return err("Not signed in.");
  if (ctx.workspace.plan === "free") return err("Already on Free.");
  demoDowngrade(ctx.workspace.id, ctx.operator.email);
  revalidatePath("/dashboard");
  return { ok: true, message: "Workspace downgraded to Free." };
}
