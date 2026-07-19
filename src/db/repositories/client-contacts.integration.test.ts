import { randomUUID } from "node:crypto";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseConnection, type DatabaseConnection } from "@/db/client";
import { createClientContactRepository } from "@/db/repositories/client-contacts";
import { clientContacts, clients, organizations } from "@/db/schema";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

describeWithDatabase("client contact repository with PostgreSQL", () => {
  let connection!: DatabaseConnection;
  const organizationIds: string[] = [];

  beforeAll(() => {
    connection = createDatabaseConnection(testDatabaseUrl!);
  });

  afterAll(async () => {
    if (organizationIds.length) await connection.database.delete(organizations).where(inArray(organizations.id, organizationIds));
    await connection.close();
  });

  async function fixture() {
    const suffix = randomUUID();
    const [organization] = await connection.database.insert(organizations).values({ name: "Contact tenant", slug: `contacts-${suffix}` }).returning({ id: organizations.id });
    if (!organization) throw new Error("Could not create contact organization fixture.");
    organizationIds.push(organization.id);
    const [client] = await connection.database.insert(clients).values({ organizationId: organization.id, name: "Contact client" }).returning({ id: clients.id });
    if (!client) throw new Error("Could not create contact client fixture.");
    return { organization, client };
  }

  it("enforces organization-wide email uniqueness and client ownership", async () => {
    const first = await fixture();
    const second = await fixture();
    const repository = createClientContactRepository(connection.database);
    await repository.add(first.organization.id, first.client.id, { name: "First Contact", email: "unique@example.test", isPrimary: false });
    await expect(repository.add(first.organization.id, first.client.id, { name: "Duplicate", email: "unique@example.test", isPrimary: false })).rejects.toMatchObject({ cause: { code: "23505" } });
    await expect(repository.add(second.organization.id, first.client.id, { name: "Cross Tenant", email: "cross@example.test", isPrimary: false })).resolves.toBeNull();
  });

  it("switches the primary contact atomically and excludes archived contacts", async () => {
    const { organization, client } = await fixture();
    const repository = createClientContactRepository(connection.database);
    const first = await repository.add(organization.id, client.id, { name: "First Primary", email: `first-${randomUUID()}@example.test`, isPrimary: true });
    const second = await repository.add(organization.id, client.id, { name: "Second Primary", email: `second-${randomUUID()}@example.test`, isPrimary: true });
    if (!first || !second) throw new Error("Could not create primary contact fixtures.");
    const activePrimary = await connection.database.select({ id: clientContacts.id }).from(clientContacts).where(and(eq(clientContacts.organizationId, organization.id), eq(clientContacts.clientId, client.id), eq(clientContacts.isPrimary, true), isNull(clientContacts.archivedAt)));
    expect(activePrimary).toEqual([{ id: second.id }]);

    await expect(repository.archive(organization.id, client.id, second.id, new Date("2026-07-19T12:00:00.000Z"))).resolves.toBe(true);
    await expect(repository.update(organization.id, client.id, second.id, { name: "Archived", email: second.email, isPrimary: true })).resolves.toBeNull();
    const [archived] = await connection.database.select({ isPrimary: clientContacts.isPrimary, archivedAt: clientContacts.archivedAt }).from(clientContacts).where(eq(clientContacts.id, second.id));
    expect(archived).toMatchObject({ isPrimary: false, archivedAt: new Date("2026-07-19T12:00:00.000Z") });
  });
});
