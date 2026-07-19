import "server-only";

import { and, asc, eq, isNull, ne, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { caseActivities, cases, categories, clientContacts, clients, memberships, organizations } from "@/db/schema";
import type { CaseIntakeInput } from "@/domain/case-intake";

export type CaseReferenceError = "CLIENT" | "CONTACT" | "CATEGORY" | "ASSIGNEE";
export class InvalidCaseReferenceError extends Error { constructor(readonly reference: CaseReferenceError) { super(`Invalid ${reference.toLowerCase()} reference.`); } }

export interface CaseIntakeRepository { create(organizationId: string, createdById: string, input: CaseIntakeInput): Promise<{ id: string; sequence: number }>; }

export async function getCaseIntakeOptions(database: Database, organizationId: string) {
  const clientRows = await database.select({ id: clients.id, name: clients.name }).from(clients).where(and(eq(clients.organizationId, organizationId), isNull(clients.archivedAt))).orderBy(asc(clients.name));
  const contactRows = await database.select({ id: clientContacts.id, clientId: clientContacts.clientId, name: clientContacts.name, email: clientContacts.email }).from(clientContacts).where(and(eq(clientContacts.organizationId, organizationId), isNull(clientContacts.archivedAt))).orderBy(asc(clientContacts.name));
  const categoryRows = await database.select({ id: categories.id, name: categories.name }).from(categories).where(and(eq(categories.organizationId, organizationId), isNull(categories.archivedAt))).orderBy(asc(categories.name));
  const memberRows = await database.select({ id: memberships.userId, name: sql<string>`(select name from users where users.id = ${memberships.userId})` }).from(memberships).where(and(eq(memberships.organizationId, organizationId), eq(memberships.active, true), ne(memberships.role, "CLIENT"))).orderBy(asc(memberships.userId));
  return { clients: clientRows, contacts: contactRows, categories: categoryRows, members: memberRows };
}

export function createCaseIntakeRepository(database: Database): CaseIntakeRepository {
  return { create(organizationId, createdById, input) {
    return database.transaction(async (transaction) => {
      const [client] = await transaction.select({ id: clients.id }).from(clients).where(and(eq(clients.organizationId, organizationId), eq(clients.id, input.clientId), isNull(clients.archivedAt))).limit(1);
      if (!client) throw new InvalidCaseReferenceError("CLIENT");
      if (input.requesterContactId) { const [contact] = await transaction.select({ id: clientContacts.id }).from(clientContacts).where(and(eq(clientContacts.organizationId, organizationId), eq(clientContacts.clientId, input.clientId), eq(clientContacts.id, input.requesterContactId), isNull(clientContacts.archivedAt))).limit(1); if (!contact) throw new InvalidCaseReferenceError("CONTACT"); }
      if (input.categoryId) { const [category] = await transaction.select({ id: categories.id }).from(categories).where(and(eq(categories.organizationId, organizationId), eq(categories.id, input.categoryId), isNull(categories.archivedAt))).limit(1); if (!category) throw new InvalidCaseReferenceError("CATEGORY"); }
      if (input.assigneeId) { const [assignee] = await transaction.select({ userId: memberships.userId }).from(memberships).where(and(eq(memberships.organizationId, organizationId), eq(memberships.userId, input.assigneeId), eq(memberships.active, true), sql`${memberships.role} <> 'CLIENT'`)).limit(1); if (!assignee) throw new InvalidCaseReferenceError("ASSIGNEE"); }
      const [sequenceRow] = await transaction.update(organizations).set({ caseSequence: sql`${organizations.caseSequence} + 1`, updatedAt: new Date() }).where(eq(organizations.id, organizationId)).returning({ sequence: organizations.caseSequence });
      if (!sequenceRow) throw new Error("Organization is not available.");
      const [created] = await transaction.insert(cases).values({ organizationId, sequence: sequenceRow.sequence, clientId: input.clientId, requesterContactId: input.requesterContactId, categoryId: input.categoryId, assigneeId: input.assigneeId, createdById, title: input.title, description: input.description, priority: input.priority, dueAt: input.dueAt }).returning({ id: cases.id, sequence: cases.sequence });
      if (!created) throw new Error("Case creation did not return a record.");
      await transaction.insert(caseActivities).values({ organizationId, caseId: created.id, actorId: createdById, eventType: "CASE_CREATED", metadata: { sequence: created.sequence } });
      return created;
    });
  }};
}
