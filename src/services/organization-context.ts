import "server-only";

import type { OrganizationContextRepository, AccessibleOrganization } from "@/db/repositories/organizations";
import type { CurrentUserContext } from "./session-service";

export interface WorkspaceContext extends AccessibleOrganization {
  user: CurrentUserContext;
}

export async function resolveWorkspaceContext(
  repository: OrganizationContextRepository,
  user: CurrentUserContext,
  organizationSlug: string,
): Promise<WorkspaceContext | null> {
  const organization = await repository.findActiveOrganizationBySlug(user.userId, organizationSlug);
  return organization ? { ...organization, user } : null;
}
