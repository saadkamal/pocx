import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * The Project Falcon public demo: seeding is idempotent, open enrollment
 * is pinned to the demo PoC's id, and the full chain a visitor rides —
 * enroll → session → grant → single-use exchange → HS256 token — holds
 * together against a real (temp) SQLite database.
 */

process.env.POCX_DB_PATH = join(
  mkdtempSync(join(tmpdir(), "pocx-demo-test-")),
  "test.db",
);

type Repo = typeof import("@/lib/db/repo");
type Demo = typeof import("@/lib/demo");
type Ids = typeof import("@/lib/ids");
type Jwt = typeof import("@/lib/tokens/jwt");

let repo: Repo;
let demo: Demo;
let ids: Ids;
let jwt: Jwt;

beforeAll(async () => {
  repo = await import("@/lib/db/repo");
  demo = await import("@/lib/demo");
  ids = await import("@/lib/ids");
  jwt = await import("@/lib/tokens/jwt");
});

describe("project falcon demo", () => {
  it("seeds once and is idempotent", () => {
    const first = demo.ensureDemoPoc();
    const second = demo.ensureDemoPoc();
    expect(second.id).toBe(first.id);
    expect(first.slug).toBe(demo.DEMO_SLUG);
    expect(first.appUrl?.endsWith("/demo")).toBe(true);
    expect(first.callbackPath).toBe("/api/demo/callback");

    // Operator-less pro workspace: no seat limit, no dashboard access.
    const ws = repo.getWorkspace(first.workspaceId);
    expect(ws?.plan).toBe("pro");
    expect(repo.listOperators(first.workspaceId)).toHaveLength(0);
  });

  it("identifies only the pinned demo PoC", () => {
    const poc = demo.ensureDemoPoc();
    expect(demo.isDemoPoc(poc)).toBe(true);

    const wsId = ids.newWorkspaceId();
    repo.createWorkspace({ id: wsId, name: "Customer Co" });
    const otherId = ids.newPocId();
    repo.createPoc({
      id: otherId,
      workspaceId: wsId,
      slug: "customer-poc",
      name: "Customer PoC",
      ownerEntity: "Customer Co",
      ownerRegNo: null,
      clientEntity: null,
      purpose: null,
      supportEmail: null,
      brandColor: "#17140F",
      logoUrl: null,
      appUrl: null,
      callbackPath: "/api/pocx/callback",
      publicKey: ids.newPublicKey(),
      secret: ids.newSecret(),
      termsMode: "template",
      termsCustomText: null,
      termsVersion: "1.0",
      sessionTtlHours: 24,
      idleTimeoutHours: 3,
      otpTtlMinutes: 10,
      status: "active",
    });
    expect(demo.isDemoPoc(repo.getPocById(otherId)!)).toBe(false);
  });

  it("open-enrolls any email and re-enables a disabled one", () => {
    const poc = demo.ensureDemoPoc();
    const email = "visitor@example.com";

    expect(repo.isEvaluatorAllowed(poc.id, email)).toBe(false);
    repo.addEvaluator({
      id: ids.newEvaluatorId(),
      pocId: poc.id,
      email,
      addedBy: "demo",
    });
    expect(repo.isEvaluatorAllowed(poc.id, email)).toBe(true);

    // Disabled (e.g. by an operator) then re-enrolled → allowed again.
    const row = repo.getEvaluator(poc.id, email)!;
    repo.setEvaluatorDisabled(row.id, true);
    expect(repo.isEvaluatorAllowed(poc.id, email)).toBe(false);
    repo.addEvaluator({
      id: ids.newEvaluatorId(),
      pocId: poc.id,
      email,
      addedBy: "demo",
    });
    expect(repo.isEvaluatorAllowed(poc.id, email)).toBe(true);
  });

  it("rides the full chain: session → grant → exchange → verified token", () => {
    const poc = demo.ensureDemoPoc();
    const email = "rider@example.com";
    const now = Date.now();

    const sessionId = ids.newSessionId();
    repo.createSessionRow({
      id: sessionId,
      kind: "gate",
      email,
      pocId: poc.id,
      expiresAt: now + poc.sessionTtlHours * 3_600_000,
    });

    const grantId = ids.newGrantId();
    repo.createGrant({
      id: grantId,
      pocId: poc.id,
      sessionId,
      email,
      returnTo: poc.appUrl!,
      expiresAt: now + 120_000,
    });

    // Exchange — exactly what /api/demo/callback does.
    const grant = repo.consumeGrant(grantId, poc.id);
    expect(grant?.email).toBe(email);
    // Single-use: a replay redeems nothing.
    expect(repo.consumeGrant(grantId, poc.id)).toBeNull();

    const session = repo.getSessionRow(grant!.sessionId)!;
    const token = jwt.signJwt(
      {
        sub: grant!.email,
        poc: poc.slug,
        sid: session.id,
        tv: poc.termsVersion,
        exp: Math.floor(session.expiresAt.getTime() / 1000),
      },
      poc.secret,
    );

    const check = jwt.verifyJwt(token, poc.secret);
    expect(check.ok).toBe(true);
    if (check.ok) {
      expect(check.claims.sub).toBe(email);
      expect(check.claims.sid).toBe(sessionId);
      expect(check.claims.tv).toBe(poc.termsVersion);
    }

    // Revocation bites: the live check the /demo page performs fails.
    repo.revokeSession(sessionId);
    expect(repo.getSessionRow(sessionId)?.revokedAt).not.toBeNull();
  });

  it("stores the typed-name signature on the acceptance record", () => {
    const poc = demo.ensureDemoPoc();
    const email = "signer@example.com";
    const id = ids.newSignatureId();
    repo.insertAcceptance({
      id,
      pocId: poc.id,
      email,
      signerName: "Ada Lovelace",
      termsVersion: poc.termsVersion,
      termsHash: "deadbeef",
      termsText: "terms",
      ip: "203.0.113.7",
      userAgent: "vitest",
    });
    const row = repo.getLatestAcceptance(poc.id, email, poc.termsVersion);
    expect(row?.id).toBe(id);
    expect(row?.signerName).toBe("Ada Lovelace");
  });
});
