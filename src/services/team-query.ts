import "server-only";

import type { TeamRepository } from "@/db/repositories/team";

export async function getTeamManagementData(repository: Pick<TeamRepository, "listMembers" | "listPendingInvitations">, organizationId: string) {
  const [members, pendingInvitations] = await Promise.all([
    repository.listMembers(organizationId),
    repository.listPendingInvitations(organizationId),
  ]);
  return { members, pendingInvitations };
}
