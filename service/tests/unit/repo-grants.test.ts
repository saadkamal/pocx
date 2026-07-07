import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * Exercises the real SQLite repo (temp DB) for the security-critical
 * pieces: single-use grants, session revocation, evaluator allowlisting
 * and the plan seat count.
 */

process.env.POCX_DB_PATH = join(mkdtempSync(join(tmpdir(), "pocx-test-")), "test.db");

type Repo = typeof import("@/lib/db/repo");
type Ids = typeof import("@/lib/ids");

let repo: Repo;
let ids: Ids;

beforeAll(async () => {
  repo = await import("@/lib/db/repo");
  ids = await import("@/lib/ids");
});

function makePoc(): string {
  const id = ids.newPocId();
  repo.createPoc({
    id,
    workspaceId: "ws_test",
    slug: `poc-${id.slice(4)}`,
    name: "Test PoC",
    ownerEntity: "Acme Pte Ltd",
    ownerRegNo: null,
    clientEntity: null,
    purpose: null,
    supportEmail: null,
    brandColor: "#7C5CFF",
    logoUrl: null,
    appUrl: "https://app.example.com",
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
  return id;
}

describe("grants are single-use", () => {
  it("consumes exactly once", () => {
    const pocId = makePoc();
    const grantId = ids.newGrantId();
    repo.createGrant({
      id: grantId,
      pocId,
      sessionId: "sess_x",
      email: "jane@client.com",
      returnTo: "https://app.example.com/",
      expiresAt: Date.now() + 120_000,
    });

    const first = repo.consumeGrant(grantId, pocId);
    expect(first?.email).toBe("jane@client.com");
    // Replay → dead.
    expect(repo.consumeGrant(grantId, pocId)).toBeNull();
  });

  it("rejects expired grants and wrong-PoC redemption", () => {
    const pocId = makePoc();
    const otherPoc = makePoc();
    const expired = ids.newGrantId();
    repo.createGrant({
      id: expired,
      pocId,
      sessionId: "sess_x",
      email: "jane@client.com",
      returnTo: "https://app.example.com/",
      expiresAt: Date.now() - 1,
    });
    expect(repo.consumeGrant(expired, pocId)).toBeNull();

    const fresh = ids.newGrantId();
    repo.createGrant({
      id: fresh,
      pocId,
      sessionId: "sess_x",
      email: "jane@client.com",
      returnTo: "https://app.example.com/",
      expiresAt: Date.now() + 120_000,
    });
    // A different PoC's credentials cannot redeem it…
    expect(repo.consumeGrant(fresh, otherPoc)).toBeNull();
    // …and the rightful PoC still can (the guarded UPDATE didn't consume it).
    expect(repo.consumeGrant(fresh, pocId)?.id).toBe(fresh);
  });
});

describe("sessions + evaluators", () => {
  it("revoke-all hits only the target PoC's live gate sessions", () => {
    const a = makePoc();
    const b = makePoc();
    for (const [poc, n] of [
      [a, 2],
      [b, 1],
    ] as const) {
      for (let i = 0; i < n; i++) {
        repo.createSessionRow({
          id: ids.newSessionId(),
          kind: "gate",
          email: `u${i}@x.com`,
          pocId: poc,
          expiresAt: Date.now() + 3_600_000,
        });
      }
    }
    expect(repo.revokeAllGateSessions(a)).toBe(2);
    expect(repo.revokeAllGateSessions(a)).toBe(0); // already revoked
    expect(repo.revokeAllGateSessions(b)).toBe(1); // untouched before now
  });

  it("disabled evaluators are not allowed; re-adding re-enables", () => {
    const pocId = makePoc();
    const evId = ids.newEvaluatorId();
    repo.addEvaluator({ id: evId, pocId, email: "eve@client.com" });
    expect(repo.isEvaluatorAllowed(pocId, "eve@client.com")).toBe(true);
    expect(repo.countActiveEvaluators(pocId)).toBe(1);

    const stored = repo.getEvaluator(pocId, "eve@client.com")!;
    repo.setEvaluatorDisabled(stored.id, true);
    expect(repo.isEvaluatorAllowed(pocId, "eve@client.com")).toBe(false);
    expect(repo.countActiveEvaluators(pocId)).toBe(0);

    // Upsert re-enables the same seat (no duplicate row).
    repo.addEvaluator({ id: ids.newEvaluatorId(), pocId, email: "eve@client.com" });
    expect(repo.isEvaluatorAllowed(pocId, "eve@client.com")).toBe(true);
    expect(repo.listEvaluators(pocId)).toHaveLength(1);
  });
});
