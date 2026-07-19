import { randomUUID } from "node:crypto";

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseConnection, type DatabaseConnection } from "@/db/client";
import { createClientRepository } from "@/db/repositories/clients";
import { clientContacts, organizations } from "@/db/schema";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

describeWithDatabase("client repository with PostgreSQL", () => {
  let connection!: DatabaseConnection;
  const organizationIds: string[] = [];

  beforeAll(() => {
    connection = createDatabaseConnection(testDatabaseUrl!);
  });

  afterAll(async () => {
    if (organizationIds.length) await connection.database.delete(organizations).where(inArray(organizations.id, organizationIds));
    await connection.close();
  });

  async function createOrganization(name: string) {
    const suffix = randomUUID();
    const [organization] = await connection.database.insert(organizations).values({ name, slug: `clients-${suffix}` }).returning({ id: organizations.id });
    if (!organization) throw new Error("Could not create client repository fixture.");
    organizationIds.push(organization.id);
    return organization;
  }

  it("paginates by name and id without leaking another tenant", async () => {
    const first = await createOrganization("First tenant");
    const second = await createOrganization("Second tenant");
    const repository = createClientRepository(connection.database);
    const alpha = await repository.create(first.id, { name: "Alpha" });
    await repository.create(first.id, { name: "Bravo" });
    await repository.create(first.id, { name: "Charlie" });
    const hidden = await repository.create(second.id, { name: "Between tenants" });
    await connection.database.insert(clientContacts).values({ organizationId: first.id, clientId: alpha.id, name: "Primary Person", email: "primary@example.test", isPrimary: true });

    const pageOne = await repository.list(first.id, { archived: false, limit: 2 });
    expect(pageOne.items.map((client) => client.name)).toEqual(["Alpha", "Bravo"]);
    expect(pageOne.items[0]).toMatchObject({ primaryContactName: "Primary Person", primaryContactEmail: "primary@example.test", requestCount: 0 });
    expect(pageOne.nextCursor).not.toBeNull();

    const pageTwo = await repository.list(first.id, { archived: false, limit: 2, cursor: pageOne.nextCursor ?? undefined });
    expect(pageTwo.items.map((client) => client.name)).toEqual(["Charlie"]);
    expect(pageTwo.nextCursor).toBeNull();
    await expect(repository.findById(first.id, hidden.id)).resolves.toBeNull();
    await expect(repository.update(first.id, hidden.id, { name: "Leaked" })).resolves.toBeNull();
    await expect(repository.archive(first.id, hidden.id, new Date())).resolves.toBe(false);
  });

  it("updates active clients and archives them without deleting history", async () => {
    const organization = await createOrganization("Archive tenant");
    const repository = createClientRepository(connection.database);
    const created = await repository.create(organization.id, { name: "Archive Me", notes: "Original" });
    const updated = await repository.update(organization.id, created.id, { name: "Updated Client", externalReference: "EXT-9" });
    expect(updated).toMatchObject({ name: "Updated Client", externalReference: "EXT-9" });

    const archivedAt = new Date("2026-07-19T12:00:00.000Z");
    await expect(repository.archive(organization.id, created.id, archivedAt)).resolves.toBe(true);
    await expect(repository.archive(organization.id, created.id, archivedAt)).resolves.toBe(false);
    await expect(repository.update(organization.id, created.id, { name: "Cannot update" })).resolves.toBeNull();
    await expect(repository.findById(organization.id, created.id)).resolves.toMatchObject({ archivedAt });
    await expect(repository.list(organization.id, { archived: false, limit: 25 })).resolves.toMatchObject({ items: [] });
    const archived = await repository.list(organization.id, { archived: true, limit: 25 });
    expect(archived.items).toHaveLength(1);
    expect(archived.items[0]).toMatchObject({ name: "Updated Client", archivedAt });
  });
});
