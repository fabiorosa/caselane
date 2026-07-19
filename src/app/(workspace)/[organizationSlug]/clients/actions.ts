"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDatabase } from "@/db/client";
import { createClientManagementRepository } from "@/db/repositories/client-management";
import { createClientContactRepository } from "@/db/repositories/client-contacts";
import { createClientRepository } from "@/db/repositories/clients";
import { createOrganizationContextRepository } from "@/db/repositories/organizations";
import { createSessionRepository } from "@/db/repositories/sessions";
import { systemClock } from "@/infrastructure/clock";
import { readSessionCookie, type SessionCookieStore } from "@/infrastructure/session-cookie";
import { createClient, updateClient } from "@/services/client-management";
import { addClientContact, archiveClientContact, updateClientContact } from "@/services/client-contacts";
import { resolveWorkspaceContext, type WorkspaceContext } from "@/services/organization-context";
import { getCurrentUserContext } from "@/services/session-service";

export interface ClientFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
}

export interface ContactActionState { error?: string; fieldErrors?: Record<string, string[] | undefined>; success?: string; }

async function requireWorkspace(slug: string): Promise<WorkspaceContext | null> {
  const database = getDatabase();
  const cookieJar = await cookies();
  const cookieStore: SessionCookieStore = { get: (name) => cookieJar.get(name), set: () => undefined };
  const user = await getCurrentUserContext(createSessionRepository(database), systemClock, readSessionCookie(cookieStore));
  return user ? resolveWorkspaceContext(createOrganizationContextRepository(database), user, slug) : null;
}

function values(formData: FormData): Record<string, string> {
  return Object.fromEntries(["name", "externalReference", "notes", "contactName", "contactEmail", "contactJobTitle"].map((key) => [key, String(formData.get(key) ?? "")]));
}

export async function createClientAction(slug: string, _: ClientFormState, formData: FormData): Promise<ClientFormState> {
  void _;
  const context = await requireWorkspace(slug);
  const preserved = values(formData);
  if (!context) return { error: "Workspace access was not found.", values: preserved };
  const result = await createClient(createClientManagementRepository(getDatabase()), { organizationId: context.id, role: context.role }, preserved);
  if (!result.ok) return { error: result.error.message, fieldErrors: result.error.fieldErrors, values: preserved };
  revalidatePath(`/${slug}/clients`);
  redirect(`/${slug}/clients`);
}

export async function updateClientAction(slug: string, clientId: string, _: ClientFormState, formData: FormData): Promise<ClientFormState> {
  void _;
  const context = await requireWorkspace(slug);
  const preserved = values(formData);
  if (!context) return { error: "Workspace access was not found.", values: preserved };
  const result = await updateClient(createClientManagementRepository(getDatabase()), { organizationId: context.id, role: context.role }, clientId, preserved);
  if (!result.ok) return { error: result.error.message, fieldErrors: result.error.fieldErrors, values: preserved };
  revalidatePath(`/${slug}/clients`);
  redirect(`/${slug}/clients`);
}

function contactValues(formData: FormData) {
  return { name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? ""), jobTitle: String(formData.get("jobTitle") ?? ""), isPrimary: formData.get("isPrimary") === "on" };
}

export async function saveContactAction(slug: string, clientId: string, contactId: string | null, _: ContactActionState, formData: FormData): Promise<ContactActionState> {
  void _;
  const context = await requireWorkspace(slug);
  if (!context) return { error: "Workspace access was not found." };
  const repository = createClientContactRepository(getDatabase());
  const input = contactValues(formData);
  const result = contactId ? await updateClientContact(repository, { organizationId: context.id, role: context.role }, clientId, contactId, input) : await addClientContact(repository, { organizationId: context.id, role: context.role }, clientId, input);
  if (!result.ok) return { error: result.error.message, fieldErrors: result.error.fieldErrors };
  revalidatePath(`/${slug}/clients/${clientId}`);
  return { success: contactId ? "Contact updated." : "Contact added." };
}

export async function archiveContactAction(slug: string, clientId: string, contactId: string): Promise<void> {
  const context = await requireWorkspace(slug);
  if (!context) return;
  await archiveClientContact(createClientContactRepository(getDatabase()), { organizationId: context.id, role: context.role }, clientId, contactId);
  revalidatePath(`/${slug}/clients/${clientId}`);
}

export async function archiveClientAction(slug: string, clientId: string): Promise<void> {
  const context = await requireWorkspace(slug);
  if (!context || (context.role !== "OWNER" && context.role !== "ADMIN")) return;
  await createClientRepository(getDatabase()).archive(context.id, clientId, new Date());
  revalidatePath(`/${slug}/clients`);
  revalidatePath(`/${slug}/clients/${clientId}`);
}
