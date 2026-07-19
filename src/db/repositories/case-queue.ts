import "server-only";

import { and, desc, eq, ilike, isNull, lt, or, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { cases, clients, users } from "@/db/schema";
import { decodeCaseCursor, encodeCaseCursor, type CaseQueueQuery } from "@/domain/case-queue";

export interface CaseQueueItem { id: string; sequence: number; title: string; clientName: string; status: string; priority: string; assigneeName: string | null; assigneeId: string | null; dueAt: Date | null; lastActivityAt: Date; }
export interface CaseQueuePage { items: CaseQueueItem[]; nextCursor: string | null; }

export async function listCaseQueue(database: Database, organizationId: string, query: CaseQueueQuery, now: Date): Promise<CaseQueuePage> {
  const cursor = query.cursor ? decodeCaseCursor(query.cursor) : null;
  const rows = await database.select({ id: cases.id, sequence: cases.sequence, title: cases.title, clientName: clients.name, status: cases.status, priority: cases.priority, assigneeName: users.name, assigneeId: cases.assigneeId, dueAt: cases.dueAt, lastActivityAt: cases.lastActivityAt })
    .from(cases).innerJoin(clients, and(eq(cases.clientId, clients.id), eq(clients.organizationId, organizationId))).leftJoin(users, eq(cases.assigneeId, users.id))
    .where(and(eq(cases.organizationId, organizationId), query.search ? or(ilike(cases.title, `%${query.search}%`), sql`${cases.sequence}::text ilike ${`%${query.search}%`}`) : undefined, query.status ? eq(cases.status, query.status) : undefined, query.priority ? eq(cases.priority, query.priority) : undefined, query.assigneeId === "unassigned" ? isNull(cases.assigneeId) : query.assigneeId ? eq(cases.assigneeId, query.assigneeId) : undefined, query.clientId ? eq(cases.clientId, query.clientId) : undefined, query.overdue ? and(lt(cases.dueAt, now), sql`${cases.status} not in ('RESOLVED','CLOSED')`) : undefined, cursor ? or(lt(cases.lastActivityAt, cursor.activity), and(eq(cases.lastActivityAt, cursor.activity), lt(cases.id, cursor.id))) : undefined))
    .orderBy(desc(cases.lastActivityAt), desc(cases.id)).limit(query.limit + 1);
  const items = rows.slice(0, query.limit); const last = items.at(-1);
  return { items, nextCursor: rows.length > query.limit && last ? encodeCaseCursor({ activity: last.lastActivityAt, id: last.id }) : null };
}
