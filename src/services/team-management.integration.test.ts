import { randomUUID } from "node:crypto";

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseConnection, type DatabaseConnection } from "@/db/client";
import { createTeamRepository } from "@/db/repositories/team";
import { memberships, organizations, users } from "@/db/schema";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

describeWithDatabase("team management with PostgreSQL", () => {
  let connection!: DatabaseConnection;
  const userIds: string[] = [];
  const organizationIds: string[] = [];

  beforeAll(() => {
    connection = createDatabaseConnection(testDatabaseUrl!);
  });

  afterAll(async () => {
    if (organizationIds.length) await connection.database.delete(organizations).where(inArray(organizations.id, organizationIds));
    if (userIds.length) await connection.database.delete(users).where(inArray(users.id, userIds));
    await connection.close();
  });

  async function createOrganizationWithOwner() {
    const suffix = randomUUID();
    const [user] = await connection.database.insert(users).values({ email: `team-${suffix}@example.com`, name: "Team User", passwordHash: "test-hash" }).returning({ id: users.id });
    const [organization] = await connection.database.insert(organizations).values({ name: "Team Test", slug: `team-${suffix}` }).returning({ id: organizations.id });
    if (!user || !organization) throw new Error("Could not create team fixtures.");
    userIds.push(user.id);
    organizationIds.push(organization.id);
    await connection.database.insert(memberships).values({ organizationId: organization.id, userId: user.id, role: "OWNER" });
    return { user, organization };
  }

  it("protects the owner under concurrent deactivation attempts", async () => {
    const fixture = await createOrganizationWithOwner();
    const repository = createTeamRepository(connection.database);
    const results = await Promise.all([
      repository.setActive(fixture.organization.id, fixture.user.id, false),
      repository.setActive(fixture.organization.id, fixture.user.id, false),
    ]);
    expect(results).toEqual([false, false]);
  });

  it("does not mutate a member through another organization id", async () => {
    const first = await createOrganizationWithOwner();
    const second = await createOrganizationWithOwner();
    const repository = createTeamRepository(connection.database);
    await expect(repository.updateRole(second.organization.id, first.user.id, "MEMBER")).resolves.toBe(false);
    await expect(repository.setActive(second.organization.id, first.user.id, false)).resolves.toBe(false);
  });
});
