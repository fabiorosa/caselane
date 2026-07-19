import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import type { Database } from "@/db/client";
import { memberships, organizations } from "@/db/schema";

export interface AccessibleOrganization {
  id: string;
  name: string;
  slug: string;
  isDemo: boolean;
  role: "OWNER" | "ADMIN" | "MEMBER" | "CLIENT";
}

export interface OrganizationContextRepository {
  listAccessibleOrganizations(userId: string): Promise<AccessibleOrganization[]>;
  findActiveOrganizationBySlug(userId: string, slug: string): Promise<AccessibleOrganization | null>;
}

export function createOrganizationContextRepository(database: Database): OrganizationContextRepository {
  const selection = {
    id: organizations.id,
    name: organizations.name,
    slug: organizations.slug,
    isDemo: organizations.isDemo,
    role: memberships.role,
  } as const;

  return {
    async listAccessibleOrganizations(userId) {
      return database
        .select(selection)
        .from(memberships)
        .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
        .where(and(eq(memberships.userId, userId), eq(memberships.active, true), isNull(organizations.archivedAt)))
        .orderBy(organizations.name, organizations.id);
    },
    async findActiveOrganizationBySlug(userId, slug) {
      const [organization] = await database
        .select(selection)
        .from(memberships)
        .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
        .where(and(eq(memberships.userId, userId), eq(memberships.active, true), eq(organizations.slug, slug), isNull(organizations.archivedAt)))
        .limit(1);

      return organization ?? null;
    },
  };
}
