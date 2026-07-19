"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDatabase } from "@/db/client";
import { createCaseIntakeRepository } from "@/db/repositories/case-intake";
import { createOrganizationContextRepository } from "@/db/repositories/organizations";
import { createSessionRepository } from "@/db/repositories/sessions";
import { systemClock } from "@/infrastructure/clock";
import { readSessionCookie, type SessionCookieStore } from "@/infrastructure/session-cookie";
import { createCase } from "@/services/case-intake";
import { resolveWorkspaceContext } from "@/services/organization-context";
import { getCurrentUserContext } from "@/services/session-service";

export interface CaseFormState { error?: string; fieldErrors?: Record<string, string[] | undefined>; values?: Record<string, string>; }

export async function createCaseAction(slug: string, _: CaseFormState, formData: FormData): Promise<CaseFormState> {
  void _; const jar = await cookies(); const store: SessionCookieStore = { get: (name) => jar.get(name), set: () => undefined }; const database = getDatabase();
  const user = await getCurrentUserContext(createSessionRepository(database), systemClock, readSessionCookie(store));
  const context = user ? await resolveWorkspaceContext(createOrganizationContextRepository(database), user, slug) : null;
  const keys = ["clientId", "requesterContactId", "categoryId", "assigneeId", "title", "description", "priority", "dueAt"];
  const values = Object.fromEntries(keys.map((key) => [key, String(formData.get(key) ?? "")]));
  if (!context) return { error: "Workspace access was not found.", values };
  const result = await createCase(createCaseIntakeRepository(database), { organizationId: context.id, userId: user!.userId, role: context.role }, values);
  if (!result.ok) return { error: result.error.message, fieldErrors: result.error.fieldErrors, values };
  revalidatePath(`/${slug}/cases`); revalidatePath(`/${slug}/overview`); redirect(`/${slug}/cases?created=${result.data.sequence}`);
}
