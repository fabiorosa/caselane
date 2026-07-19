import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "@/db/client";
import { clientContacts, clients, memberships, organizations, users } from "@/db/schema";
import type { DemoPersona } from "@/domain/demo-access";

export interface DemoAccount { userId: string; role: DemoPersona; slug: string; }
export interface DemoAccessRepository { findActivePersona(role: DemoPersona): Promise<DemoAccount | null>; }
export function createDemoAccessRepository(database: Database, demoSlug = "orbit-labs"): DemoAccessRepository {
  return { async findActivePersona(role) {
    const [account] = await database.select({ userId:users.id,organizationId:organizations.id,role:memberships.role,slug:organizations.slug }).from(memberships).innerJoin(users,eq(users.id,memberships.userId)).innerJoin(organizations,eq(organizations.id,memberships.organizationId)).where(and(eq(organizations.isDemo,true),eq(organizations.slug,demoSlug),eq(memberships.role,role),eq(memberships.active,true),isNull(organizations.archivedAt),isNull(users.disabledAt))).limit(1);
    if (!account || (account.role !== "OWNER" && account.role !== "MEMBER" && account.role !== "CLIENT")) return null;
    if (role === "CLIENT") { const [contact] = await database.select({id:clientContacts.id}).from(clientContacts).innerJoin(clients,and(eq(clients.id,clientContacts.clientId),eq(clients.organizationId,account.organizationId))).where(and(eq(clientContacts.organizationId,account.organizationId),eq(clientContacts.userId,account.userId),isNull(clientContacts.archivedAt),isNull(clients.archivedAt))).limit(1); if(!contact) return null; }
    return {userId:account.userId,role:account.role,slug:account.slug};
  }};
}
