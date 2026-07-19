import "server-only";

import type { ActionResult } from "@/domain/action-result";
import type { WorkspaceRole } from "@/domain/invitations";
import type { TeamRepository } from "@/db/repositories/team";
import { teamMemberProfileSchema } from "@/domain/team-member";

function canManageTeam(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export async function updateTeamMemberProfile(repository: Pick<TeamRepository, "updateProfile">, context: { organizationId: string; role: WorkspaceRole }, input: { userId: string; name: string; title: string; role: string }): Promise<ActionResult<void>> {
  if (!canManageTeam(context.role)) return { ok: false, error: { code: "FORBIDDEN", message: "You do not have permission to edit team profiles." } };
  const parsed = teamMemberProfileSchema.safeParse(input); if (!parsed.success) return { ok: false, error: { code: "VALIDATION", message: "Review the highlighted profile details.", fieldErrors: parsed.error.flatten().fieldErrors } };
  const updated = await repository.updateProfile(context.organizationId, input.userId, parsed.data); return updated ? { ok: true, data: undefined } : { ok: false, error: { code: "NOT_FOUND", message: "The workspace owner cannot be edited here." } };
}

export async function updateTeamMemberRole(
  repository: Pick<TeamRepository, "updateRole">,
  context: { organizationId: string; role: WorkspaceRole },
  input: { userId: string; role: string },
): Promise<ActionResult<void>> {
  if (!canManageTeam(context.role)) return { ok: false, error: { code: "FORBIDDEN", message: "You do not have permission to change team roles." } };
  if (input.role !== "ADMIN" && input.role !== "MEMBER") return { ok: false, error: { code: "VALIDATION", message: "Choose an administrator or member role." } };
  const updated = await repository.updateRole(context.organizationId, input.userId, input.role);
  return updated ? { ok: true, data: undefined } : { ok: false, error: { code: "NOT_FOUND", message: "This team member cannot be changed." } };
}

export async function setTeamMemberActive(
  repository: Pick<TeamRepository, "setActive">,
  context: { organizationId: string; role: WorkspaceRole },
  input: { userId: string; active: boolean },
): Promise<ActionResult<void>> {
  if (!canManageTeam(context.role)) return { ok: false, error: { code: "FORBIDDEN", message: "You do not have permission to change team access." } };
  const updated = await repository.setActive(context.organizationId, input.userId, input.active);
  return updated ? { ok: true, data: undefined } : { ok: false, error: { code: "NOT_FOUND", message: "The workspace owner cannot be deactivated or changed." } };
}
