import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabaseConnection, type DatabaseConnection } from "@/db/client";
import { getClientWorkspace } from "@/db/repositories/client-workspace";
import { cases, clientContacts, clients, organizations, users } from "@/db/schema";

const url = process.env.TEST_DATABASE_URL;
const describeWithDatabase = url ? describe : describe.skip;

describeWithDatabase("client workspace repository with PostgreSQL", () => {
  let connection!: DatabaseConnection; const organizationIds: string[] = []; const userIds: string[] = [];
  beforeAll(() => { connection = createDatabaseConnection(url!); });
  afterAll(async () => { if (organizationIds.length) await connection.database.delete(organizations).where(inArray(organizations.id, organizationIds)); if (userIds.length) await connection.database.delete(users).where(inArray(users.id, userIds)); await connection.close(); });

  async function fixture(label: string) {
    const suffix = randomUUID();
    const [organization] = await connection.database.insert(organizations).values({ name: label, slug: `dossier-${suffix}` }).returning({ id: organizations.id });
    const [user] = await connection.database.insert(users).values({ name: `${label} Operator`, email: `${suffix}@example.test`, passwordHash: "test" }).returning({ id: users.id });
    if (!organization || !user) throw new Error("Fixture failed."); organizationIds.push(organization.id); userIds.push(user.id);
    const [client] = await connection.database.insert(clients).values({ organizationId: organization.id, name: `${label} Client`, externalReference: `REF-${label}` }).returning({ id: clients.id }); if (!client) throw new Error("Client fixture failed.");
    return { organization, user, client };
  }

  it("returns contacts and recent cases without crossing tenant boundaries", async () => {
    const first = await fixture("First"); const second = await fixture("Second");
    await connection.database.insert(clientContacts).values({ organizationId: first.organization.id, clientId: first.client.id, name: "Primary Person", email: "primary-first@example.test", isPrimary: true });
    await connection.database.insert(clientContacts).values({ organizationId: second.organization.id, clientId: second.client.id, name: "Hidden Person", email: "hidden-second@example.test", isPrimary: true });
    await connection.database.insert(cases).values({ organizationId: first.organization.id, clientId: first.client.id, createdById: first.user.id, sequence: 10, title: "Visible request", description: "Visible", status: "IN_PROGRESS", priority: "HIGH" });
    await connection.database.insert(cases).values({ organizationId: second.organization.id, clientId: second.client.id, createdById: second.user.id, sequence: 10, title: "Hidden request", description: "Hidden", status: "NEW", priority: "NORMAL" });
    const dossier = await getClientWorkspace(connection.database, first.organization.id, first.client.id);
    expect(dossier?.client.name).toBe("First Client"); expect(dossier?.contacts.map((contact) => contact.name)).toEqual(["Primary Person"]); expect(dossier?.cases.map((item) => item.title)).toEqual(["Visible request"]);
    await expect(getClientWorkspace(connection.database, first.organization.id, second.client.id)).resolves.toBeNull();
  });
});
