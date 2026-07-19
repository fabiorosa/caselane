import "server-only";

import type { Database } from "@/db/client";
import { addPortalReply, submitPortalRequest, type PortalIdentity } from "@/db/repositories/portal";
import type { ActionResult } from "@/domain/action-result";
import { portalReplySchema, portalRequestSchema } from "@/domain/portal";

export async function createPortalRequest(database: Database, identity: PortalIdentity, input: unknown): Promise<ActionResult<{ id: string; sequence: number }>> {
  const parsed = portalRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: { code: "VALIDATION", message: "Check the request details.", fieldErrors: parsed.error.flatten().fieldErrors } };
  try { return { ok: true, data: await submitPortalRequest(database, identity, parsed.data) }; }
  catch (error) {
    if (error instanceof Error && (error.message.includes("relationship") || error.message.includes("Category"))) return { ok: false, error: { code: "FORBIDDEN", message: "This request can no longer be submitted. Contact your service team." } };
    throw error;
  }
}

export async function createPortalReply(database: Database, identity: PortalIdentity, caseId: string, input: unknown): Promise<ActionResult<null>> {
  const parsed = portalReplySchema.safeParse(input); if (!parsed.success) return { ok: false, error: { code: "VALIDATION", message: "Check your reply.", fieldErrors: parsed.error.flatten().fieldErrors } };
  const added = await addPortalReply(database, identity, caseId, parsed.data); return added ? { ok: true, data: null } : { ok: false, error: { code: "NOT_FOUND", message: "This request is not available." } };
}
