import { describe, expect, it, vi } from "vitest";

import { addClientContact, archiveClientContact, updateClientContact } from "./client-contacts";

const record = { id: "contact-id", clientId: "client-id", name: "Avery Stone", email: "avery@example.com", jobTitle: null, isPrimary: true, archivedAt: null };

describe("client contact services", () => {
  it("rejects member mutations before calling the repository", async () => {
    const repository = { add: vi.fn(), update: vi.fn(), archive: vi.fn() };
    await expect(addClientContact(repository, { organizationId: "org-id", role: "MEMBER" }, "client-id", { name: "Avery", email: "avery@example.com" })).resolves.toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    await expect(updateClientContact(repository, { organizationId: "org-id", role: "MEMBER" }, "client-id", "contact-id", {})).resolves.toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    await expect(archiveClientContact(repository, { organizationId: "org-id", role: "MEMBER" }, "client-id", "contact-id")).resolves.toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(repository.add).not.toHaveBeenCalled();
  });

  it("validates and normalizes input before persistence", async () => {
    const add = vi.fn().mockResolvedValue(record);
    const result = await addClientContact({ add }, { organizationId: "org-id", role: "ADMIN" }, "client-id", { name: "  Avery Stone ", email: " AVERY@EXAMPLE.COM ", isPrimary: true });
    expect(result).toMatchObject({ ok: true });
    expect(add).toHaveBeenCalledWith("org-id", "client-id", { name: "Avery Stone", email: "avery@example.com", isPrimary: true });
    await expect(addClientContact({ add }, { organizationId: "org-id", role: "OWNER" }, "client-id", { name: "A", email: "bad" })).resolves.toMatchObject({ ok: false, error: { code: "VALIDATION" } });
  });

  it("maps uniqueness and missing records to safe expected errors", async () => {
    const duplicate = { add: vi.fn().mockRejectedValue({ cause: { code: "23505" } }) };
    await expect(addClientContact(duplicate, { organizationId: "org-id", role: "OWNER" }, "client-id", { name: "Avery", email: "avery@example.com" })).resolves.toMatchObject({ ok: false, error: { code: "CONFLICT" } });
    await expect(updateClientContact({ update: vi.fn().mockResolvedValue(null) }, { organizationId: "org-id", role: "ADMIN" }, "client-id", "contact-id", { name: "Avery", email: "avery@example.com" })).resolves.toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });
});
