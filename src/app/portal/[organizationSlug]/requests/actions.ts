"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDatabase } from "@/db/client";
import { resolvePortalIdentity } from "@/db/repositories/portal";
import { createSessionRepository } from "@/db/repositories/sessions";
import { readSessionCookie, type SessionCookieStore } from "@/infrastructure/session-cookie";
import { systemClock } from "@/infrastructure/clock";
import { createPortalRequest } from "@/services/portal";
import { createPortalReply } from "@/services/portal";
import { revalidatePath } from "next/cache";
import { getCurrentUserContext } from "@/services/session-service";

export interface PortalRequestFormState { error?: string; fieldErrors?: Record<string, string[] | undefined>; values?: Record<string, string>; }

export async function submitPortalRequestAction(slug: string, _: PortalRequestFormState, formData: FormData): Promise<PortalRequestFormState> {
  const values = { title: String(formData.get("title") ?? ""), description: String(formData.get("description") ?? ""), categoryId: String(formData.get("categoryId") ?? "") };
  const jar = await cookies(); const store: SessionCookieStore = { get: (name) => jar.get(name), set: () => undefined }; const database = getDatabase();
  const user = await getCurrentUserContext(createSessionRepository(database), systemClock, readSessionCookie(store));
  if (!user) redirect(`/sign-in?returnTo=/portal/${slug}/requests/new`);
  const identity = await resolvePortalIdentity(database, user.userId, slug);
  if (!identity) return { error: "This portal is not available for your account.", values };
  const result = await createPortalRequest(database, identity, values);
  if (!result.ok) return { error: result.error.message, fieldErrors: result.error.fieldErrors, values };
  redirect(`/portal/${slug}/requests?created=${result.data.sequence}`);
}

export interface PortalReplyState { error?: string; fieldErrors?: Record<string, string[] | undefined>; success?: string; }
export async function addPortalReplyAction(slug: string, caseId: string, _: PortalReplyState, formData: FormData): Promise<PortalReplyState> {
  const jar = await cookies(); const store: SessionCookieStore = { get: (name) => jar.get(name), set: () => undefined }; const database = getDatabase(); const user = await getCurrentUserContext(createSessionRepository(database), systemClock, readSessionCookie(store)); if (!user) redirect(`/sign-in?returnTo=/portal/${slug}/requests/${caseId}`); const identity = await resolvePortalIdentity(database,user.userId,slug); if(!identity) return {error:"This portal is not available for your account."}; const result=await createPortalReply(database,identity,caseId,{body:String(formData.get("body")??"")}); if(!result.ok) return {error:result.error.message,fieldErrors:result.error.fieldErrors}; revalidatePath(`/portal/${slug}/requests/${caseId}`); revalidatePath(`/portal/${slug}/requests`); return {success:"Reply sent to the team."};
}
