"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createAuthAccountRepository } from "@/db/repositories/auth";
import { createOwnerRegistrationStore } from "@/db/repositories/owner-registration";
import { createSessionRepository } from "@/db/repositories/sessions";
import { getDatabase } from "@/db/client";
import { systemClock } from "@/infrastructure/clock";
import { clearSessionCookie, readSessionCookie, writeSessionCookie, type SessionCookieStore } from "@/infrastructure/session-cookie";
import { safeReturnTo } from "@/domain/safe-return-to";
import { registerOwner } from "@/services/register-owner";
import { signIn } from "@/services/sign-in";
import { signOutCurrentSession } from "@/services/session-service";
import { createDemoAccessRepository } from "@/db/repositories/demo-access";
import { getServerEnvironment } from "@/env";
import { startDemoSession } from "@/services/demo-access";

export interface AuthFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

function cookieStoreAdapter(store: Awaited<ReturnType<typeof cookies>>): SessionCookieStore {
  return {
    get: (name) => store.get(name),
    set: (name, value, options) => store.set({ name, value, ...options }),
  };
}

export async function registerAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const result = await registerOwner(createOwnerRegistrationStore(getDatabase()), systemClock, {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    workspaceName: String(formData.get("workspaceName") ?? ""),
    acceptedTerms: formData.get("acceptedTerms") === "on",
  });

  if (!result.ok) {
    return { error: result.error.message, fieldErrors: result.error.fieldErrors };
  }

  writeSessionCookie(cookieStoreAdapter(await cookies()), result.data.rawSessionToken);
  redirect("/workspace");
}

export async function signInAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const database = getDatabase();
  const result = await signIn(
    createAuthAccountRepository(database),
    createSessionRepository(database),
    systemClock,
    { email: String(formData.get("email") ?? ""), password: String(formData.get("password") ?? "") },
  );

  if (!result.ok) {
    return { error: result.error.message, fieldErrors: result.error.fieldErrors };
  }

  writeSessionCookie(cookieStoreAdapter(await cookies()), result.data.rawSessionToken);
  redirect(safeReturnTo(String(formData.get("returnTo") ?? "")) ?? "/workspace");
}

export async function signOutAction(): Promise<void> {
  const store = cookieStoreAdapter(await cookies());
  await signOutCurrentSession(createSessionRepository(getDatabase()), readSessionCookie(store));
  clearSessionCookie(store);
  redirect("/sign-in");
}

export async function demoAccessAction(formData:FormData):Promise<void> {
  const database=getDatabase(); const result=await startDemoSession(createDemoAccessRepository(database),createSessionRepository(database),systemClock,getServerEnvironment().DEMO_ACCESS_ENABLED,formData.get("persona"));
  if(!result.ok) redirect(`/sign-in?demoError=${encodeURIComponent(result.error.message)}`);
  writeSessionCookie(cookieStoreAdapter(await cookies()),result.data.rawSessionToken); redirect(result.data.destination);
}
