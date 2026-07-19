import "server-only";

import type { ActionResult } from "@/domain/action-result";
import { canRevokeInvitation } from "./invitation-state";
import type { WorkspaceRole } from "@/domain/invitations";

export interface InvitationRevocationStore {
  revoke(organizationId: string, invitationId: string): Promise<boolean>;
}

export async function revokeInvitation(
  store: InvitationRevocationStore,
  context: { organizationId: string; role: WorkspaceRole },
  invitationId: string,
): Promise<ActionResult<void>> {
  if (!canRevokeInvitation(context.role)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "You do not have permission to revoke invitations." } };
  }

  const revoked = await store.revoke(context.organizationId, invitationId);
  if (!revoked) return { ok: false, error: { code: "NOT_FOUND", message: "This pending invitation was not found." } };
  return { ok: true, data: undefined };
}
