import "server-only";

import type { ClientContactRecord, ClientContactRepository } from "@/db/repositories/client-contacts";
import type { ActionResult } from "@/domain/action-result";
import { clientContactInputSchema } from "@/domain/clients";
import type { WorkspaceRole } from "@/domain/invitations";

type ContactContext = { organizationId: string; role: WorkspaceRole };

function canManageClients(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && error.code === "23505") return true;
  return "cause" in error && isUniqueViolation(error.cause);
}

export async function addClientContact(repository: Pick<ClientContactRepository, "add">, context: ContactContext, clientId: string, input: unknown): Promise<ActionResult<ClientContactRecord>> {
  if (!canManageClients(context.role)) return { ok: false, error: { code: "FORBIDDEN", message: "You do not have permission to manage client contacts." } };
  const parsed = clientContactInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: { code: "VALIDATION", message: "Check the contact details.", fieldErrors: parsed.error.flatten().fieldErrors } };
  try {
    const record = await repository.add(context.organizationId, clientId, parsed.data);
    return record ? { ok: true, data: record } : { ok: false, error: { code: "NOT_FOUND", message: "The client is not available." } };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: { code: "CONFLICT", message: "That email is already used by a contact in this workspace." } };
    throw error;
  }
}

export async function updateClientContact(repository: Pick<ClientContactRepository, "update">, context: ContactContext, clientId: string, contactId: string, input: unknown): Promise<ActionResult<ClientContactRecord>> {
  if (!canManageClients(context.role)) return { ok: false, error: { code: "FORBIDDEN", message: "You do not have permission to manage client contacts." } };
  const parsed = clientContactInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: { code: "VALIDATION", message: "Check the contact details.", fieldErrors: parsed.error.flatten().fieldErrors } };
  try {
    const record = await repository.update(context.organizationId, clientId, contactId, parsed.data);
    return record ? { ok: true, data: record } : { ok: false, error: { code: "NOT_FOUND", message: "The contact is not available." } };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: { code: "CONFLICT", message: "That email is already used by a contact in this workspace." } };
    throw error;
  }
}

export async function archiveClientContact(repository: Pick<ClientContactRepository, "archive">, context: ContactContext, clientId: string, contactId: string, archivedAt = new Date()): Promise<ActionResult<void>> {
  if (!canManageClients(context.role)) return { ok: false, error: { code: "FORBIDDEN", message: "You do not have permission to manage client contacts." } };
  const archived = await repository.archive(context.organizationId, clientId, contactId, archivedAt);
  return archived ? { ok: true, data: undefined } : { ok: false, error: { code: "NOT_FOUND", message: "The contact is not available." } };
}
