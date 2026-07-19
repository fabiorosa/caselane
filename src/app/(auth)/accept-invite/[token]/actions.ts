"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDatabase } from "@/db/client";
import { createInvitationRepository } from "@/db/repositories/invitations";
import { createSessionRepository } from "@/db/repositories/sessions";
import { systemClock } from "@/infrastructure/clock";
import { readSessionCookie, writeSessionCookie, type SessionCookieStore } from "@/infrastructure/session-cookie";
import { acceptInvitationForExistingUser, acceptInvitationForNewUser } from "@/services/accept-invitation";
import { getCurrentUserContext } from "@/services/session-service";

export interface InvitationFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

function adaptCookies(store: Awaited<ReturnType<typeof cookies>>): SessionCookieStore {
  return { get: (name) => store.get(name), set: (name, value, options) => store.set({ name, value, ...options }) };
}

export async function acceptExistingInvitationAction(token: string, _: InvitationFormState): Promise<InvitationFormState> {
  void _;
  const database = getDatabase();
  const cookieStore = adaptCookies(await cookies());
  const user = await getCurrentUserContext(createSessionRepository(database), systemClock, readSessionCookie(cookieStore));
  if (!user) return { error: "Sign in with the invited email address to continue." };

  const result = await acceptInvitationForExistingUser(createInvitationRepository(database), systemClock.now(), { rawToken: token, user });
  if (!result.ok) return { error: result.error.message, fieldErrors: result.error.fieldErrors };
  redirect(`/${result.data.organizationSlug}/overview`);
}

export async function acceptNewInvitationAction(token: string, _: InvitationFormState, formData: FormData): Promise<InvitationFormState> {
  const database = getDatabase();
  const cookieStore = adaptCookies(await cookies());
  const currentUser = await getCurrentUserContext(createSessionRepository(database), systemClock, readSessionCookie(cookieStore));
  if (currentUser) return { error: "This invitation must be accepted with the invited account." };

  const result = await acceptInvitationForNewUser(createInvitationRepository(database), systemClock, {
    rawToken: token,
    name: String(formData.get("name") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!result.ok) return { error: result.error.message, fieldErrors: result.error.fieldErrors };

  writeSessionCookie(cookieStore, result.data.rawSessionToken);
  redirect(`/${result.data.organizationSlug}/overview`);
}
