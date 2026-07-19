import "server-only";

import type { ActionResult } from "@/domain/action-result";
import { normalizeEmail, passwordSchema } from "@/domain/auth";
import { z } from "zod";
import type { Clock } from "@/infrastructure/clock";
import { argon2PasswordService, type PasswordService } from "@/infrastructure/password";
import { generateOpaqueToken, hashOpaqueToken } from "@/infrastructure/tokens";
import type { InvitationState } from "./invitation-state";
import { invitationCanBeAccepted } from "./invitation-state";

export interface InvitationAcceptanceStore {
  findByTokenHash(tokenHash: string): Promise<InvitationState | null>;
  acceptExistingUser(input: { invitationId: string; organizationId: string; userId: string; role: "ADMIN" | "MEMBER"; acceptedAt: Date }): Promise<void>;
  acceptNewUser(input: { invitationId: string; organizationId: string; email: string; name: string; passwordHash: string; role: "ADMIN" | "MEMBER"; tokenHash: string; expiresAt: Date; acceptedAt: Date }): Promise<{ userId: string }>;
}

const newUserSchema = z.object({ name: z.string().trim().min(2).max(120), password: passwordSchema });

export async function acceptInvitationForExistingUser(
  store: InvitationAcceptanceStore,
  now: Date,
  input: { rawToken: string; user: { userId: string; email: string } },
): Promise<ActionResult<{ organizationId: string; organizationSlug: string }>> {
  const invitation = await store.findByTokenHash(hashOpaqueToken(input.rawToken));
  if (!invitation || !invitationCanBeAccepted(invitation, now)) {
    return { ok: false, error: { code: "NOT_FOUND", message: "This invitation is no longer available." } };
  }

  if (normalizeEmail(input.user.email) !== invitation.email) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Sign in with the email address that received this invitation." } };
  }

  await store.acceptExistingUser({ invitationId: invitation.id, organizationId: invitation.organizationId, userId: input.user.userId, role: invitation.role, acceptedAt: now });
  return { ok: true, data: { organizationId: invitation.organizationId, organizationSlug: invitation.organizationSlug } };
}

export async function acceptInvitationForNewUser(store: InvitationAcceptanceStore, clock: Clock, input: { rawToken: string; name: string; password: string }, passwordService: PasswordService = argon2PasswordService): Promise<ActionResult<{ organizationId: string; organizationSlug: string; rawSessionToken: string }>> {
  const invitation = await store.findByTokenHash(hashOpaqueToken(input.rawToken));
  const now = clock.now();
  if (!invitation || !invitationCanBeAccepted(invitation, now)) return { ok: false, error: { code: "NOT_FOUND", message: "This invitation is no longer available." } };
  const parsed = newUserSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: { code: "VALIDATION", message: "Review the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors } };
  const rawSessionToken = generateOpaqueToken();
  const passwordHash = await passwordService.hash(parsed.data.password);
  await store.acceptNewUser({ invitationId: invitation.id, organizationId: invitation.organizationId, email: invitation.email, name: parsed.data.name, passwordHash, role: invitation.role, tokenHash: hashOpaqueToken(rawSessionToken), expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30), acceptedAt: now });
  return { ok: true, data: { organizationId: invitation.organizationId, organizationSlug: invitation.organizationSlug, rawSessionToken } };
}

export async function getInvitationDetails(store: Pick<InvitationAcceptanceStore, "findByTokenHash">, now: Date, rawToken: string): Promise<InvitationState | null> {
  const invitation = await store.findByTokenHash(hashOpaqueToken(rawToken));
  return invitation && invitationCanBeAccepted(invitation, now) ? invitation : null;
}
