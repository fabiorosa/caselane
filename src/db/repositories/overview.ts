import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { caseActivities, cases, clients, users } from "@/db/schema";

export interface OverviewSnapshot {
  counts: { open: number; overdue: number; unassigned: number; waitingOnClient: number };
  recentActivity: Array<{ id: string; eventType: string; caseSequence: number; caseTitle: string; clientName: string; actorName: string | null; createdAt: Date }>;
}

export interface OverviewRepository { getSnapshot(organizationId: string, now: Date): Promise<OverviewSnapshot>; }

export function createOverviewRepository(database: Database): OverviewRepository {
  return { async getSnapshot(organizationId, now) {
    const [counts] = await database.select({
      open: sql<number>`count(*) filter (where ${cases.status} not in ('RESOLVED', 'CLOSED'))::int`,
      overdue: sql<number>`count(*) filter (where ${cases.status} not in ('RESOLVED', 'CLOSED') and ${cases.dueAt} < ${now.toISOString()}::timestamptz)::int`,
      unassigned: sql<number>`count(*) filter (where ${cases.status} not in ('RESOLVED', 'CLOSED') and ${cases.assigneeId} is null)::int`,
      waitingOnClient: sql<number>`count(*) filter (where ${cases.status} = 'WAITING_ON_CLIENT')::int`,
    }).from(cases).where(eq(cases.organizationId, organizationId));
    const recentActivity = await database.select({ id: caseActivities.id, eventType: caseActivities.eventType, caseSequence: cases.sequence, caseTitle: cases.title, clientName: clients.name, actorName: users.name, createdAt: caseActivities.createdAt })
      .from(caseActivities)
      .innerJoin(cases, and(eq(caseActivities.caseId, cases.id), eq(cases.organizationId, organizationId)))
      .innerJoin(clients, and(eq(cases.clientId, clients.id), eq(clients.organizationId, organizationId)))
      .leftJoin(users, eq(caseActivities.actorId, users.id))
      .where(eq(caseActivities.organizationId, organizationId)).orderBy(desc(caseActivities.createdAt), desc(caseActivities.id)).limit(6);
    return { counts: counts ?? { open: 0, overdue: 0, unassigned: 0, waitingOnClient: 0 }, recentActivity };
  }};
}

export async function listRecentCases(database: Database, organizationId: string) {
  return database.select({ id: cases.id, sequence: cases.sequence, title: cases.title, clientName: clients.name, status: cases.status, priority: cases.priority, assigneeName: users.name, dueAt: cases.dueAt })
    .from(cases).innerJoin(clients, and(eq(cases.clientId, clients.id), eq(clients.organizationId, organizationId))).leftJoin(users, eq(cases.assigneeId, users.id))
    .where(eq(cases.organizationId, organizationId)).orderBy(desc(cases.lastActivityAt), desc(cases.sequence)).limit(12);
}
