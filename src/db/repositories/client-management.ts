import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import type { Database } from "@/db/client";
import { clientContacts, clients } from "@/db/schema";
import type { ClientFormInput } from "@/domain/clients";

export interface ClientManagementRepository {
  findForEdit(organizationId: string, clientId: string): Promise<ClientFormInput | null>;
  create(organizationId: string, input: ClientFormInput): Promise<{ id: string }>;
  update(organizationId: string, clientId: string, input: ClientFormInput): Promise<{ id: string } | null>;
}

function clientValues(input: ClientFormInput) {
  return { name: input.name, externalReference: input.externalReference, notes: input.notes };
}

export function createClientManagementRepository(database: Database): ClientManagementRepository {
  return {
    async findForEdit(organizationId, clientId) {
      const [client] = await database.select({ name: clients.name, externalReference: clients.externalReference, notes: clients.notes }).from(clients).where(and(eq(clients.organizationId, organizationId), eq(clients.id, clientId), isNull(clients.archivedAt))).limit(1);
      if (!client) return null;
      const [contact] = await database.select({ contactName: clientContacts.name, contactEmail: clientContacts.email, contactJobTitle: clientContacts.jobTitle }).from(clientContacts).where(and(eq(clientContacts.organizationId, organizationId), eq(clientContacts.clientId, clientId), eq(clientContacts.isPrimary, true), isNull(clientContacts.archivedAt))).limit(1);
      return { name: client.name, externalReference: client.externalReference ?? undefined, notes: client.notes ?? undefined, contactName: contact?.contactName, contactEmail: contact?.contactEmail, contactJobTitle: contact?.contactJobTitle ?? undefined };
    },
    create(organizationId, input) {
      return database.transaction(async (transaction) => {
        const [client] = await transaction.insert(clients).values({ organizationId, ...clientValues(input) }).returning({ id: clients.id });
        if (!client) throw new Error("Client creation did not return an id.");
        if (input.contactName && input.contactEmail) await transaction.insert(clientContacts).values({ organizationId, clientId: client.id, name: input.contactName, email: input.contactEmail, jobTitle: input.contactJobTitle, isPrimary: true });
        return client;
      });
    },
    update(organizationId, clientId, input) {
      return database.transaction(async (transaction) => {
        const [client] = await transaction.update(clients).set({ ...clientValues(input), updatedAt: new Date() }).where(and(eq(clients.organizationId, organizationId), eq(clients.id, clientId), isNull(clients.archivedAt))).returning({ id: clients.id });
        if (!client) return null;
        if (input.contactName && input.contactEmail) {
          const [primary] = await transaction.select({ id: clientContacts.id }).from(clientContacts).where(and(eq(clientContacts.organizationId, organizationId), eq(clientContacts.clientId, clientId), eq(clientContacts.isPrimary, true), isNull(clientContacts.archivedAt))).for("update").limit(1);
          if (primary) await transaction.update(clientContacts).set({ name: input.contactName, email: input.contactEmail, jobTitle: input.contactJobTitle, updatedAt: new Date() }).where(and(eq(clientContacts.organizationId, organizationId), eq(clientContacts.id, primary.id)));
          else await transaction.insert(clientContacts).values({ organizationId, clientId, name: input.contactName, email: input.contactEmail, jobTitle: input.contactJobTitle, isPrimary: true });
        }
        return client;
      });
    },
  };
}
