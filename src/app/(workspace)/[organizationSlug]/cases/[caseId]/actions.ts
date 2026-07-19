"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getDatabase } from "@/db/client";
import { createCaseWorkroomRepository } from "@/db/repositories/case-workroom";
import { createOrganizationContextRepository } from "@/db/repositories/organizations";
import { createSessionRepository } from "@/db/repositories/sessions";
import { caseDetailsSchema, caseMessageSchema, caseStatusChangeSchema } from "@/domain/case-workroom";
import { systemClock } from "@/infrastructure/clock";
import { readSessionCookie, type SessionCookieStore } from "@/infrastructure/session-cookie";
import { resolveWorkspaceContext } from "@/services/organization-context";
import { getCurrentUserContext } from "@/services/session-service";

export type WorkroomActionState = { error?: string; fieldErrors?: Record<string, string[] | undefined>; success?: string };

async function contextFor(slug: string) {
  const database = getDatabase(); const jar = await cookies(); const store: SessionCookieStore = { get: (name) => jar.get(name), set: () => undefined };
  const user = await getCurrentUserContext(createSessionRepository(database), systemClock, readSessionCookie(store));
  const context = user ? await resolveWorkspaceContext(createOrganizationContextRepository(database), user, slug) : null;
  return context && context.role !== "CLIENT" ? context : null;
}

function mutationError(result: "UPDATED" | "MISSING" | "STALE") {
  if (result === "STALE") return "This case changed in another session. Refresh before trying again.";
  if (result === "MISSING") return "This case is no longer available.";
}

export async function updateCaseDetailsAction(slug: string, caseId: string, _: WorkroomActionState, formData: FormData): Promise<WorkroomActionState> {
  void _; const context = await contextFor(slug); if (!context) return { error: "Workspace access was not found." };
  const parsed = caseDetailsSchema.safeParse({ categoryId: formData.get("categoryId"), assigneeId: formData.get("assigneeId"), priority: formData.get("priority"), dueAt: formData.get("dueAt") });
  if (!parsed.success) return { error: "Review the highlighted details.", fieldErrors: parsed.error.flatten().fieldErrors };
  const result = await createCaseWorkroomRepository(getDatabase()).updateDetails(context.id, caseId, context.user.userId, new Date(String(formData.get("expectedUpdatedAt"))), parsed.data);
  const error = mutationError(result); if (error) return { error }; revalidatePath(`/${slug}/cases/${caseId}`); revalidatePath(`/${slug}/cases`); return { success: "Case details updated." };
}

export async function changeCaseStatusAction(slug: string, caseId: string, _: WorkroomActionState, formData: FormData): Promise<WorkroomActionState> {
  void _; const context = await contextFor(slug); if (!context) return { error: "Workspace access was not found." }; const parsed = caseStatusChangeSchema.safeParse({ toStatus: formData.get("toStatus") }); if (!parsed.success) return { error: "That status is not available." };
  try { const result = await createCaseWorkroomRepository(getDatabase()).changeStatus(context.id, caseId, context.user.userId, new Date(String(formData.get("expectedUpdatedAt"))), parsed.data.toStatus); const error = mutationError(result); if (error) return { error }; revalidatePath(`/${slug}/cases/${caseId}`); revalidatePath(`/${slug}/cases`); return { success: "Status updated." }; } catch { return { error: "That transition is no longer available. Refresh the case." }; }
}

export async function addCaseMessageAction(slug: string, caseId: string, _: WorkroomActionState, formData: FormData): Promise<WorkroomActionState> {
  void _; const context = await contextFor(slug); if (!context) return { error: "Workspace access was not found." }; const parsed = caseMessageSchema.safeParse({ body: formData.get("body"), visibility: formData.get("visibility") }); if (!parsed.success) return { error: "Write a message before sending.", fieldErrors: parsed.error.flatten().fieldErrors };
  const result = await createCaseWorkroomRepository(getDatabase()).addMessage(context.id, caseId, context.user.userId, new Date(String(formData.get("expectedUpdatedAt"))), parsed.data); const error = mutationError(result); if (error) return { error }; revalidatePath(`/${slug}/cases/${caseId}`); revalidatePath(`/${slug}/overview`); return { success: parsed.data.visibility === "INTERNAL" ? "Internal note added." : "Client reply added." };
}
