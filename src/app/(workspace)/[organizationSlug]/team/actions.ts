"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { getDatabase } from "@/db/client";
import { createInvitationRepository } from "@/db/repositories/invitations";
import { createOrganizationContextRepository } from "@/db/repositories/organizations";
import { createRateLimitRepository } from "@/db/repositories/rate-limits";
import { createSessionRepository } from "@/db/repositories/sessions";
import { createTeamRepository } from "@/db/repositories/team";
import { getServerEnvironment } from "@/env";
import { systemClock } from "@/infrastructure/clock";
import { createLocalInvitationEmailAdapter } from "@/infrastructure/invitation-email";
import { enforceRateLimit } from "@/infrastructure/rate-limit";
import { readSessionCookie, type SessionCookieStore } from "@/infrastructure/session-cookie";
import { inviteMember } from "@/services/invite-member";
import { resolveWorkspaceContext, type WorkspaceContext } from "@/services/organization-context";
import { revokeInvitation } from "@/services/revoke-invitation";
import { getCurrentUserContext } from "@/services/session-service";
import { setTeamMemberActive, updateTeamMemberProfile, updateTeamMemberRole } from "@/services/team-management";

export interface TeamActionState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  previewUrl?: string;
  success?: string;
}

async function requireWorkspace(slug: string): Promise<WorkspaceContext | null> {
  const database = getDatabase();
  const cookieJar = await cookies();
  const cookieStore: SessionCookieStore = { get: (name) => cookieJar.get(name), set: () => undefined };
  const user = await getCurrentUserContext(createSessionRepository(database), systemClock, readSessionCookie(cookieStore));
  return user ? resolveWorkspaceContext(createOrganizationContextRepository(database), user, slug) : null;
}

export async function inviteTeamMemberAction(slug: string, _: TeamActionState, formData: FormData): Promise<TeamActionState> {
  const context = await requireWorkspace(slug);
  if (!context) return { error: "Workspace access was not found." };
  const database = getDatabase();
  const environment = getServerEnvironment();
  const rateLimit = await enforceRateLimit(createRateLimitRepository(database), { action: "team.invite", identifier: `${context.id}|${context.user.userId}`, limit: 20, windowMs: 60 * 60 * 1000, now: systemClock.now(), secret: environment.SESSION_SECRET });
  if (!rateLimit.allowed) return { error: `Too many invitation attempts. Try again in ${rateLimit.retryAfterSeconds} seconds.` };
  const result = await inviteMember(createInvitationRepository(database), createLocalInvitationEmailAdapter(process.env.NODE_ENV === "production"), systemClock, { organizationId: context.id, organizationName: context.name, userId: context.user.userId, role: context.role, appUrl: environment.APP_URL }, { email: String(formData.get("email") ?? ""), role: String(formData.get("role") ?? "") });
  if (!result.ok) return { error: result.error.message, fieldErrors: result.error.fieldErrors };
  revalidatePath(`/${slug}/team`);
  return { success: "Invitation created.", previewUrl: result.data.previewUrl };
}

export async function revokeTeamInvitationAction(slug: string, invitationId: string, _: TeamActionState): Promise<TeamActionState> {
  void _;
  const context = await requireWorkspace(slug);
  if (!context) return { error: "Workspace access was not found." };
  const result = await revokeInvitation(createInvitationRepository(getDatabase()), { organizationId: context.id, role: context.role }, invitationId);
  if (!result.ok) return { error: result.error.message };
  revalidatePath(`/${slug}/team`);
  return { success: "Invitation revoked." };
}

export async function updateTeamRoleAction(slug: string, userId: string, _: TeamActionState, formData: FormData): Promise<TeamActionState> {
  const context = await requireWorkspace(slug);
  if (!context) return { error: "Workspace access was not found." };
  const result = await updateTeamMemberRole(createTeamRepository(getDatabase()), { organizationId: context.id, role: context.role }, { userId, role: String(formData.get("role") ?? "") });
  if (!result.ok) return { error: result.error.message };
  revalidatePath(`/${slug}/team`);
  return { success: "Role updated." };
}

export async function setTeamActiveAction(slug: string, userId: string, active: boolean, _: TeamActionState): Promise<TeamActionState> {
  void _;
  const context = await requireWorkspace(slug);
  if (!context) return { error: "Workspace access was not found." };
  const result = await setTeamMemberActive(createTeamRepository(getDatabase()), { organizationId: context.id, role: context.role }, { userId, active });
  if (!result.ok) return { error: result.error.message };
  revalidatePath(`/${slug}/team`);
  return { success: active ? "Member reactivated." : "Member deactivated." };
}

export async function updateTeamProfileAction(slug: string, userId: string, _: TeamActionState, formData: FormData): Promise<TeamActionState> {
  void _; const context = await requireWorkspace(slug); if (!context) return { error: "Workspace access was not found." };
  const result = await updateTeamMemberProfile(createTeamRepository(getDatabase()), { organizationId: context.id, role: context.role }, { userId, name: String(formData.get("name") ?? ""), title: String(formData.get("title") ?? ""), role: String(formData.get("role") ?? "") });
  if (!result.ok) return { error: result.error.message, fieldErrors: result.error.fieldErrors };
  revalidatePath(`/${slug}/team`); revalidatePath(`/${slug}/team/${userId}`); return { success: "Member profile updated." };
}
