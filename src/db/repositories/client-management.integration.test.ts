import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseConnection, type DatabaseConnection } from "@/db/client";
import { createClientManagementRepository } from "@/db/repositories/client-management";
import { clientContacts, clients, organizations } from "@/db/schema";

const url = process.env.TEST_DATABASE_URL;
const describeWithDatabase = url ? describe : describe.skip;

describeWithDatabase("client management transaction with PostgreSQL", () => {
  let connection!: DatabaseConnection; const organizationIds: string[] = [];
  beforeAll(() => { connection = createDatabaseConnection(url!); });
  afterAll(async () => { if (organizationIds.length) await connection.database.delete(organizations).where(inArray(organizations.id, organizationIds)); await connection.close(); });

  async function organization() { const suffix = randomUUID(); const [row] = await connection.database.insert(organizations).values({ name: "Management", slug: `management-${suffix}` }).returning({ id: organizations.id }); if (!row) throw new Error("Fixture failed."); organizationIds.push(row.id); return row; }

  it("creates and updates client plus primary contact atomically", async () => {
    const org = await organization(); const repository = createClientManagementRepository(connection.database);
    const created = await repository.create(org.id, { name: "Northstar", contactName: "Avery Stone", contactEmail: "avery@example.test" });
    const [contact] = await connection.database.select().from(clientContacts).where(eq(clientContacts.clientId, created.id));
    expect(contact).toMatchObject({ name: "Avery Stone", email: "avery@example.test", isPrimary: true });
    await repository.update(org.id, created.id, { name: "Northstar Studio", contactName: "Avery Reed", contactEmail: "avery.reed@example.test" });
    const [client] = await connection.database.select().from(clients).where(eq(clients.id, created.id));
    const [updatedContact] = await connection.database.select().from(clientContacts).where(eq(clientContacts.clientId, created.id));
    expect(client?.name).toBe("Northstar Studio"); expect(updatedContact).toMatchObject({ name: "Avery Reed", email: "avery.reed@example.test" });
  });
});
