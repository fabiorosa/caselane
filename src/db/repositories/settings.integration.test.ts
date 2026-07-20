import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabaseConnection, type DatabaseConnection } from "@/db/client";
import { createSettingsRepository } from "@/db/repositories/settings";
import { organizations } from "@/db/schema";

const url = process.env.TEST_DATABASE_URL; const describeWithDatabase = url ? describe : describe.skip;
describeWithDatabase("settings repository with PostgreSQL", () => {
  let connection!: DatabaseConnection; const organizationIds: string[] = [];
  beforeAll(() => { connection = createDatabaseConnection(url!); });
  afterAll(async () => { if (organizationIds.length) await connection.database.delete(organizations).where(inArray(organizations.id, organizationIds)); await connection.close(); });
  it("keeps category reads and mutations inside the organization", async () => {
    const suffix = crypto.randomUUID(); const [first, second] = await connection.database.insert(organizations).values([{ name: "First", slug: `first-${suffix}` }, { name: "Second", slug: `second-${suffix}` }]).returning();
    if (!first || !second) throw new Error("Fixture failed."); organizationIds.push(first.id, second.id);
    const repository = createSettingsRepository(connection.database); const created = await repository.createCategory(first.id, { name: "Access", color: "#d9a441" });
    await expect(repository.updateCategory(second.id, created.id, { name: "Hidden", color: "#ffffff" })).resolves.toBe(false);
    expect((await repository.get(first.id))?.categories).toEqual([expect.objectContaining({ id: created.id, name: "Access", archived: false })]);
    expect((await repository.get(second.id))?.categories).toEqual([]);
  });
});
