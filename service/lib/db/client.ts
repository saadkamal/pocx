import "server-only";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as schema from "./schema";

/**
 * SQLite client — embedded, zero-config. The schema is created on first
 * import so a fresh checkout (or a fresh Railway volume) needs no
 * migration step. Additive changes follow the attempt-and-ignore
 * ALTER TABLE pattern.
 */

const DB_PATH = process.env.POCX_DB_PATH ?? ".data/pocx.db";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function createTables(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free',
      created_at INTEGER NOT NULL,
      upgraded_at INTEGER,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT
    );
    CREATE TABLE IF NOT EXISTS operators (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'owner',
      added_by TEXT NOT NULL DEFAULT 'signup',
      created_at INTEGER NOT NULL,
      disabled_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS pocs (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      owner_entity TEXT NOT NULL,
      owner_reg_no TEXT,
      client_entity TEXT,
      purpose TEXT,
      support_email TEXT,
      brand_color TEXT NOT NULL DEFAULT '#17140F',
      logo_url TEXT,
      app_url TEXT,
      callback_path TEXT NOT NULL DEFAULT '/api/pocx/callback',
      public_key TEXT NOT NULL UNIQUE,
      secret TEXT NOT NULL,
      terms_mode TEXT NOT NULL DEFAULT 'template',
      terms_custom_text TEXT,
      terms_version TEXT NOT NULL DEFAULT '1.0',
      session_ttl_hours INTEGER NOT NULL DEFAULT 24,
      idle_timeout_hours INTEGER NOT NULL DEFAULT 3,
      otp_ttl_minutes INTEGER NOT NULL DEFAULT 10,
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL,
      archived_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS evaluators (
      id TEXT PRIMARY KEY,
      poc_id TEXT NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      added_by TEXT NOT NULL DEFAULT 'dashboard',
      created_at INTEGER NOT NULL,
      disabled_at INTEGER
    );
    CREATE UNIQUE INDEX IF NOT EXISTS uq_evaluators_poc_email
      ON evaluators(poc_id, email);
    CREATE TABLE IF NOT EXISTS otp_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      purpose TEXT NOT NULL,
      poc_id TEXT,
      expires_at INTEGER NOT NULL,
      consumed_at INTEGER,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      email TEXT NOT NULL,
      workspace_id TEXT,
      poc_id TEXT,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      last_active_at INTEGER NOT NULL,
      revoked_at INTEGER,
      ip TEXT,
      user_agent TEXT
    );
    CREATE TABLE IF NOT EXISTS grants (
      id TEXT PRIMARY KEY,
      poc_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      email TEXT NOT NULL,
      return_to TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      consumed_at INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS acceptances (
      id TEXT PRIMARY KEY,
      poc_id TEXT NOT NULL,
      email TEXT NOT NULL,
      terms_version TEXT NOT NULL,
      terms_hash TEXT NOT NULL,
      terms_text TEXT NOT NULL DEFAULT '',
      ip TEXT NOT NULL,
      user_agent TEXT NOT NULL,
      accepted_at INTEGER NOT NULL,
      pdf_path TEXT,
      email_message_id TEXT
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id TEXT,
      poc_id TEXT,
      email TEXT,
      session_id TEXT,
      event TEXT NOT NULL,
      detail TEXT,
      path TEXT,
      source TEXT NOT NULL DEFAULT 'gate',
      ip TEXT,
      user_agent TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS outbound_emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      poc_id TEXT,
      workspace_id TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_operators_ws ON operators(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_pocs_ws ON pocs(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_evaluators_poc ON evaluators(poc_id);
    CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_email ON sessions(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_poc ON sessions(poc_id);
    CREATE INDEX IF NOT EXISTS idx_acceptances_poc ON acceptances(poc_id);
    CREATE INDEX IF NOT EXISTS idx_audit_poc ON audit_logs(poc_id);
    CREATE INDEX IF NOT EXISTS idx_audit_ws ON audit_logs(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
    CREATE TABLE IF NOT EXISTS admin_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      subject TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ticket_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      author_role TEXT NOT NULL,
      author_email TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tickets_ws ON tickets(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_ticket_msgs ON ticket_messages(ticket_id);
  `);

  // Additive columns shipped after tables existed on persistent volumes.
  // SQLite has no ADD COLUMN IF NOT EXISTS — attempt-and-ignore.
  for (const stmt of [
    `ALTER TABLE workspaces ADD COLUMN billing_interval TEXT`,
    `ALTER TABLE workspaces ADD COLUMN cancel_at_period_end INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE workspaces ADD COLUMN current_period_end INTEGER`,
    `ALTER TABLE workspaces ADD COLUMN retention_offer_redeemed_at INTEGER`,
  ]) {
    try {
      sqlite.exec(stmt);
    } catch {
      /* column already exists — fine */
    }
  }
}

/**
 * Boot-time hygiene: expired OTP codes and grants have no value after
 * their window (only hashes/ids are stored, but there's no reason to keep
 * them), and long-dead sessions only bloat the file. Never touches
 * acceptances or audit logs — those are the evidence trail.
 */
function sweepExpired(sqlite: Database.Database) {
  const now = Date.now();
  const day = 86_400_000;
  sqlite
    .prepare(`DELETE FROM otp_codes WHERE expires_at < ?`)
    .run(now - 7 * day);
  sqlite.prepare(`DELETE FROM grants WHERE expires_at < ?`).run(now - day);
  sqlite
    .prepare(`DELETE FROM sessions WHERE expires_at < ?`)
    .run(now - 30 * day);
}

export function getDb() {
  if (_db) return _db;
  try {
    mkdirSync(dirname(DB_PATH), { recursive: true });
  } catch {
    /* directory may already exist */
  }
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  createTables(sqlite);
  try {
    sweepExpired(sqlite);
  } catch {
    /* hygiene is best-effort; never block DB access on it */
  }
  _db = drizzle(sqlite, { schema });
  return _db;
}

export { schema };
