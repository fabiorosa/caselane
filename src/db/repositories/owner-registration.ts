import "server-only";

import { eq } from "drizzle-orm";

import type { Database } from "@/db/client";
import { categories, memberships, organizations, sessions, users } from "@/db/schema";
import type { OwnerRegistrationStore } from "@/services/register-owner";

export function createOwnerRegistrationStore(database: Database): OwnerRegistrationStore {
  return {
    transaction: (callback) =>
      database.transaction(async (transaction) =>
        callback({
          async findUserByEmail(email) {
            const [user] = await transaction.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
            return user ?? null;
          },
          async createUser(input) {
            const [user] = await transaction.insert(users).values(input).returning({
              id: users.id,
              name: users.name,
              email: users.email,
            });

            if (!user) {
              throw new Error("User creation did not return a user.");
            }

            return user;
          },
          async createOrganization(input) {
            const [organization] = await transaction.insert(organizations).values(input).returning({
              id: organizations.id,
              slug: organizations.slug,
            });

            if (!organization) {
              throw new Error("Organization creation did not return an organization.");
            }

            return organization;
          },
          async createOwnerMembership(input) {
            await transaction.insert(memberships).values({ ...input, role: "OWNER" });
          },
          async createDefaultCategories(organizationId, categoryNames) {
            await transaction.insert(categories).values(categoryNames.map((name) => ({ organizationId, name })));
          },
          async createSession(input) {
            const [session] = await transaction.insert(sessions).values(input).returning({ id: sessions.id });

            if (!session) {
              throw new Error("Session creation did not return a session.");
            }

            return session;
          },
        }),
      ),
  };
}
