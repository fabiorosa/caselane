import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabaseConnection, type DatabaseConnection } from "@/db/client";
import { createCaseWorkroomRepository, getCaseWorkroom } from "@/db/repositories/case-workroom";
import { caseActivities, caseMessages, cases, clients, memberships, organizations, users } from "@/db/schema";

const url = process.env.TEST_DATABASE_URL;
const describeWithDatabase = url ? describe : describe.skip;

describeWithDatabase("case workroom repository with PostgreSQL", () => {
  let connection!: DatabaseConnection; const organizationIds: string[] = []; const userIds: string[] = [];
  beforeAll(() => { connection = createDatabaseConnection(url!); });
  afterAll(async () => { if (organizationIds.length) await connection.database.delete(organizations).where(inArray(organizations.id, organizationIds)); if (userIds.length) await connection.database.delete(users).where(inArray(users.id, userIds)); await connection.close(); });

  async function fixture() {
    const suffix = randomUUID(); const [organization] = await connection.database.insert(organizations).values({ name: "Workroom tenant", slug: `workroom-${suffix}` }).returning(); const [other] = await connection.database.insert(organizations).values({ name: "Other tenant", slug: `other-${suffix}` }).returning(); const [user] = await connection.database.insert(users).values({ name: "Case Operator", email: `${suffix}@example.test`, passwordHash: "test" }).returning(); if (!organization || !other || !user) throw new Error("Fixture failed."); organizationIds.push(organization.id, other.id); userIds.push(user.id); await connection.database.insert(memberships).values({ organizationId: organization.id, userId: user.id, role: "MEMBER" }); const [client] = await connection.database.insert(clients).values({ organizationId: organization.id, name: "Active Client" }).returning(); if (!client) throw new Error("Client fixture failed."); const [record] = await connection.database.insert(cases).values({ organizationId: organization.id, sequence: 1001, clientId: client.id, createdById: user.id, title: "Workroom lifecycle", description: "A trustworthy lifecycle test case.", priority: "NORMAL" }).returning(); if (!record) throw new Error("Case fixture failed."); return { organization, other, user, record };
  }

  it("keeps reads tenant-scoped and returns a fixed aggregate shape", async () => {
    const { organization, other, record } = await fixture(); const result = await getCaseWorkroom(connection.database, organization.id, record.id); expect(result?.record.id).toBe(record.id); expect(result).toMatchObject({ messages: [], activities: [], categories: [], members: [{ name: "Case Operator" }] }); expect(await getCaseWorkroom(connection.database, other.id, record.id)).toBeNull();
  });

  it("commits messages with accurate activity and rejects stale writers", async () => {
    const { organization, user, record } = await fixture(); const repository = createCaseWorkroomRepository(connection.database); expect(await repository.addMessage(organization.id, record.id, user.id, record.updatedAt, { body: "Internal investigation context", visibility: "INTERNAL" })).toBe("UPDATED"); expect(await repository.addMessage(organization.id, record.id, user.id, record.updatedAt, { body: "Stale reply", visibility: "CLIENT" })).toBe("STALE"); const [messageCount] = await connection.database.select({ value: sql<number>`count(*)::int` }).from(caseMessages).where(eq(caseMessages.caseId, record.id)); const [activity] = await connection.database.select().from(caseActivities).where(and(eq(caseActivities.caseId, record.id), eq(caseActivities.eventType, "MESSAGE_ADDED"))); expect(messageCount?.value).toBe(1); expect(activity?.metadata).toEqual({ visibility: "INTERNAL" });
  });

  it("rolls back the message transaction when persistence fails", async () => {
    const { organization, record } = await fixture(); const repository = createCaseWorkroomRepository(connection.database); await expect(repository.addMessage(organization.id, record.id, randomUUID(), record.updatedAt, { body: "Must not persist", visibility: "CLIENT" })).rejects.toThrow(); const [messageCount] = await connection.database.select({ value: sql<number>`count(*)::int` }).from(caseMessages).where(eq(caseMessages.caseId, record.id)); const [activityCount] = await connection.database.select({ value: sql<number>`count(*)::int` }).from(caseActivities).where(eq(caseActivities.caseId, record.id)); expect(messageCount?.value).toBe(0); expect(activityCount?.value).toBe(0);
  });

  it("sets resolution timestamps and clears lifecycle timestamps on reopen", async () => {
    const { organization, user, record } = await fixture(); const repository = createCaseWorkroomRepository(connection.database); await connection.database.update(cases).set({ status: "IN_PROGRESS" }).where(eq(cases.id, record.id)); const [active] = await connection.database.select().from(cases).where(eq(cases.id, record.id)); expect(await repository.changeStatus(organization.id, record.id, user.id, active!.updatedAt, "RESOLVED")).toBe("UPDATED"); const [resolved] = await connection.database.select().from(cases).where(eq(cases.id, record.id)); expect(resolved?.resolvedAt).toBeInstanceOf(Date); expect(await repository.changeStatus(organization.id, record.id, user.id, resolved!.updatedAt, "CLOSED")).toBe("UPDATED"); const [closed] = await connection.database.select().from(cases).where(eq(cases.id, record.id)); expect(closed?.closedAt).toBeInstanceOf(Date); expect(await repository.changeStatus(organization.id, record.id, user.id, closed!.updatedAt, "IN_PROGRESS")).toBe("UPDATED"); const [reopened] = await connection.database.select().from(cases).where(eq(cases.id, record.id)); expect(reopened?.resolvedAt).toBeNull(); expect(reopened?.closedAt).toBeNull();
  });
});
