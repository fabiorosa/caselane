import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabaseConnection, type DatabaseConnection } from "@/db/client";
import { createOverviewRepository } from "@/db/repositories/overview";
import { caseActivities, cases, clients, organizations, users } from "@/db/schema";

const url = process.env.TEST_DATABASE_URL;
const describeWithDatabase = url ? describe : describe.skip;

describeWithDatabase("overview repository with PostgreSQL", () => {
  let connection!: DatabaseConnection; const organizationIds: string[] = []; const userIds: string[] = [];
  beforeAll(() => { connection = createDatabaseConnection(url!); });
  afterAll(async () => { if (organizationIds.length) await connection.database.delete(organizations).where(inArray(organizations.id, organizationIds)); if (userIds.length) await connection.database.delete(users).where(inArray(users.id, userIds)); await connection.close(); });

  async function fixture(name: string) {
    const suffix = randomUUID();
    const [organization] = await connection.database.insert(organizations).values({ name, slug: `overview-${suffix}` }).returning({ id: organizations.id });
    const [user] = await connection.database.insert(users).values({ name: "Test Operator", email: `${suffix}@example.test`, passwordHash: "test" }).returning({ id: users.id });
    if (!organization || !user) throw new Error("Fixture creation failed."); organizationIds.push(organization.id); userIds.push(user.id);
    const [client] = await connection.database.insert(clients).values({ organizationId: organization.id, name: `${name} client` }).returning({ id: clients.id }); if (!client) throw new Error("Client fixture failed.");
    return { organization, user, client };
  }

  it("returns exact operational counts and recent activity for one tenant only", async () => {
    const first = await fixture("First"); const second = await fixture("Second"); const now = new Date("2026-07-19T12:00:00.000Z");
    const rows = [
      { title: "Overdue unassigned", status: "NEW" as const, assigneeId: null, dueAt: new Date("2026-07-18T12:00:00Z") },
      { title: "Waiting", status: "WAITING_ON_CLIENT" as const, assigneeId: first.user.id, dueAt: new Date("2026-07-20T12:00:00Z") },
      { title: "Resolved", status: "RESOLVED" as const, assigneeId: first.user.id, dueAt: new Date("2026-07-17T12:00:00Z") },
    ];
    for (const [index, row] of rows.entries()) { const [created] = await connection.database.insert(cases).values({ organizationId: first.organization.id, clientId: first.client.id, createdById: first.user.id, sequence: index + 1, description: "Test", priority: "NORMAL", ...row }).returning({ id: cases.id }); if (created && index < 2) await connection.database.insert(caseActivities).values({ organizationId: first.organization.id, caseId: created.id, actorId: first.user.id, eventType: "STATUS_CHANGED", createdAt: new Date(now.getTime() + index) }); }
    await connection.database.insert(cases).values({ organizationId: second.organization.id, clientId: second.client.id, createdById: second.user.id, sequence: 1, title: "Hidden", description: "Other tenant", status: "NEW", priority: "URGENT", dueAt: new Date("2026-07-01T00:00:00Z") });
    const snapshot = await createOverviewRepository(connection.database).getSnapshot(first.organization.id, now);
    expect(snapshot.counts).toEqual({ open: 2, overdue: 1, unassigned: 1, waitingOnClient: 1 });
    expect(snapshot.recentActivity.map((activity) => activity.caseTitle)).toEqual(["Waiting", "Overdue unassigned"]);
    expect(snapshot.recentActivity.some((activity) => activity.caseTitle === "Hidden")).toBe(false);
  });
});
