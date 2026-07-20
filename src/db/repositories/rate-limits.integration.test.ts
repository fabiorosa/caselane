import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabaseConnection, type DatabaseConnection } from "@/db/client";
import { createRateLimitRepository } from "@/db/repositories/rate-limits";
import { rateLimits } from "@/db/schema";

const url = process.env.TEST_DATABASE_URL; const describeWithDatabase = url ? describe : describe.skip;
describeWithDatabase("rate limits with PostgreSQL", () => {
  let connection!: DatabaseConnection; const action = `test-${crypto.randomUUID()}`;
  beforeAll(() => { connection = createDatabaseConnection(url!); });
  afterAll(async () => { await connection.database.delete(rateLimits).where(eq(rateLimits.action, action)); await connection.close(); });
  it("increments atomically and resets in the next window", async () => {
    const repository = createRateLimitRepository(connection.database); const base = new Date("2026-07-19T12:00:00Z");
    await expect(repository.consume({ action, keyHash: "a".repeat(64), limit: 2, windowMs: 60_000, now: base })).resolves.toMatchObject({ allowed: true });
    await expect(repository.consume({ action, keyHash: "a".repeat(64), limit: 2, windowMs: 60_000, now: base })).resolves.toMatchObject({ allowed: true });
    await expect(repository.consume({ action, keyHash: "a".repeat(64), limit: 2, windowMs: 60_000, now: base })).resolves.toMatchObject({ allowed: false });
    await expect(repository.consume({ action, keyHash: "a".repeat(64), limit: 2, windowMs: 60_000, now: new Date(base.getTime() + 60_000) })).resolves.toMatchObject({ allowed: true });
  });
});
