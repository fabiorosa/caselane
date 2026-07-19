import "server-only";

import { and, eq, gt } from "drizzle-orm";

import type { Database } from "@/db/client";
import { invitations, memberships, organizations, sessions, users } from "@/db/schema";
import type { InvitationAcceptanceStore } from "@/services/accept-invitation";
import type { InvitationStore } from "@/services/invite-member";

export interface InvitationRepository extends InvitationStore, InvitationAcceptanceStore {
  revoke(organizationId: string, invitationId: string): Promise<boolean>;
}

export function createInvitationRepository(database: Database): InvitationRepository {
  return {
    async create(input) {
      const [row] = await database.insert(invitations).values(input).returning({ id: invitations.id });
      if (!row) throw new Error("Invitation creation did not return an id.");
      return row;
    },
    async findByTokenHash(tokenHash) {
      const [row] = await database
        .select({
          id: invitations.id,
          organizationId: invitations.organizationId,
          organizationName: organizations.name,
          organizationSlug: organizations.slug,
          email: invitations.email,
          role: invitations.role,
          status: invitations.status,
          expiresAt: invitations.expiresAt,
        })
        .from(invitations)
        .innerJoin(organizations, eq(invitations.organizationId, organizations.id))
        .where(eq(invitations.tokenHash, tokenHash))
        .limit(1);

      if (!row || (row.role !== "ADMIN" && row.role !== "MEMBER")) return null;
      return { ...row, role: row.role };
    },
    async revoke(organizationId, invitationId) {
      const rows = await database
        .update(invitations)
        .set({ status: "REVOKED" })
        .where(and(eq(invitations.organizationId, organizationId), eq(invitations.id, invitationId), eq(invitations.status, "PENDING")))
        .returning({ id: invitations.id });
      return rows.length === 1;
    },
    async acceptExistingUser(input) {
      await database.transaction(async (transaction) => {
        const claimed = await transaction
          .update(invitations)
          .set({ status: "ACCEPTED", acceptedAt: input.acceptedAt })
          .where(and(eq(invitations.id, input.invitationId), eq(invitations.organizationId, input.organizationId), eq(invitations.status, "PENDING"), gt(invitations.expiresAt, input.acceptedAt)))
          .returning({ id: invitations.id });
        if (claimed.length !== 1) throw new Error("Invitation is no longer available.");
        await transaction.insert(memberships).values({ organizationId: input.organizationId, userId: input.userId, role: input.role });
      });
    },
    async acceptNewUser(input) {
      return database.transaction(async (transaction) => {
        const claimed = await transaction
          .update(invitations)
          .set({ status: "ACCEPTED", acceptedAt: input.acceptedAt })
          .where(and(eq(invitations.id, input.invitationId), eq(invitations.organizationId, input.organizationId), eq(invitations.status, "PENDING"), gt(invitations.expiresAt, input.acceptedAt)))
          .returning({ id: invitations.id });
        if (claimed.length !== 1) throw new Error("Invitation is no longer available.");

        const [user] = await transaction.insert(users).values({ email: input.email, name: input.name, passwordHash: input.passwordHash }).returning({ id: users.id });
        if (!user) throw new Error("User creation did not return an id.");
        await transaction.insert(memberships).values({ organizationId: input.organizationId, userId: user.id, role: input.role });
        await transaction.insert(sessions).values({ userId: user.id, tokenHash: input.tokenHash, expiresAt: input.expiresAt });
        return { userId: user.id };
      });
    },
  };
}
