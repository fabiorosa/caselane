import "server-only";

import { and, asc, eq, gt, ilike, isNotNull, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { Database } from "@/db/client";
import { cases, clientContacts, clients } from "@/db/schema";
import { decodeClientCursor, encodeClientCursor, type ClientInput, type ClientListQuery } from "@/domain/clients";

export interface ClientRecord {
  id: string;
  name: string;
  externalReference: string | null;
  notes: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientListItem extends ClientRecord {
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  requestCount: number;
}

export interface ClientListPage {
  items: ClientListItem[];
  nextCursor: string | null;
}

export interface ClientRepository {
  list(organizationId: string, query: ClientListQuery): Promise<ClientListPage>;
  findById(organizationId: string, clientId: string): Promise<ClientRecord | null>;
  create(organizationId: string, input: ClientInput): Promise<ClientRecord>;
  update(organizationId: string, clientId: string, input: ClientInput): Promise<ClientRecord | null>;
  archive(organizationId: string, clientId: string, archivedAt: Date): Promise<boolean>;
}

const clientSelection = {
  id: clients.id,
  name: clients.name,
  externalReference: clients.externalReference,
  notes: clients.notes,
  archivedAt: clients.archivedAt,
  createdAt: clients.createdAt,
  updatedAt: clients.updatedAt,
};

export function createClientRepository(database: Database): ClientRepository {
  return {
    async list(organizationId, query) {
      const clientRows = alias(clients, "client_rows");
      const outerClientId = sql.raw('"client_rows"."id"');
      const cursor = query.cursor ? decodeClientCursor(query.cursor) : null;
      const cursorCondition = cursor
        ? or(gt(clientRows.name, cursor.name), and(eq(clientRows.name, cursor.name), gt(clientRows.id, cursor.id)))
        : undefined;
      const statement = database
        .select({
          id: clientRows.id,
          name: clientRows.name,
          externalReference: clientRows.externalReference,
          notes: clientRows.notes,
          archivedAt: clientRows.archivedAt,
          createdAt: clientRows.createdAt,
          updatedAt: clientRows.updatedAt,
          primaryContactName: sql<string | null>`(
            select ${clientContacts.name} from ${clientContacts}
            where ${clientContacts.organizationId} = ${organizationId}
              and ${clientContacts.clientId} = ${outerClientId}
              and ${clientContacts.isPrimary} = true
              and ${clientContacts.archivedAt} is null
            order by ${clientContacts.id} asc limit 1
          )`,
          primaryContactEmail: sql<string | null>`(
            select ${clientContacts.email} from ${clientContacts}
            where ${clientContacts.organizationId} = ${organizationId}
              and ${clientContacts.clientId} = ${outerClientId}
              and ${clientContacts.isPrimary} = true
              and ${clientContacts.archivedAt} is null
            order by ${clientContacts.id} asc limit 1
          )`,
          requestCount: sql<number>`(
            select count(*)::int from ${cases}
            where ${cases.organizationId} = ${organizationId}
              and ${cases.clientId} = ${outerClientId}
          )`,
        })
        .from(clientRows)
        .where(and(
          eq(clientRows.organizationId, organizationId),
          query.archived ? isNotNull(clientRows.archivedAt) : isNull(clientRows.archivedAt),
          query.search ? ilike(clientRows.name, `%${query.search}%`) : undefined,
          cursorCondition,
        ))
        .orderBy(asc(clientRows.name), asc(clientRows.id))
        .limit(query.limit + 1);
      const rows = await statement;

      const hasNextPage = rows.length > query.limit;
      const items = hasNextPage ? rows.slice(0, query.limit) : rows;
      const last = items.at(-1);
      return {
        items,
        nextCursor: hasNextPage && last ? encodeClientCursor({ name: last.name, id: last.id }) : null,
      };
    },
    async findById(organizationId, clientId) {
      const [record] = await database.select(clientSelection).from(clients).where(and(eq(clients.organizationId, organizationId), eq(clients.id, clientId))).limit(1);
      return record ?? null;
    },
    async create(organizationId, input) {
      const [record] = await database.insert(clients).values({ organizationId, ...input }).returning(clientSelection);
      if (!record) throw new Error("Client creation did not return a record.");
      return record;
    },
    async update(organizationId, clientId, input) {
      const [record] = await database
        .update(clients)
        .set({ ...input, updatedAt: new Date() })
        .where(and(eq(clients.organizationId, organizationId), eq(clients.id, clientId), isNull(clients.archivedAt)))
        .returning(clientSelection);
      return record ?? null;
    },
    async archive(organizationId, clientId, archivedAt) {
      const rows = await database
        .update(clients)
        .set({ archivedAt, updatedAt: archivedAt })
        .where(and(eq(clients.organizationId, organizationId), eq(clients.id, clientId), isNull(clients.archivedAt)))
        .returning({ id: clients.id });
      return rows.length === 1;
    },
  };
}
