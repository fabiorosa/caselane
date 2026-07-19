import "server-only";

import { eq } from "drizzle-orm";

import type { Database } from "@/db/client";
import { sessions, users } from "@/db/schema";

export interface SessionRecord {
  id: string;
  userId: string;
  email: string;
  name: string;
  disabledAt: Date | null;
  expiresAt: Date;
  lastSeenAt: Date;
}

export interface SessionRepository {
  create(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<{ id: string }>;
  findByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  touch(id: string, lastSeenAt: Date): Promise<void>;
  revokeByTokenHash(tokenHash: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}

export function createSessionRepository(database: Database): SessionRepository {
  return {
    async create(input) {
      const [session] = await database
        .insert(sessions)
        .values(input)
        .returning({ id: sessions.id });

      if (!session) {
        throw new Error("Session creation did not return a session id.");
      }

      return session;
    },
    async findByTokenHash(tokenHash) {
      const [record] = await database
        .select({
          id: sessions.id,
          userId: sessions.userId,
          email: users.email,
          name: users.name,
          disabledAt: users.disabledAt,
          expiresAt: sessions.expiresAt,
          lastSeenAt: sessions.lastSeenAt,
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(eq(sessions.tokenHash, tokenHash))
        .limit(1);

      return record ?? null;
    },
    async touch(id, lastSeenAt) {
      await database.update(sessions).set({ lastSeenAt }).where(eq(sessions.id, id));
    },
    async revokeByTokenHash(tokenHash) {
      await database.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
    },
    async revokeAllForUser(userId) {
      await database.delete(sessions).where(eq(sessions.userId, userId));
    },
  };
}
