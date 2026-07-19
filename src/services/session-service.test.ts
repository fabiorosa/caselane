import { describe, expect, it, vi } from "vitest";

import type { SessionRecord, SessionRepository } from "@/db/repositories/sessions";
import type { Clock } from "@/infrastructure/clock";
import { hashOpaqueToken } from "@/infrastructure/tokens";
import { createSession, getCurrentUserContext, rotateSession, signOutCurrentSession } from "./session-service";

const now = new Date("2026-07-18T12:00:00.000Z");
const clock: Clock = { now: () => now };
const rawToken = "session-token-for-tests";

function sessionRecord(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: "session-id",
    userId: "user-id",
    email: "person@example.com",
    name: "Person Example",
    disabledAt: null,
    expiresAt: new Date("2026-08-17T12:00:00.000Z"),
    lastSeenAt: now,
    ...overrides,
  };
}

function repository(record: SessionRecord | null): SessionRepository {
  return {
    create: vi.fn().mockResolvedValue({ id: "new-session-id" }),
    findByTokenHash: vi.fn().mockResolvedValue(record),
    touch: vi.fn().mockResolvedValue(undefined),
    revokeByTokenHash: vi.fn().mockResolvedValue(undefined),
    revokeAllForUser: vi.fn().mockResolvedValue(undefined),
  };
}

describe("session service", () => {
  it("creates sessions with a hashed token and a 30-day expiry", async () => {
    const repo = repository(null);
    const result = await createSession(repo, clock, { userId: "user-id", rawToken });

    expect(result.expiresAt).toEqual(new Date("2026-08-17T12:00:00.000Z"));
    expect(repo.create).toHaveBeenCalledWith({
      userId: "user-id",
      tokenHash: hashOpaqueToken(rawToken),
      expiresAt: result.expiresAt,
    });
  });

  it("returns only valid, enabled session contexts", async () => {
    await expect(getCurrentUserContext(repository(sessionRecord()), clock, rawToken)).resolves.toMatchObject({
      userId: "user-id",
    });
    await expect(getCurrentUserContext(repository(sessionRecord({ disabledAt: now })), clock, rawToken)).resolves.toBeNull();
    await expect(
      getCurrentUserContext(repository(sessionRecord({ expiresAt: new Date("2026-07-18T11:59:59.000Z") })), clock, rawToken),
    ).resolves.toBeNull();
  });

  it("rotates to a new token before revoking the current session", async () => {
    const repo = repository(null);
    await rotateSession(repo, clock, {
      userId: "user-id",
      currentRawToken: "current-token",
      nextRawToken: "next-token",
    });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ tokenHash: hashOpaqueToken("next-token") }));
    expect(repo.revokeByTokenHash).toHaveBeenCalledWith(hashOpaqueToken("current-token"));
    expect(vi.mocked(repo.create).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(repo.revokeByTokenHash).mock.invocationCallOrder[0],
    );
  });

  it("touches a valid session at most once an hour", async () => {
    const repo = repository(sessionRecord({ lastSeenAt: new Date("2026-07-18T10:59:59.000Z") }));
    await getCurrentUserContext(repo, clock, rawToken);
    expect(repo.touch).toHaveBeenCalledWith("session-id", now);
  });

  it("revokes the current hashed session on sign out", async () => {
    const repo = repository(null);
    await signOutCurrentSession(repo, rawToken);
    expect(repo.revokeByTokenHash).toHaveBeenCalledWith(hashOpaqueToken(rawToken));
  });
});
