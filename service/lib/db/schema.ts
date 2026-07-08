import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

/* ============================================================
   POCX — multi-tenant schema.

   workspaces  → paying customers (the people who built a PoC)
   operators   → humans who sign in to the POCX dashboard
   pocs        → one protected proof-of-concept each
   evaluators  → per-PoC allowlist (the people invited to view it)
   sessions    → operator (dashboard) + gate (evaluator) sessions
   grants      → single-use handoff codes: hosted gate → customer app
   otp_codes   → hashed email login codes for both realms
   acceptances → immutable Terms-of-Access e-signature records
   audit_logs  → every auth/access decision (Pro plan surface)
   outbound_emails → mock inbox when RESEND_API_KEY is unset
   ============================================================ */

export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(), // ws_…
  name: text("name").notNull(),
  plan: text("plan").notNull().default("free"), // free | pro
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  upgradedAt: integer("upgraded_at", { mode: "timestamp_ms" }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  // Subscription state mirrored from Stripe webhooks (null in demo mode).
  billingInterval: text("billing_interval"), // month | year
  cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" })
    .notNull()
    .default(false),
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp_ms" }),
  // The 50%-off-3-months save offer can be redeemed once per workspace.
  retentionOfferRedeemedAt: integer("retention_offer_redeemed_at", {
    mode: "timestamp_ms",
  }),
});

export const operators = sqliteTable("operators", {
  id: text("id").primaryKey(), // op_…
  workspaceId: text("workspace_id").notNull(),
  email: text("email").notNull().unique(), // normalized
  name: text("name"),
  role: text("role").notNull().default("owner"), // owner | member
  addedBy: text("added_by").notNull().default("signup"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  disabledAt: integer("disabled_at", { mode: "timestamp_ms" }),
});

export const pocs = sqliteTable("pocs", {
  id: text("id").primaryKey(), // poc_…
  workspaceId: text("workspace_id").notNull(),
  slug: text("slug").notNull().unique(), // hosted gate path: /gate/<slug>
  name: text("name").notNull(), // e.g. "Project Falcon"
  ownerEntity: text("owner_entity").notNull(), // who made the PoC
  ownerRegNo: text("owner_reg_no"), // company registration number
  clientEntity: text("client_entity"), // who is evaluating it
  purpose: text("purpose"), // evaluation purpose, feeds the terms
  supportEmail: text("support_email"),
  brandColor: text("brand_color").notNull().default("#17140F"),
  logoUrl: text("logo_url"),
  appUrl: text("app_url"), // origin of the protected app
  callbackPath: text("callback_path").notNull().default("/api/pocx/callback"),
  publicKey: text("public_key").notNull().unique(), // pocx_pk_…
  secret: text("secret").notNull(), // pocx_sk_… (signs SDK tokens)
  termsMode: text("terms_mode").notNull().default("template"), // template | custom
  termsCustomText: text("terms_custom_text"),
  termsVersion: text("terms_version").notNull().default("1.0"),
  sessionTtlHours: integer("session_ttl_hours").notNull().default(24),
  idleTimeoutHours: integer("idle_timeout_hours").notNull().default(3),
  otpTtlMinutes: integer("otp_ttl_minutes").notNull().default(10),
  status: text("status").notNull().default("active"), // active | paused
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
});

export const evaluators = sqliteTable(
  "evaluators",
  {
    id: text("id").primaryKey(), // ev_…
    pocId: text("poc_id").notNull(),
    email: text("email").notNull(), // normalized
    name: text("name"),
    addedBy: text("added_by").notNull().default("dashboard"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    disabledAt: integer("disabled_at", { mode: "timestamp_ms" }),
  },
  (t) => [uniqueIndex("uq_evaluators_poc_email").on(t.pocId, t.email)],
);

/** Hashed email login codes for both realms. */
export const otpCodes = sqliteTable("otp_codes", {
  id: text("id").primaryKey(), // otp_…
  email: text("email").notNull(), // normalized
  codeHash: text("code_hash").notNull(), // sha256 — plaintext never stored
  purpose: text("purpose").notNull(), // operator | gate
  pocId: text("poc_id"), // set for gate codes
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  consumedAt: integer("consumed_at", { mode: "timestamp_ms" }),
  attempts: integer("attempts").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

/** Opaque, revocable sessions. Idle timeout via last_active_at. */
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // sess_…
  kind: text("kind").notNull(), // operator | gate
  email: text("email").notNull(),
  workspaceId: text("workspace_id"), // operator sessions
  pocId: text("poc_id"), // gate sessions
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  lastActiveAt: integer("last_active_at", { mode: "timestamp_ms" }).notNull(),
  revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
  ip: text("ip"),
  userAgent: text("user_agent"),
});

/** Single-use handoff codes: hosted gate → customer app callback. */
export const grants = sqliteTable("grants", {
  id: text("id").primaryKey(), // grant_…
  pocId: text("poc_id").notNull(),
  sessionId: text("session_id").notNull(),
  email: text("email").notNull(),
  returnTo: text("return_to").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  consumedAt: integer("consumed_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

/** Immutable electronic-signature records (insert-only). */
export const acceptances = sqliteTable("acceptances", {
  id: text("id").primaryKey(), // sig_…
  pocId: text("poc_id").notNull(),
  email: text("email").notNull(),
  termsVersion: text("terms_version").notNull(),
  termsHash: text("terms_hash").notNull(), // sha256 of the exact text shown
  termsText: text("terms_text").notNull().default(""), // the exact text shown
  ip: text("ip").notNull(),
  userAgent: text("user_agent").notNull(),
  acceptedAt: integer("accepted_at", { mode: "timestamp_ms" }).notNull(),
  pdfPath: text("pdf_path"),
  emailMessageId: text("email_message_id"),
});

/** Auth + access audit trail. Written on both plans; surfaced on Pro. */
export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workspaceId: text("workspace_id"),
  pocId: text("poc_id"),
  email: text("email"),
  sessionId: text("session_id"),
  event: text("event").notNull(), // otp_requested, otp_verified, terms_accepted, …
  detail: text("detail"),
  path: text("path"),
  source: text("source").notNull().default("gate"), // gate | sdk | dashboard
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

/** Mock outbound email log (when no RESEND_API_KEY). */
export const outboundEmails = sqliteTable("outbound_emails", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipient: text("recipient").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  pocId: text("poc_id"),
  workspaceId: text("workspace_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

/** Platform-wide owner settings (key → JSON string). Editable in /admin. */
export const adminSettings = sqliteTable("admin_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

/** Support tickets — customers file from the dashboard, admins triage. */
export const tickets = sqliteTable("tickets", {
  id: text("id").primaryKey(), // tkt_…
  workspaceId: text("workspace_id").notNull(),
  createdBy: text("created_by").notNull(), // operator email
  subject: text("subject").notNull(),
  // open (needs admin) | pending (waiting on customer) | closed
  status: text("status").notNull().default("open"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const ticketMessages = sqliteTable("ticket_messages", {
  id: text("id").primaryKey(), // tmsg_…
  ticketId: text("ticket_id").notNull(),
  authorRole: text("author_role").notNull(), // customer | admin
  authorEmail: text("author_email").notNull(),
  body: text("body").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export type WorkspaceRow = typeof workspaces.$inferSelect;
export type TicketRow = typeof tickets.$inferSelect;
export type TicketMessageRow = typeof ticketMessages.$inferSelect;
export type AdminSettingRow = typeof adminSettings.$inferSelect;
export type OperatorRow = typeof operators.$inferSelect;
export type PocRow = typeof pocs.$inferSelect;
export type EvaluatorRow = typeof evaluators.$inferSelect;
export type OtpCodeRow = typeof otpCodes.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type GrantRow = typeof grants.$inferSelect;
export type AcceptanceRow = typeof acceptances.$inferSelect;
export type AuditLogRow = typeof auditLogs.$inferSelect;
export type OutboundEmailRow = typeof outboundEmails.$inferSelect;
