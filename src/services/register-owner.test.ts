import { describe, expect, it, vi } from "vitest";

import type { OwnerRegistrationStore, OwnerRegistrationTransaction } from "./register-owner";
import { registerOwner } from "./register-owner";

const input = {
  name: "Avery Stone",
  email: " Avery@Example.COM ",
  password: "a password accepted by the product",
  workspaceName: "Northstar Studio",
  acceptedTerms: true as const,
};

function transaction(overrides: Partial<OwnerRegistrationTransaction> = {}): OwnerRegistrationTransaction {
  return {
    findUserByEmail: vi.fn().mockResolvedValue(null),
    createUser: vi.fn().mockResolvedValue({ id: "user-id", name: "Avery Stone", email: "avery@example.com" }),
    createOrganization: vi.fn().mockResolvedValue({ id: "organization-id", slug: "northstar-studio" }),
    createOwnerMembership: vi.fn().mockResolvedValue(undefined),
    createDefaultCategories: vi.fn().mockResolvedValue(undefined),
    createSession: vi.fn().mockResolvedValue({ id: "session-id" }),
    ...overrides,
  };
}

function store(tx: OwnerRegistrationTransaction): OwnerRegistrationStore {
  return { transaction: (callback) => callback(tx) };
}

const clock = { now: () => new Date("2026-07-18T12:00:00.000Z") };
const passwordService = { hash: vi.fn().mockResolvedValue("argon2-hash"), verify: vi.fn() };

describe("registerOwner", () => {
  it("creates one owner, defaults, and a hashed session in one transaction", async () => {
    const tx = transaction();
    const result = await registerOwner(store(tx), clock, input, passwordService);

    expect(result).toMatchObject({ ok: true, data: { organizationSlug: "northstar-studio" } });
    expect(tx.createUser).toHaveBeenCalledWith(expect.objectContaining({ email: "avery@example.com" }));
    expect(tx.createOwnerMembership).toHaveBeenCalledWith({ organizationId: "organization-id", userId: "user-id" });
    expect(tx.createDefaultCategories).toHaveBeenCalledWith("organization-id", ["General", "Technical support", "Account"]);
    expect(tx.createSession).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-id", tokenHash: expect.any(String) }));
  });

  it("returns sign-in-oriented feedback for duplicate normalized email", async () => {
    const tx = transaction({ findUserByEmail: vi.fn().mockResolvedValue({ id: "existing-user" }) });
    const result = await registerOwner(store(tx), clock, input, passwordService);

    expect(result).toMatchObject({ ok: false, error: { code: "CONFLICT", message: expect.stringContaining("Sign in") } });
    expect(tx.createUser).not.toHaveBeenCalled();
  });

  it("retries a conflicting workspace slug", async () => {
    const createOrganization = vi
      .fn()
      .mockRejectedValueOnce({ code: "23505" })
      .mockResolvedValueOnce({ id: "organization-id", slug: "northstar-studio-2" });
    const tx = transaction({ createOrganization });

    const result = await registerOwner(store(tx), clock, input, passwordService);

    expect(result).toMatchObject({ ok: true, data: { organizationSlug: "northstar-studio-2" } });
    expect(createOrganization).toHaveBeenNthCalledWith(2, { name: "Northstar Studio", slug: "northstar-studio-2" });
  });

  it("propagates failures so the store transaction can roll back all writes", async () => {
    const rollback = vi.fn();
    const tx = transaction({ createDefaultCategories: vi.fn().mockRejectedValue(new Error("write failure")) });
    const transactionalStore: OwnerRegistrationStore = {
      transaction: async (callback) => {
        try {
          return await callback(tx);
        } catch (error) {
          rollback();
          throw error;
        }
      },
    };

    await expect(registerOwner(transactionalStore, clock, input, passwordService)).rejects.toThrow("write failure");
    expect(rollback).toHaveBeenCalledOnce();
    expect(tx.createSession).not.toHaveBeenCalled();
  });
});
