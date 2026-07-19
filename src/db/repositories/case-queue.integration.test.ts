import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabaseConnection, type DatabaseConnection } from "@/db/client";
import { listCaseQueue } from "@/db/repositories/case-queue";
import { cases, clients, organizations, users } from "@/db/schema";
import type { CaseQueueQuery } from "@/domain/case-queue";

const url = process.env.TEST_DATABASE_URL;
const describeWithDatabase = url ? describe : describe.skip;
const defaults: CaseQueueQuery = { overdue: false, view: "list", limit: 25 };

describeWithDatabase("case queue repository with PostgreSQL", () => {
  let connection!: DatabaseConnection; const organizationIds: string[] = []; const userIds: string[] = [];
  beforeAll(() => { connection = createDatabaseConnection(url!); });
  afterAll(async () => { if (organizationIds.length) await connection.database.delete(organizations).where(inArray(organizations.id, organizationIds)); if (userIds.length) await connection.database.delete(users).where(inArray(users.id, userIds)); await connection.close(); });

  async function fixture(label: string) {
    const suffix = randomUUID(); const [organization] = await connection.database.insert(organizations).values({ name: label, slug: `queue-${suffix}` }).returning({ id: organizations.id }); const [user] = await connection.database.insert(users).values({ name: `${label} Agent`, email: `${suffix}@example.test`, passwordHash: "test" }).returning({ id: users.id });
    if (!organization || !user) throw new Error("Queue fixture failed."); organizationIds.push(organization.id); userIds.push(user.id); const [client] = await connection.database.insert(clients).values({ organizationId: organization.id, name: `${label} Client` }).returning({ id: clients.id }); if (!client) throw new Error("Client fixture failed."); return { organization, user, client };
  }

  it("combines filters without leaking another tenant", async () => {
    const first = await fixture("First"); const second = await fixture("Second"); const now = new Date("2026-07-20T12:00:00.000Z");
    await connection.database.insert(cases).values([{ organizationId: first.organization.id, clientId: first.client.id, createdById: first.user.id, assigneeId: first.user.id, sequence: 1, title: "Urgent export correction", description: "Detailed request", status: "IN_PROGRESS", priority: "URGENT", dueAt: new Date("2026-07-19T12:00:00Z"), lastActivityAt: new Date("2026-07-20T10:00:00Z") }, { organizationId: first.organization.id, clientId: first.client.id, createdById: first.user.id, sequence: 2, title: "Routine access review", description: "Detailed request", status: "NEW", priority: "NORMAL", dueAt: new Date("2026-07-22T12:00:00Z"), lastActivityAt: new Date("2026-07-20T11:00:00Z") }, { organizationId: second.organization.id, clientId: second.client.id, createdById: second.user.id, assigneeId: second.user.id, sequence: 1, title: "Urgent export hidden", description: "Other tenant", status: "IN_PROGRESS", priority: "URGENT", dueAt: new Date("2026-07-18T12:00:00Z") }]);
    const page = await listCaseQueue(connection.database, first.organization.id, { ...defaults, search: "export", status: "IN_PROGRESS", priority: "URGENT", assigneeId: first.user.id, clientId: first.client.id, overdue: true }, now);
    expect(page.items.map((item) => item.title)).toEqual(["Urgent export correction"]);
  });

  it("keeps descending activity and id pagination stable", async () => {
    const { organization, user, client } = await fixture("Paging"); const activity = new Date("2026-07-20T10:00:00Z");
    await connection.database.insert(cases).values(Array.from({ length: 3 }, (_, index) => ({ organizationId: organization.id, clientId: client.id, createdById: user.id, sequence: index + 1, title: `Stable case ${index + 1}`, description: "Detailed request", lastActivityAt: activity })));
    const first = await listCaseQueue(connection.database, organization.id, { ...defaults, limit: 2 }, new Date()); expect(first.items).toHaveLength(2); expect(first.nextCursor).not.toBeNull();
    const second = await listCaseQueue(connection.database, organization.id, { ...defaults, limit: 2, cursor: first.nextCursor ?? undefined }, new Date()); expect(second.items).toHaveLength(1); expect(new Set([...first.items, ...second.items].map((item) => item.id)).size).toBe(3);
  });
});
