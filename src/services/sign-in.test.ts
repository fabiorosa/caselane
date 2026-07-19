import { describe, expect, it, vi } from "vitest";

import type { AuthAccountRepository } from "@/db/repositories/auth";
import type { SessionRepository } from "@/db/repositories/sessions";
import { signIn } from "./sign-in";

const accounts: AuthAccountRepository = {
  findByEmail: vi.fn().mockResolvedValue({ id: "user-id", name: "Avery Stone", email: "avery@example.com", passwordHash: "hash", disabledAt: null }),
};
const sessions: Pick<SessionRepository, "create"> = { create: vi.fn().mockResolvedValue({ id: "session-id" }) };
const clock = { now: () => new Date("2026-07-18T12:00:00.000Z") };

describe("signIn", () => {
  it("creates an opaque session for verified credentials", async () => {
    const passwordService = { hash: vi.fn(), verify: vi.fn().mockResolvedValue(true) };
    const result = await signIn(accounts, sessions, clock, { email: " Avery@Example.com ", password: "a valid password with spaces" }, passwordService);

    expect(result).toMatchObject({ ok: true, data: { user: { email: "avery@example.com" }, rawSessionToken: expect.any(String) } });
    expect(sessions.create).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-id", tokenHash: expect.any(String) }));
  });

  it("returns the same generic feedback for missing, disabled, and invalid credentials", async () => {
    const passwordService = { hash: vi.fn(), verify: vi.fn().mockResolvedValue(false) };
    const missing: AuthAccountRepository = { findByEmail: vi.fn().mockResolvedValue(null) };
    const disabled: AuthAccountRepository = { findByEmail: vi.fn().mockResolvedValue({ id: "user-id", name: "Avery", email: "avery@example.com", passwordHash: "hash", disabledAt: new Date() }) };

    const [missingResult, disabledResult, invalidResult] = await Promise.all([
      signIn(missing, sessions, clock, { email: "avery@example.com", password: "a valid password with spaces" }, passwordService),
      signIn(disabled, sessions, clock, { email: "avery@example.com", password: "a valid password with spaces" }, passwordService),
      signIn(accounts, sessions, clock, { email: "avery@example.com", password: "a valid password with spaces" }, passwordService),
    ]);

    expect([missingResult, disabledResult, invalidResult]).toEqual(expect.arrayContaining([
      expect.objectContaining({ ok: false, error: expect.objectContaining({ message: "Email or password is incorrect." }) }),
    ]));
  });
});
