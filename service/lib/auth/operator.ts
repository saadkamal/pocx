import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  OPERATOR_COOKIE,
  checkSession,
} from "@/lib/auth/session";
import {
  getOperatorByEmail,
  getWorkspace,
  getPocById,
} from "@/lib/db/repo";
import type {
  OperatorRow,
  PocRow,
  SessionRow,
  WorkspaceRow,
} from "@/lib/db/schema";

/**
 * Operator (dashboard) auth context for server components, server actions
 * and route handlers. The proxy already redirects unauthenticated page
 * loads, but every data access re-checks here — the proxy is a UX layer,
 * this is the authority.
 */

export type OperatorContext = {
  session: SessionRow;
  operator: OperatorRow;
  workspace: WorkspaceRow;
};

export async function getOperatorContext(): Promise<OperatorContext | null> {
  const jar = await cookies();
  const check = checkSession(jar.get(OPERATOR_COOKIE)?.value, {
    kind: "operator",
  });
  if (!check.ok) return null;

  const operator = getOperatorByEmail(check.session.email);
  if (!operator || operator.disabledAt) return null;

  const workspace = getWorkspace(operator.workspaceId);
  if (!workspace) return null;

  return { session: check.session, operator, workspace };
}

/** For pages: redirect to /login when signed out. */
export async function requireOperator(): Promise<OperatorContext> {
  const ctx = await getOperatorContext();
  if (!ctx) redirect("/login");
  return ctx;
}

/**
 * Load a PoC and prove it belongs to the caller's workspace. Returns null
 * (page → notFound) instead of leaking whether the id exists elsewhere.
 */
export function pocForWorkspace(
  ctx: OperatorContext,
  pocId: string,
): PocRow | null {
  const poc = getPocById(pocId);
  if (!poc || poc.workspaceId !== ctx.workspace.id) return null;
  return poc;
}
