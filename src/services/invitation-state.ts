import "server-only";

import type { WorkspaceRole } from "@/domain/invitations";

export interface InvitationState {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  expiresAt: Date;
}

export function invitationCanBeAccepted(invitation: InvitationState | null, now: Date): boolean {
  return Boolean(invitation && invitation.status === "PENDING" && invitation.expiresAt > now);
}

export function canRevokeInvitation(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}
