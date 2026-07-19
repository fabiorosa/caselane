import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { createDatabaseConnection, type DatabaseConnection } from "@/db/client";
import { createInvitationRepository } from "@/db/repositories/invitations";
import { invitations, memberships, organizations, users } from "@/db/schema";
import { hashOpaqueToken } from "@/infrastructure/tokens";
import { acceptInvitationForNewUser } from "./accept-invitation";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

describeWithDatabase("invitation lifecycle with PostgreSQL", () => {
  let connection!: DatabaseConnection;
  const createdUserIds: string[] = [];
  const createdOrganizationIds: string[] = [];

  beforeAll(() => {
    connection = createDatabaseConnection(testDatabaseUrl!);
  });

  afterAll(async () => {
    if (createdOrganizationIds.length) await connection.database.delete(organizations).where(inArray(organizations.id, createdOrganizationIds));
    if (createdUserIds.length) await connection.database.delete(users).where(inArray(users.id, createdUserIds));
    await connection.close();
  });

  async function createPendingInvitation(email: string) {
    const suffix = randomUUID();
    const [owner] = await connection.database.insert(users).values({ email: `owner-${suffix}@example.com`, name: "Owner", passwordHash: "test-hash" }).returning({ id: users.id });
    const [organization] = await connection.database.insert(organizations).values({ name: "Integration Workspace", slug: `integration-${suffix}` }).returning({ id: organizations.id, slug: organizations.slug });
    if (!owner || !organization) throw new Error("Could not create invitation fixtures.");
    createdUserIds.push(owner.id);
    createdOrganizationIds.push(organization.id);
    await connection.database.insert(memberships).values({ organizationId: organization.id, userId: owner.id, role: "OWNER" });
    const rawToken = randomUUID();
    const [invitation] = await connection.database.insert(invitations).values({ organizationId: organization.id, invitedById: owner.id, email, role: "MEMBER", tokenHash: hashOpaqueToken(rawToken), expiresAt: new Date("2026-08-01T00:00:00.000Z") }).returning({ id: invitations.id });
    if (!invitation) throw new Error("Could not create invitation fixture.");
    return { rawToken, invitationId: invitation.id, organization };
  }

  it("accepts a new user once and commits membership and session atomically", async () => {
    const email = `member-${randomUUID()}@example.com`;
    const fixture = await createPendingInvitation(email);
    const repository = createInvitationRepository(connection.database);
    const result = await acceptInvitationForNewUser(repository, { now: () => new Date("2026-07-19T00:00:00.000Z") }, { rawToken: fixture.rawToken, name: "New Member", password: "a valid integration password" }, { hash: vi.fn().mockResolvedValue("argon2-hash"), verify: vi.fn() });
    expect(result).toMatchObject({ ok: true, data: { organizationSlug: fixture.organization.slug } });

    const [member] = await connection.database.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (member) createdUserIds.push(member.id);
    expect(member).toBeDefined();
    const membership = member ? await connection.database.select().from(memberships).where(eq(memberships.userId, member.id)) : [];
    expect(membership).toHaveLength(1);
    await expect(acceptInvitationForNewUser(repository, { now: () => new Date("2026-07-19T00:00:01.000Z") }, { rawToken: fixture.rawToken, name: "Again", password: "a valid integration password" })).resolves.toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("rolls the invitation claim back when user creation conflicts", async () => {
    const email = `duplicate-${randomUUID()}@example.com`;
    const [existing] = await connection.database.insert(users).values({ email, name: "Existing", passwordHash: "test-hash" }).returning({ id: users.id });
    if (!existing) throw new Error("Could not create duplicate user fixture.");
    createdUserIds.push(existing.id);
    const fixture = await createPendingInvitation(email);
    const repository = createInvitationRepository(connection.database);

    await expect(acceptInvitationForNewUser(repository, { now: () => new Date("2026-07-19T00:00:00.000Z") }, { rawToken: fixture.rawToken, name: "Duplicate", password: "a valid integration password" }, { hash: vi.fn().mockResolvedValue("argon2-hash"), verify: vi.fn() })).rejects.toBeDefined();
    const [invitation] = await connection.database.select({ status: invitations.status }).from(invitations).where(eq(invitations.id, fixture.invitationId));
    expect(invitation?.status).toBe("PENDING");
  });
});
