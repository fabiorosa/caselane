import "server-only";

import type { ActionResult } from "@/domain/action-result";
import { canInviteMembers, inviteMemberInputSchema, type WorkspaceRole } from "@/domain/invitations";
import type { Clock } from "@/infrastructure/clock";
import type { InvitationEmailAdapter } from "@/infrastructure/invitation-email";
import { generateOpaqueToken, hashOpaqueToken } from "@/infrastructure/tokens";

const invitationLifetimeMs = 1000 * 60 * 60 * 24 * 7;

export interface InvitationStore {
  create(input: { organizationId: string; invitedById: string; email: string; role: "ADMIN" | "MEMBER"; tokenHash: string; expiresAt: Date }): Promise<{ id: string }>;
}

export async function inviteMember(
  store: InvitationStore,
  emailAdapter: InvitationEmailAdapter,
  clock: Clock,
  context: { organizationId: string; organizationName: string; userId: string; role: WorkspaceRole; appUrl: string },
  input: { email: string; role: string },
): Promise<ActionResult<{ invitationId: string; previewUrl?: string }>> {
  if (!canInviteMembers(context.role)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "You do not have permission to invite team members." } };
  }

  const parsed = inviteMemberInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { code: "VALIDATION", message: "Review the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors } };
  }

  const rawToken = generateOpaqueToken();
  const invitation = await store.create({
    organizationId: context.organizationId,
    invitedById: context.userId,
    email: parsed.data.email,
    role: parsed.data.role,
    tokenHash: hashOpaqueToken(rawToken),
    expiresAt: new Date(clock.now().getTime() + invitationLifetimeMs),
  });
  const acceptUrl = new URL(`/accept-invite/${rawToken}`, context.appUrl).toString();
  const delivery = await emailAdapter.send({ email: parsed.data.email, organizationName: context.organizationName, role: parsed.data.role, acceptUrl });

  return { ok: true, data: { invitationId: invitation.id, ...delivery } };
}
