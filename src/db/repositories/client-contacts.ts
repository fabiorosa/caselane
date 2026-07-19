import "server-only";

import { and, eq, isNull, ne } from "drizzle-orm";

import type { Database } from "@/db/client";
import { clientContacts, clients } from "@/db/schema";
import type { ClientContactInput } from "@/domain/clients";

export interface ClientContactRecord {
  id: string;
  clientId: string;
  name: string;
  email: string;
  jobTitle: string | null;
  isPrimary: boolean;
  archivedAt: Date | null;
}

export interface ClientContactRepository {
  add(organizationId: string, clientId: string, input: ClientContactInput): Promise<ClientContactRecord | null>;
  update(organizationId: string, clientId: string, contactId: string, input: ClientContactInput): Promise<ClientContactRecord | null>;
  archive(organizationId: string, clientId: string, contactId: string, archivedAt: Date): Promise<boolean>;
}

const contactSelection = {
  id: clientContacts.id,
  clientId: clientContacts.clientId,
  name: clientContacts.name,
  email: clientContacts.email,
  jobTitle: clientContacts.jobTitle,
  isPrimary: clientContacts.isPrimary,
  archivedAt: clientContacts.archivedAt,
};

export function createClientContactRepository(database: Database): ClientContactRepository {
  return {
    add(organizationId, clientId, input) {
      return database.transaction(async (transaction) => {
        const [client] = await transaction.select({ id: clients.id }).from(clients).where(and(eq(clients.organizationId, organizationId), eq(clients.id, clientId), isNull(clients.archivedAt))).for("update").limit(1);
        if (!client) return null;
        if (input.isPrimary) {
          await transaction.update(clientContacts).set({ isPrimary: false, updatedAt: new Date() }).where(and(eq(clientContacts.organizationId, organizationId), eq(clientContacts.clientId, clientId), eq(clientContacts.isPrimary, true), isNull(clientContacts.archivedAt)));
        }
        const [record] = await transaction.insert(clientContacts).values({ organizationId, clientId, ...input }).returning(contactSelection);
        if (!record) throw new Error("Contact creation did not return a record.");
        return record;
      });
    },
    update(organizationId, clientId, contactId, input) {
      return database.transaction(async (transaction) => {
        const [client] = await transaction.select({ id: clients.id }).from(clients).where(and(eq(clients.organizationId, organizationId), eq(clients.id, clientId), isNull(clients.archivedAt))).for("update").limit(1);
        if (!client) return null;
        const [contact] = await transaction.select({ id: clientContacts.id }).from(clientContacts).where(and(eq(clientContacts.organizationId, organizationId), eq(clientContacts.clientId, clientId), eq(clientContacts.id, contactId), isNull(clientContacts.archivedAt))).for("update").limit(1);
        if (!contact) return null;
        if (input.isPrimary) {
          await transaction.update(clientContacts).set({ isPrimary: false, updatedAt: new Date() }).where(and(eq(clientContacts.organizationId, organizationId), eq(clientContacts.clientId, clientId), ne(clientContacts.id, contactId), eq(clientContacts.isPrimary, true), isNull(clientContacts.archivedAt)));
        }
        const [record] = await transaction.update(clientContacts).set({ ...input, updatedAt: new Date() }).where(and(eq(clientContacts.organizationId, organizationId), eq(clientContacts.clientId, clientId), eq(clientContacts.id, contactId), isNull(clientContacts.archivedAt))).returning(contactSelection);
        return record ?? null;
      });
    },
    archive(organizationId, clientId, contactId, archivedAt) {
      return database.transaction(async (transaction) => {
        const [client] = await transaction.select({ id: clients.id }).from(clients).where(and(eq(clients.organizationId, organizationId), eq(clients.id, clientId))).for("update").limit(1);
        if (!client) return false;
        const rows = await transaction.update(clientContacts).set({ archivedAt, isPrimary: false, updatedAt: archivedAt }).where(and(eq(clientContacts.organizationId, organizationId), eq(clientContacts.clientId, clientId), eq(clientContacts.id, contactId), isNull(clientContacts.archivedAt))).returning({ id: clientContacts.id });
        return rows.length === 1;
      });
    },
  };
}
