import "server-only";

import type { ClientManagementRepository } from "@/db/repositories/client-management";
import type { ActionResult } from "@/domain/action-result";
import { clientFormInputSchema } from "@/domain/clients";
import type { WorkspaceRole } from "@/domain/invitations";

type Context = { organizationId: string; role: WorkspaceRole };

function canManage(role: WorkspaceRole) { return role === "OWNER" || role === "ADMIN"; }
function uniqueViolation(error: unknown): boolean { return typeof error === "object" && error !== null && (("code" in error && error.code === "23505") || ("cause" in error && uniqueViolation(error.cause))); }

async function persist(operation: () => Promise<{ id: string } | null>): Promise<ActionResult<{ id: string }>> {
  try {
    const client = await operation();
    return client ? { ok: true, data: client } : { ok: false, error: { code: "NOT_FOUND", message: "The client is not available." } };
  } catch (error) {
    if (uniqueViolation(error)) return { ok: false, error: { code: "CONFLICT", message: "That contact email is already used in this workspace." } };
    throw error;
  }
}

export async function createClient(repository: Pick<ClientManagementRepository, "create">, context: Context, input: unknown): Promise<ActionResult<{ id: string }>> {
  if (!canManage(context.role)) return { ok: false, error: { code: "FORBIDDEN", message: "You do not have permission to create clients." } };
  const parsed = clientFormInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: { code: "VALIDATION", message: "Check the client details.", fieldErrors: parsed.error.flatten().fieldErrors } };
  return persist(() => repository.create(context.organizationId, parsed.data));
}

export async function updateClient(repository: Pick<ClientManagementRepository, "update">, context: Context, clientId: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  if (!canManage(context.role)) return { ok: false, error: { code: "FORBIDDEN", message: "You do not have permission to update clients." } };
  const parsed = clientFormInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: { code: "VALIDATION", message: "Check the client details.", fieldErrors: parsed.error.flatten().fieldErrors } };
  return persist(() => repository.update(context.organizationId, clientId, parsed.data));
}
