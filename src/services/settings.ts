import "server-only";
import type { SettingsRepository } from "@/db/repositories/settings";
import type { ActionResult } from "@/domain/action-result";
import type { WorkspaceRole } from "@/domain/invitations";
import { categorySettingsSchema, organizationSettingsSchema } from "@/domain/settings";

type Context = { organizationId: string; role: WorkspaceRole };
const canManageCategories = (role: WorkspaceRole) => role === "OWNER" || role === "ADMIN";
const conflict = (error: unknown): boolean => typeof error === "object" && error !== null && (("code" in error && error.code === "23505") || ("cause" in error && conflict(error.cause)));

export async function updateOrganizationSettings(repository: Pick<SettingsRepository, "updateOrganizationName">, context: Context, input: unknown): Promise<ActionResult<void>> {
  if (context.role !== "OWNER") return { ok: false, error: { code: "FORBIDDEN", message: "Only the workspace owner can change its name." } };
  const parsed = organizationSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: { code: "VALIDATION", message: "Check the workspace name.", fieldErrors: parsed.error.flatten().fieldErrors } };
  return await repository.updateOrganizationName(context.organizationId, parsed.data.name) ? { ok: true, data: undefined } : { ok: false, error: { code: "NOT_FOUND", message: "Workspace settings were not found." } };
}

export async function saveCategory(repository: Pick<SettingsRepository, "createCategory" | "updateCategory">, context: Context, categoryId: string | null, input: unknown): Promise<ActionResult<void>> {
  if (!canManageCategories(context.role)) return { ok: false, error: { code: "FORBIDDEN", message: "You do not have permission to manage categories." } };
  const parsed = categorySettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: { code: "VALIDATION", message: "Check the category details.", fieldErrors: parsed.error.flatten().fieldErrors } };
  try {
    if (categoryId) {
      if (!(await repository.updateCategory(context.organizationId, categoryId, parsed.data))) return { ok: false, error: { code: "NOT_FOUND", message: "Category was not found." } };
    } else await repository.createCategory(context.organizationId, parsed.data);
    return { ok: true, data: undefined };
  } catch (error) {
    if (conflict(error)) return { ok: false, error: { code: "CONFLICT", message: "A category with that name already exists." } };
    throw error;
  }
}

export async function setCategoryArchived(repository: Pick<SettingsRepository, "setCategoryArchived">, context: Context, categoryId: string, archived: boolean): Promise<ActionResult<void>> {
  if (!canManageCategories(context.role)) return { ok: false, error: { code: "FORBIDDEN", message: "You do not have permission to manage categories." } };
  return await repository.setCategoryArchived(context.organizationId, categoryId, archived) ? { ok: true, data: undefined } : { ok: false, error: { code: "NOT_FOUND", message: "Category was not found." } };
}
