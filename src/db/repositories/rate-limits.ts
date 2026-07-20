import "server-only";
import { and, eq, lt, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { rateLimits } from "@/db/schema";
import type { RateLimitRepository } from "@/infrastructure/rate-limit";

export function createRateLimitRepository(database: Database): RateLimitRepository {
  return {
    async consume(input) {
      const windowStartMs = Math.floor(input.now.getTime() / input.windowMs) * input.windowMs;
      const windowStart = new Date(windowStartMs);
      await database.delete(rateLimits).where(and(eq(rateLimits.action, input.action), eq(rateLimits.keyHash, input.keyHash), lt(rateLimits.windowStart, windowStart)));
      const [row] = await database.insert(rateLimits).values({ action: input.action, keyHash: input.keyHash, windowStart, count: 1 }).onConflictDoUpdate({
        target: [rateLimits.action, rateLimits.keyHash, rateLimits.windowStart],
        set: { count: sql`${rateLimits.count} + 1` },
      }).returning({ count: rateLimits.count });
      const retryAfterSeconds = Math.max(1, Math.ceil((windowStartMs + input.windowMs - input.now.getTime()) / 1000));
      return { allowed: (row?.count ?? input.limit + 1) <= input.limit, retryAfterSeconds };
    },
  };
}
