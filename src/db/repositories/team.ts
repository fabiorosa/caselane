import "server-only";

import { and, desc, eq, max, ne, sql } from "drizzle-orm";

import type { Database } from "@/db/client";
import { cases, invitations, memberships, sessions, users } from "@/db/schema";
import type { TeamMemberProfileInput } from "@/domain/team-member";

export interface TeamMemberRecord {
  userId: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "CLIENT";
  active: boolean;
  title: string | null;
  lastSeenAt: Date | null;
  createdAt: Date;
}

export interface TeamMemberProfileRecord extends TeamMemberRecord {
  assignedCases: number;
  activeCases: number;
  overdueCases: number;
  recentCases: Array<{ id: string; sequence: number; title: string; status: string; priority: string; dueAt: Date | null }>;
}

export interface PendingInvitationRecord {
  id: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "CLIENT";
  expiresAt: Date;
}

export interface TeamRepository {
  listMembers(organizationId: string): Promise<TeamMemberRecord[]>;
  listPendingInvitations(organizationId: string): Promise<PendingInvitationRecord[]>;
  getMember(organizationId: string, userId: string, now: Date): Promise<TeamMemberProfileRecord | null>;
  updateProfile(organizationId: string, userId: string, input: TeamMemberProfileInput): Promise<boolean>;
  updateRole(organizationId: string, userId: string, role: "ADMIN" | "MEMBER"): Promise<boolean>;
  setActive(organizationId: string, userId: string, active: boolean): Promise<boolean>;
}

export function createTeamRepository(database: Database): TeamRepository {
  return {
    listMembers(organizationId) {
      return database
        .select({ userId: users.id, name: users.name, email: users.email, role: memberships.role, active: memberships.active, title: memberships.title, lastSeenAt: max(sessions.lastSeenAt), createdAt: memberships.createdAt })
        .from(memberships)
        .innerJoin(users, eq(memberships.userId, users.id))
        .leftJoin(sessions, eq(users.id, sessions.userId))
        .where(and(eq(memberships.organizationId, organizationId), ne(memberships.role, "CLIENT")))
        .groupBy(users.id, users.name, users.email, memberships.role, memberships.active, memberships.title, memberships.createdAt)
        .orderBy(desc(memberships.active), users.name, users.id);
    },
    async getMember(organizationId, userId, now) {
      const [member] = await database.select({ userId: users.id, name: users.name, email: users.email, role: memberships.role, active: memberships.active, title: memberships.title, createdAt: memberships.createdAt, lastSeenAt: max(sessions.lastSeenAt), assignedCases: sql<number>`count(distinct ${cases.id})::int`, activeCases: sql<number>`count(distinct ${cases.id}) filter (where ${cases.status} not in ('RESOLVED','CLOSED'))::int`, overdueCases: sql<number>`count(distinct ${cases.id}) filter (where ${cases.dueAt} < ${now.toISOString()}::timestamptz and ${cases.status} not in ('RESOLVED','CLOSED'))::int` }).from(memberships).innerJoin(users, eq(memberships.userId, users.id)).leftJoin(sessions, eq(users.id, sessions.userId)).leftJoin(cases, and(eq(cases.organizationId, organizationId), eq(cases.assigneeId, userId))).where(and(eq(memberships.organizationId, organizationId), eq(memberships.userId, userId), ne(memberships.role, "CLIENT"))).groupBy(users.id, memberships.role, memberships.active, memberships.title, memberships.createdAt).limit(1); if (!member) return null;
      const recentCases = await database.select({ id: cases.id, sequence: cases.sequence, title: cases.title, status: cases.status, priority: cases.priority, dueAt: cases.dueAt }).from(cases).where(and(eq(cases.organizationId, organizationId), eq(cases.assigneeId, userId))).orderBy(desc(cases.lastActivityAt), desc(cases.id)).limit(6);
      return { ...member, recentCases };
    },
    async updateProfile(organizationId, userId, input) {
      return database.transaction(async (transaction) => {
        const [member] = await transaction.select({ role: memberships.role }).from(memberships).where(and(eq(memberships.organizationId, organizationId), eq(memberships.userId, userId))).for("update").limit(1); if (!member || member.role === "OWNER" || member.role === "CLIENT") return false;
        await transaction.update(users).set({ name: input.name, updatedAt: new Date() }).where(eq(users.id, userId)); await transaction.update(memberships).set({ title: input.title ?? null, role: input.role, updatedAt: new Date() }).where(and(eq(memberships.organizationId, organizationId), eq(memberships.userId, userId))); return true;
      });
    },
    listPendingInvitations(organizationId) {
      return database
        .select({ id: invitations.id, email: invitations.email, role: invitations.role, expiresAt: invitations.expiresAt })
        .from(invitations)
        .where(and(eq(invitations.organizationId, organizationId), eq(invitations.status, "PENDING")))
        .orderBy(invitations.createdAt, invitations.id);
    },
    async updateRole(organizationId, userId, role) {
      const rows = await database
        .update(memberships)
        .set({ role, updatedAt: new Date() })
        .where(and(eq(memberships.organizationId, organizationId), eq(memberships.userId, userId), ne(memberships.role, "OWNER")))
        .returning({ userId: memberships.userId });
      return rows.length === 1;
    },
    async setActive(organizationId, userId, active) {
      const rows = await database
        .update(memberships)
        .set({ active, updatedAt: new Date() })
        .where(and(eq(memberships.organizationId, organizationId), eq(memberships.userId, userId), ne(memberships.role, "OWNER")))
        .returning({ userId: memberships.userId });
      return rows.length === 1;
    },
  };
}
