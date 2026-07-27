import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createDatabaseConnection,
  type DatabaseConnection,
} from "@/db/client";
import {
  addPortalReply,
  getPortalCase,
  listPortalRequests,
  resolvePortalIdentity,
  submitPortalRequest,
} from "@/db/repositories/portal";
import {
  caseActivities,
  caseMessages,
  cases,
  clientContacts,
  clients,
  memberships,
  organizations,
  users,
} from "@/db/schema";

const url = process.env.TEST_DATABASE_URL;
const describeWithDatabase = url ? describe : describe.skip;

describeWithDatabase("client portal repository with PostgreSQL", () => {
  let connection!: DatabaseConnection;
  const organizationIds: string[] = [];
  const userIds: string[] = [];

  beforeAll(() => {
    connection = createDatabaseConnection(url!);
  });

  afterAll(async () => {
    if (organizationIds.length) {
      await connection.database
        .delete(organizations)
        .where(inArray(organizations.id, organizationIds));
    }

    if (userIds.length) {
      await connection.database
        .delete(users)
        .where(inArray(users.id, userIds));
    }

    await connection.close();
  });

  async function fixture() {
    const suffix = randomUUID();
    const [organization] = await connection.database
      .insert(organizations)
      .values({ name: "Portal team", slug: `portal-${suffix}` })
      .returning();
    const [otherOrganization] = await connection.database
      .insert(organizations)
      .values({ name: "Other team", slug: `portal-other-${suffix}` })
      .returning();
    const [user] = await connection.database
      .insert(users)
      .values({
        name: "Client Contact",
        email: `portal-${suffix}@example.test`,
        passwordHash: "test",
      })
      .returning();

    if (!organization || !otherOrganization || !user) {
      throw new Error("Fixture failed.");
    }

    organizationIds.push(organization.id, otherOrganization.id);
    userIds.push(user.id);

    await connection.database.insert(memberships).values({
      organizationId: organization.id,
      userId: user.id,
      role: "CLIENT",
    });

    const [client] = await connection.database
      .insert(clients)
      .values({
        organizationId: organization.id,
        name: "Northstar Client",
      })
      .returning();
    const [otherClient] = await connection.database
      .insert(clients)
      .values({
        organizationId: otherOrganization.id,
        name: "Hidden Client",
      })
      .returning();

    if (!client || !otherClient) {
      throw new Error("Client fixture failed.");
    }

    const [contact] = await connection.database
      .insert(clientContacts)
      .values({
        organizationId: organization.id,
        clientId: client.id,
        userId: user.id,
        name: "Client Contact",
        email: user.email,
      })
      .returning();

    if (!contact) {
      throw new Error("Contact fixture failed.");
    }

    return {
      organization,
      otherOrganization,
      user,
      client,
      otherClient,
      contact,
    };
  }

  it("resolves one active contact and lists only that client's requests", async () => {
    const {
      organization,
      otherOrganization,
      user,
      client,
      otherClient,
    } = await fixture();

    await connection.database.insert(cases).values([
      {
        organizationId: organization.id,
        sequence: 1001,
        clientId: client.id,
        createdById: user.id,
        title: "Visible request",
        description: "Visible portal request.",
      },
      {
        organizationId: otherOrganization.id,
        sequence: 1001,
        clientId: otherClient.id,
        createdById: user.id,
        title: "Hidden request",
        description: "Hidden portal request.",
      },
    ]);

    const identity = await resolvePortalIdentity(
      connection.database,
      user.id,
      organization.slug,
    );

    expect(identity).toMatchObject({
      clientId: client.id,
      organizationId: organization.id,
    });
    expect(
      await resolvePortalIdentity(
        connection.database,
        user.id,
        otherOrganization.slug,
      ),
    ).toBeNull();

    const page = await listPortalRequests(connection.database, identity!, {
      state: "open",
    });

    expect(page.map((item) => item.title)).toEqual(["Visible request"]);
  });

  it("derives ownership and fixed priority when submitting", async () => {
    const { organization, user, client, contact } = await fixture();
    const identity = await resolvePortalIdentity(
      connection.database,
      user.id,
      organization.slug,
    );
    const created = await submitPortalRequest(connection.database, identity!, {
      title: "New portal request",
      description: "This request came from the client portal.",
    });
    const [record] = await connection.database
      .select()
      .from(cases)
      .where(eq(cases.id, created.id));

    expect(record).toMatchObject({
      organizationId: organization.id,
      clientId: client.id,
      requesterContactId: contact.id,
      createdById: user.id,
      assigneeId: null,
      priority: "NORMAL",
      status: "NEW",
    });

    const [activity] = await connection.database
      .select()
      .from(caseActivities)
      .where(eq(caseActivities.caseId, created.id));

    expect(activity?.metadata).toMatchObject({ source: "CLIENT_PORTAL" });
  });

  it("rejects archived client relationships before consuming a sequence", async () => {
    const { organization, user, client } = await fixture();
    const identity = await resolvePortalIdentity(
      connection.database,
      user.id,
      organization.slug,
    );

    await connection.database
      .update(clients)
      .set({ archivedAt: new Date() })
      .where(eq(clients.id, client.id));

    await expect(
      submitPortalRequest(connection.database, identity!, {
        title: "Blocked request",
        description: "This must not enter the queue.",
      }),
    ).rejects.toThrow("relationship");

    const [savedOrganization] = await connection.database
      .select()
      .from(organizations)
      .where(eq(organizations.id, organization.id));

    expect(savedOrganization?.caseSequence).toBe(1000);
  });

  it("never selects internal notes and forces portal replies to client visibility", async () => {
    const { organization, user } = await fixture();
    const identity = await resolvePortalIdentity(
      connection.database,
      user.id,
      organization.slug,
    );
    const created = await submitPortalRequest(connection.database, identity!, {
      title: "Conversation boundary",
      description: "Verify the public conversation boundary.",
    });

    await connection.database.insert(caseMessages).values([
      {
        organizationId: organization.id,
        caseId: created.id,
        authorId: user.id,
        visibility: "INTERNAL",
        body: "Secret internal note",
      },
      {
        organizationId: organization.id,
        caseId: created.id,
        authorId: user.id,
        visibility: "CLIENT",
        body: "Visible update",
      },
    ]);

    const view = await getPortalCase(
      connection.database,
      identity!,
      created.id,
    );

    expect(view?.messages.map((message) => message.body)).toEqual([
      "Visible update",
    ]);
    expect(JSON.stringify(view)).not.toContain("Secret internal note");
    expect(
      await addPortalReply(connection.database, identity!, created.id, {
        body: "Client response",
      }),
    ).toBe(true);

    const savedMessages = await connection.database
      .select()
      .from(caseMessages)
      .where(eq(caseMessages.caseId, created.id));

    expect(savedMessages.map((message) => message.visibility)).toEqual(
      expect.arrayContaining(["INTERNAL", "CLIENT", "CLIENT"]),
    );
  });
});
