import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabaseConnection, type DatabaseConnection } from "@/db/client";
import { createCaseIntakeRepository } from "@/db/repositories/case-intake";
import { caseActivities, cases, clients, memberships, organizations, users } from "@/db/schema";

const url = process.env.TEST_DATABASE_URL;
const describeWithDatabase = url ? describe : describe.skip;

describeWithDatabase("case intake repository with PostgreSQL", () => {
  let connection!: DatabaseConnection; const organizationIds: string[] = []; const userIds: string[] = [];
  beforeAll(() => { connection = createDatabaseConnection(url!); });
  afterAll(async () => { if (organizationIds.length) await connection.database.delete(organizations).where(inArray(organizations.id, organizationIds)); if (userIds.length) await connection.database.delete(users).where(inArray(users.id, userIds)); await connection.close(); });

  async function fixture() {
    const suffix = randomUUID();
    const [organization] = await connection.database.insert(organizations).values({ name: "Intake tenant", slug: `intake-${suffix}` }).returning({ id: organizations.id });
    const [user] = await connection.database.insert(users).values({ name: "Case Operator", email: `${suffix}@example.test`, passwordHash: "test" }).returning({ id: users.id });
    if (!organization || !user) throw new Error("Fixture failed."); organizationIds.push(organization.id); userIds.push(user.id);
    await connection.database.insert(memberships).values({ organizationId: organization.id, userId: user.id, role: "MEMBER" });
    const [client] = await connection.database.insert(clients).values({ organizationId: organization.id, name: "Active Client" }).returning({ id: clients.id }); if (!client) throw new Error("Client fixture failed.");
    return { organization, user, client };
  }

  it("allocates unique organization sequences concurrently and records creation activity", async () => {
    const { organization, user, client } = await fixture(); const repository = createCaseIntakeRepository(connection.database);
    const input = { clientId: client.id, title: "Concurrent request", description: "A sufficiently detailed case description.", priority: "NORMAL" as const };
    const created = await Promise.all([repository.create(organization.id, user.id, input), repository.create(organization.id, user.id, { ...input, title: "Second concurrent request" })]);
    expect(created.map((item) => item.sequence).sort()).toEqual([1001, 1002]);
    const [activityCount] = await connection.database.select({ value: sql<number>`count(*)::int` }).from(caseActivities).where(and(eq(caseActivities.organizationId, organization.id), inArray(caseActivities.caseId, created.map((item) => item.id))));
    expect(activityCount?.value).toBe(2);
  });

  it("rejects an archived client without consuming a sequence", async () => {
    const { organization, user, client } = await fixture(); await connection.database.update(clients).set({ archivedAt: new Date() }).where(eq(clients.id, client.id));
    const repository = createCaseIntakeRepository(connection.database);
    await expect(repository.create(organization.id, user.id, { clientId: client.id, title: "Blocked request", description: "This request must not be created.", priority: "NORMAL" })).rejects.toEqual(expect.objectContaining({ reference: "CLIENT" }));
    const [record] = await connection.database.select({ sequence: organizations.caseSequence }).from(organizations).where(eq(organizations.id, organization.id));
    expect(record?.sequence).toBe(1000);
    const [caseCount] = await connection.database.select({ value: sql<number>`count(*)::int` }).from(cases).where(eq(cases.organizationId, organization.id)); expect(caseCount?.value).toBe(0);
  });
});
