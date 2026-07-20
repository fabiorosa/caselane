import "server-only";
import { and, asc, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { categories, organizations } from "@/db/schema";

export interface SettingsRepository {
  get(organizationId: string): Promise<{ organization: { name: string }; categories: Array<{ id: string; name: string; color: string; archived: boolean }> } | null>;
  updateOrganizationName(organizationId: string, name: string): Promise<boolean>;
  createCategory(organizationId: string, input: { name: string; color: string }): Promise<{ id: string }>;
  updateCategory(organizationId: string, categoryId: string, input: { name: string; color: string }): Promise<boolean>;
  setCategoryArchived(organizationId: string, categoryId: string, archived: boolean): Promise<boolean>;
}

export function createSettingsRepository(database: Database): SettingsRepository {
  return {
    async get(organizationId) {
      const [organization] = await database.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, organizationId)).limit(1);
      if (!organization) return null;
      const rows = await database.select({ id: categories.id, name: categories.name, color: categories.color, archivedAt: categories.archivedAt }).from(categories).where(eq(categories.organizationId, organizationId)).orderBy(asc(categories.name), asc(categories.id));
      return { organization, categories: rows.map(({ archivedAt, ...category }) => ({ ...category, archived: Boolean(archivedAt) })) };
    },
    async updateOrganizationName(organizationId, name) {
      const rows = await database.update(organizations).set({ name, updatedAt: new Date() }).where(eq(organizations.id, organizationId)).returning({ id: organizations.id });
      return rows.length === 1;
    },
    async createCategory(organizationId, input) {
      const [category] = await database.insert(categories).values({ organizationId, ...input }).returning({ id: categories.id });
      if (!category) throw new Error("Category insert failed.");
      return category;
    },
    async updateCategory(organizationId, categoryId, input) {
      const rows = await database.update(categories).set({ ...input, updatedAt: new Date() }).where(and(eq(categories.organizationId, organizationId), eq(categories.id, categoryId))).returning({ id: categories.id });
      return rows.length === 1;
    },
    async setCategoryArchived(organizationId, categoryId, archived) {
      const rows = await database.update(categories).set({ archivedAt: archived ? new Date() : null, updatedAt: new Date() }).where(and(eq(categories.organizationId, organizationId), eq(categories.id, categoryId))).returning({ id: categories.id });
      return rows.length === 1;
    },
  };
}
