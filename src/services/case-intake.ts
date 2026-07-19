import "server-only";

import type { CaseIntakeRepository } from "@/db/repositories/case-intake";
import { InvalidCaseReferenceError } from "@/db/repositories/case-intake";
import type { ActionResult } from "@/domain/action-result";
import { caseIntakeSchema } from "@/domain/case-intake";
import type { WorkspaceRole } from "@/domain/invitations";

export async function createCase(repository: CaseIntakeRepository, context: { organizationId: string; userId: string; role: WorkspaceRole }, input: unknown): Promise<ActionResult<{ id: string; sequence: number }>> {
  if (context.role === "CLIENT") return { ok: false, error: { code: "FORBIDDEN", message: "You do not have permission to create internal cases." } };
  const parsed = caseIntakeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: { code: "VALIDATION", message: "Check the case details.", fieldErrors: parsed.error.flatten().fieldErrors } };
  try { return { ok: true, data: await repository.create(context.organizationId, context.userId, parsed.data) }; }
  catch (error) { if (error instanceof InvalidCaseReferenceError) return { ok: false, error: { code: "VALIDATION", message: `${error.reference[0]}${error.reference.slice(1).toLowerCase()} is not available in this workspace.` } }; throw error; }
}
