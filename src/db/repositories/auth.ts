import "server-only";

import { eq } from "drizzle-orm";

import type { Database } from "@/db/client";
import { users } from "@/db/schema";

export interface AuthAccountRepository {
  findByEmail(email: string): Promise<{ id: string; name: string; email: string; passwordHash: string; disabledAt: Date | null } | null>;
}

export function createAuthAccountRepository(database: Database): AuthAccountRepository {
  return {
    async findByEmail(email) {
      const [user] = await database
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          passwordHash: users.passwordHash,
          disabledAt: users.disabledAt,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return user ?? null;
    },
  };
}
