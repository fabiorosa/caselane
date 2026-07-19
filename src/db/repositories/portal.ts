import "server-only";

import { and, asc, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { caseActivities, caseMessages, cases, categories, clientContacts, clients, memberships, organizations, users } from "@/db/schema";
import type { PortalReplyInput, PortalRequestInput, PortalRequestQuery } from "@/domain/portal";

export interface PortalIdentity { organizationId: string; organizationName: string; organizationSlug: string; clientId: string; clientName: string; contactId: string; contactName: string; userId: string; }
export interface PortalRequestItem { id: string; sequence: number; title: string; status: string; updatedAt: Date; lastActivityAt: Date; }
export interface PortalCaseView { record: { id: string; sequence: number; title: string; description: string; status: string; createdAt: Date; updatedAt: Date }; messages: Array<{ id: string; body: string; authorName: string; isClientAuthor: boolean; createdAt: Date }>; }

export async function resolvePortalIdentity(database: Database, userId: string, slug: string): Promise<PortalIdentity | null> {
  const [row] = await database.select({ organizationId: organizations.id, organizationName: organizations.name, organizationSlug: organizations.slug, clientId: clients.id, clientName: clients.name, contactId: clientContacts.id, contactName: clientContacts.name, userId: memberships.userId })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
    .innerJoin(clientContacts, and(eq(clientContacts.organizationId, organizations.id), eq(clientContacts.userId, memberships.userId), isNull(clientContacts.archivedAt)))
    .innerJoin(clients, and(eq(clients.organizationId, organizations.id), eq(clients.id, clientContacts.clientId), isNull(clients.archivedAt)))
    .where(and(eq(memberships.userId, userId), eq(memberships.role, "CLIENT"), eq(memberships.active, true), eq(organizations.slug, slug), isNull(organizations.archivedAt))).limit(1);
  return row ?? null;
}

export async function getPortalCategories(database: Database, identity: PortalIdentity) {
  return database.select({ id: categories.id, name: categories.name }).from(categories).where(and(eq(categories.organizationId, identity.organizationId), isNull(categories.archivedAt))).orderBy(asc(categories.name));
}

export async function listPortalRequests(database: Database, identity: PortalIdentity, query: PortalRequestQuery): Promise<PortalRequestItem[]> {
  const closed = query.state === "closed";
  return database.select({ id: cases.id, sequence: cases.sequence, title: cases.title, status: cases.status, updatedAt: cases.updatedAt, lastActivityAt: cases.lastActivityAt }).from(cases)
    .where(and(eq(cases.organizationId, identity.organizationId), eq(cases.clientId, identity.clientId), closed ? inArray(cases.status, ["RESOLVED", "CLOSED"]) : sql`${cases.status} not in ('RESOLVED','CLOSED')`, query.search ? or(ilike(cases.title, `%${query.search}%`), sql`${cases.sequence}::text ilike ${`%${query.search}%`}`) : undefined))
    .orderBy(desc(cases.lastActivityAt), desc(cases.id)).limit(50);
}

export async function submitPortalRequest(database: Database, identity: PortalIdentity, input: PortalRequestInput): Promise<{ id: string; sequence: number }> {
  return database.transaction(async (transaction) => {
    const [relationship] = await transaction.select({ contactId: clientContacts.id }).from(clientContacts).innerJoin(clients, and(eq(clients.id, clientContacts.clientId), eq(clients.organizationId, identity.organizationId), isNull(clients.archivedAt))).innerJoin(memberships, and(eq(memberships.organizationId, identity.organizationId), eq(memberships.userId, identity.userId), eq(memberships.role, "CLIENT"), eq(memberships.active, true))).where(and(eq(clientContacts.organizationId, identity.organizationId), eq(clientContacts.id, identity.contactId), eq(clientContacts.clientId, identity.clientId), eq(clientContacts.userId, identity.userId), isNull(clientContacts.archivedAt))).for("update").limit(1);
    if (!relationship) throw new Error("Portal relationship is no longer active.");
    if (input.categoryId) { const [category] = await transaction.select({ id: categories.id }).from(categories).where(and(eq(categories.organizationId, identity.organizationId), eq(categories.id, input.categoryId), isNull(categories.archivedAt))).limit(1); if (!category) throw new Error("Category is not available."); }
    const [sequence] = await transaction.update(organizations).set({ caseSequence: sql`${organizations.caseSequence} + 1`, updatedAt: new Date() }).where(eq(organizations.id, identity.organizationId)).returning({ value: organizations.caseSequence });
    if (!sequence) throw new Error("Workspace is not available.");
    const [record] = await transaction.insert(cases).values({ organizationId: identity.organizationId, sequence: sequence.value, clientId: identity.clientId, requesterContactId: identity.contactId, categoryId: input.categoryId, createdById: identity.userId, title: input.title, description: input.description, priority: "NORMAL" }).returning({ id: cases.id, sequence: cases.sequence });
    if (!record) throw new Error("Request was not created.");
    await transaction.insert(caseActivities).values({ organizationId: identity.organizationId, caseId: record.id, actorId: identity.userId, eventType: "CASE_CREATED", metadata: { source: "CLIENT_PORTAL", sequence: record.sequence } });
    return record;
  });
}

export async function getPortalCase(database: Database, identity: PortalIdentity, caseId: string): Promise<PortalCaseView | null> {
  const [record] = await database.select({ id: cases.id, sequence: cases.sequence, title: cases.title, description: cases.description, status: cases.status, createdAt: cases.createdAt, updatedAt: cases.updatedAt }).from(cases).where(and(eq(cases.organizationId, identity.organizationId), eq(cases.clientId, identity.clientId), eq(cases.id, caseId))).limit(1);
  if (!record) return null;
  const messages = await database.select({ id: caseMessages.id, body: caseMessages.body, authorName: users.name, isClientAuthor: sql<boolean>`${caseMessages.authorId} = ${identity.userId}`, createdAt: caseMessages.createdAt }).from(caseMessages).innerJoin(users, eq(users.id, caseMessages.authorId)).where(and(eq(caseMessages.organizationId, identity.organizationId), eq(caseMessages.caseId, record.id), eq(caseMessages.visibility, "CLIENT"))).orderBy(asc(caseMessages.createdAt), asc(caseMessages.id));
  return { record, messages };
}

export async function addPortalReply(database: Database, identity: PortalIdentity, caseId: string, input: PortalReplyInput): Promise<boolean> {
  return database.transaction(async (transaction) => {
    const [record] = await transaction.select({ id: cases.id }).from(cases).where(and(eq(cases.organizationId, identity.organizationId), eq(cases.clientId, identity.clientId), eq(cases.id, caseId))).for("update").limit(1); if (!record) return false;
    const now = new Date(); await transaction.insert(caseMessages).values({ organizationId: identity.organizationId, caseId: record.id, authorId: identity.userId, visibility: "CLIENT", body: input.body });
    await transaction.insert(caseActivities).values({ organizationId: identity.organizationId, caseId: record.id, actorId: identity.userId, eventType: "MESSAGE_ADDED", metadata: { visibility: "CLIENT", source: "CLIENT_PORTAL" } });
    await transaction.update(cases).set({ lastActivityAt: now, updatedAt: now }).where(and(eq(cases.organizationId, identity.organizationId), eq(cases.id, record.id))); return true;
  });
}
