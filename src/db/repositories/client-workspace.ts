import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";
import type { Database } from "@/db/client";
import { cases, clientContacts, clients, users } from "@/db/schema";

export interface ClientWorkspaceRecord {
  client: { id: string; name: string; externalReference: string | null; notes: string | null; archivedAt: Date | null; createdAt: Date };
  contacts: Array<{ id: string; name: string; email: string; jobTitle: string | null; isPrimary: boolean }>;
  cases: Array<{ id: string; sequence: number; title: string; status: string; priority: string; assigneeName: string | null; lastActivityAt: Date }>;
}

export async function getClientWorkspace(database: Database, organizationId: string, clientId: string): Promise<ClientWorkspaceRecord | null> {
  const [client] = await database.select({ id: clients.id, name: clients.name, externalReference: clients.externalReference, notes: clients.notes, archivedAt: clients.archivedAt, createdAt: clients.createdAt }).from(clients).where(and(eq(clients.organizationId, organizationId), eq(clients.id, clientId))).limit(1);
  if (!client) return null;
  const contacts = await database.select({ id: clientContacts.id, name: clientContacts.name, email: clientContacts.email, jobTitle: clientContacts.jobTitle, isPrimary: clientContacts.isPrimary }).from(clientContacts).where(and(eq(clientContacts.organizationId, organizationId), eq(clientContacts.clientId, clientId), isNull(clientContacts.archivedAt))).orderBy(desc(clientContacts.isPrimary), clientContacts.name);
  const recentCases = await database.select({ id: cases.id, sequence: cases.sequence, title: cases.title, status: cases.status, priority: cases.priority, assigneeName: users.name, lastActivityAt: cases.lastActivityAt }).from(cases).leftJoin(users, eq(cases.assigneeId, users.id)).where(and(eq(cases.organizationId, organizationId), eq(cases.clientId, clientId))).orderBy(desc(cases.lastActivityAt)).limit(8);
  return { client, contacts, cases: recentCases };
}
