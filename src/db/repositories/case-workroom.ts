import "server-only";

import { and, asc, eq, isNull, ne, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { caseActivities, caseMessages, cases, categories, clients, memberships, users } from "@/db/schema";
import type { CaseDetailsInput, CaseMessageInput } from "@/domain/case-workroom";
import { assertCaseTransition, type CaseStatus } from "@/domain/case-workflow";
import { InvalidCaseReferenceError } from "./case-intake";

export async function getCaseWorkroom(database: Database, organizationId: string, caseId: string) {
  const requester = sql<string | null>`(select name from client_contacts where client_contacts.id = ${cases.requesterContactId} and client_contacts.organization_id = ${organizationId})`;
  const [record] = await database.select({ id: cases.id, sequence: cases.sequence, title: cases.title, description: cases.description, status: cases.status, priority: cases.priority, dueAt: cases.dueAt, resolvedAt: cases.resolvedAt, closedAt: cases.closedAt, updatedAt: cases.updatedAt, clientId: cases.clientId, clientName: clients.name, requesterName: requester, categoryId: cases.categoryId, categoryName: categories.name, assigneeId: cases.assigneeId, assigneeName: users.name, createdAt: cases.createdAt }).from(cases).innerJoin(clients, and(eq(cases.clientId, clients.id), eq(clients.organizationId, organizationId))).leftJoin(categories, and(eq(cases.categoryId, categories.id), eq(categories.organizationId, organizationId))).leftJoin(users, eq(cases.assigneeId, users.id)).where(and(eq(cases.organizationId, organizationId), eq(cases.id, caseId))).limit(1);
  if (!record) return null;
  const messages = await database.select({ id: caseMessages.id, kind: sql<"message">`'message'`, body: caseMessages.body, visibility: caseMessages.visibility, authorName: users.name, createdAt: caseMessages.createdAt }).from(caseMessages).innerJoin(users, eq(caseMessages.authorId, users.id)).where(and(eq(caseMessages.organizationId, organizationId), eq(caseMessages.caseId, caseId))).orderBy(asc(caseMessages.createdAt));
  const activities = await database.select({ id: caseActivities.id, kind: sql<"activity">`'activity'`, eventType: caseActivities.eventType, metadata: caseActivities.metadata, actorName: users.name, createdAt: caseActivities.createdAt }).from(caseActivities).leftJoin(users, eq(caseActivities.actorId, users.id)).where(and(eq(caseActivities.organizationId, organizationId), eq(caseActivities.caseId, caseId))).orderBy(asc(caseActivities.createdAt));
  const categoriesList = await database.select({ id: categories.id, name: categories.name }).from(categories).where(and(eq(categories.organizationId, organizationId), isNull(categories.archivedAt))).orderBy(asc(categories.name));
  const members = await database.select({ id: memberships.userId, name: sql<string>`(select name from users where users.id = ${memberships.userId})` }).from(memberships).where(and(eq(memberships.organizationId, organizationId), eq(memberships.active, true), ne(memberships.role, "CLIENT"))).orderBy(asc(memberships.userId));
  return { record, messages, activities, categories: categoriesList, members };
}

export interface CaseWorkroomRepository {
  updateDetails(organizationId: string, caseId: string, actorId: string, expectedUpdatedAt: Date, input: CaseDetailsInput): Promise<"UPDATED" | "MISSING" | "STALE">;
  changeStatus(organizationId: string, caseId: string, actorId: string, expectedUpdatedAt: Date, toStatus: CaseStatus): Promise<"UPDATED" | "MISSING" | "STALE">;
  addMessage(organizationId: string, caseId: string, actorId: string, expectedUpdatedAt: Date, input: CaseMessageInput): Promise<"UPDATED" | "MISSING" | "STALE">;
}

export function createCaseWorkroomRepository(database: Database): CaseWorkroomRepository {
  return {
    updateDetails(organizationId, caseId, actorId, expectedUpdatedAt, input) { return database.transaction(async (transaction) => {
      const [current] = await transaction.select({ priority: cases.priority, categoryId: cases.categoryId, assigneeId: cases.assigneeId, dueAt: cases.dueAt, updatedAt: cases.updatedAt }).from(cases).where(and(eq(cases.organizationId, organizationId), eq(cases.id, caseId))).for("update").limit(1); if (!current) return "MISSING"; if (current.updatedAt.getTime() !== expectedUpdatedAt.getTime()) return "STALE";
      if (input.categoryId) { const [category] = await transaction.select({ id: categories.id }).from(categories).where(and(eq(categories.organizationId, organizationId), eq(categories.id, input.categoryId), isNull(categories.archivedAt))).limit(1); if (!category) throw new InvalidCaseReferenceError("CATEGORY"); }
      if (input.assigneeId) { const [member] = await transaction.select({ id: memberships.userId }).from(memberships).where(and(eq(memberships.organizationId, organizationId), eq(memberships.userId, input.assigneeId), eq(memberships.active, true), ne(memberships.role, "CLIENT"))).limit(1); if (!member) throw new InvalidCaseReferenceError("ASSIGNEE"); }
      const changed = (["priority", "categoryId", "assigneeId", "dueAt"] as const).filter((key) => key === "dueAt" ? current.dueAt?.toISOString() !== input.dueAt?.toISOString() : current[key] !== input[key]); if (!changed.length) return "UPDATED"; const now = new Date();
      await transaction.update(cases).set({ ...input, updatedAt: now, lastActivityAt: now }).where(and(eq(cases.organizationId, organizationId), eq(cases.id, caseId)));
      await transaction.insert(caseActivities).values({ organizationId, caseId, actorId, eventType: "CASE_UPDATED", metadata: { fields: changed.join(",") }, createdAt: now }); return "UPDATED";
    }); },
    changeStatus(organizationId, caseId, actorId, expectedUpdatedAt, toStatus) { return database.transaction(async (transaction) => {
      const [current] = await transaction.select({ status: cases.status, updatedAt: cases.updatedAt }).from(cases).where(and(eq(cases.organizationId, organizationId), eq(cases.id, caseId))).for("update").limit(1); if (!current) return "MISSING"; if (current.updatedAt.getTime() !== expectedUpdatedAt.getTime()) return "STALE"; assertCaseTransition(current.status, toStatus); const now = new Date();
      await transaction.update(cases).set({ status: toStatus, resolvedAt: toStatus === "RESOLVED" ? now : toStatus === "IN_PROGRESS" ? null : undefined, closedAt: toStatus === "CLOSED" ? now : toStatus === "IN_PROGRESS" ? null : undefined, updatedAt: now, lastActivityAt: now }).where(and(eq(cases.organizationId, organizationId), eq(cases.id, caseId)));
      await transaction.insert(caseActivities).values({ organizationId, caseId, actorId, eventType: "STATUS_CHANGED", metadata: { from: current.status, to: toStatus }, createdAt: now }); return "UPDATED";
    }); },
    addMessage(organizationId, caseId, actorId, expectedUpdatedAt, input) { return database.transaction(async (transaction) => {
      const [record] = await transaction.select({ id: cases.id, updatedAt: cases.updatedAt }).from(cases).where(and(eq(cases.organizationId, organizationId), eq(cases.id, caseId))).for("update").limit(1); if (!record) return "MISSING"; if (record.updatedAt.getTime() !== expectedUpdatedAt.getTime()) return "STALE"; const now = new Date();
      await transaction.insert(caseMessages).values({ organizationId, caseId, authorId: actorId, ...input, createdAt: now });
      await transaction.insert(caseActivities).values({ organizationId, caseId, actorId, eventType: "MESSAGE_ADDED", metadata: { visibility: input.visibility }, createdAt: now });
      await transaction.update(cases).set({ updatedAt: now, lastActivityAt: now }).where(and(eq(cases.organizationId, organizationId), eq(cases.id, caseId))); return "UPDATED";
    }); },
  };
}
