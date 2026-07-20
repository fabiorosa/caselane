"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getDatabase } from "@/db/client";
import { createOrganizationContextRepository } from "@/db/repositories/organizations";
import { createSessionRepository } from "@/db/repositories/sessions";
import { createSettingsRepository } from "@/db/repositories/settings";
import { systemClock } from "@/infrastructure/clock";
import { readSessionCookie, type SessionCookieStore } from "@/infrastructure/session-cookie";
import { resolveWorkspaceContext, type WorkspaceContext } from "@/services/organization-context";
import { getCurrentUserContext } from "@/services/session-service";
import { saveCategory, setCategoryArchived, updateOrganizationSettings } from "@/services/settings";

export interface SettingsActionState { error?: string; fieldErrors?: Record<string, string[] | undefined>; success?: string }

async function requireWorkspace(slug: string): Promise<WorkspaceContext | null> {
  const database = getDatabase(); const jar = await cookies(); const store: SessionCookieStore = { get: (name) => jar.get(name), set: () => undefined };
  const user = await getCurrentUserContext(createSessionRepository(database), systemClock, readSessionCookie(store));
  return user ? resolveWorkspaceContext(createOrganizationContextRepository(database), user, slug) : null;
}

export async function updateOrganizationAction(slug: string, _: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  void _; const context = await requireWorkspace(slug); if (!context) return { error: "Workspace access was not found." };
  const result = await updateOrganizationSettings(createSettingsRepository(getDatabase()), { organizationId: context.id, role: context.role }, { name: String(formData.get("name") ?? "") });
  if (!result.ok) return { error: result.error.message, fieldErrors: result.error.fieldErrors };
  revalidatePath(`/${slug}/settings`); revalidatePath(`/${slug}/overview`); return { success: "Workspace name updated." };
}

export async function saveCategoryAction(slug: string, categoryId: string | null, _: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  void _; const context = await requireWorkspace(slug); if (!context) return { error: "Workspace access was not found." };
  const result = await saveCategory(createSettingsRepository(getDatabase()), { organizationId: context.id, role: context.role }, categoryId, { name: String(formData.get("name") ?? ""), color: String(formData.get("color") ?? "") });
  if (!result.ok) return { error: result.error.message, fieldErrors: result.error.fieldErrors };
  revalidatePath(`/${slug}/settings`); return { success: categoryId ? "Category updated." : "Category created." };
}

export async function setCategoryArchivedAction(slug: string, categoryId: string, archived: boolean, _: SettingsActionState): Promise<SettingsActionState> {
  void _; const context = await requireWorkspace(slug); if (!context) return { error: "Workspace access was not found." };
  const result = await setCategoryArchived(createSettingsRepository(getDatabase()), { organizationId: context.id, role: context.role }, categoryId, archived);
  if (!result.ok) return { error: result.error.message };
  revalidatePath(`/${slug}/settings`); return { success: archived ? "Category archived." : "Category restored." };
}
