import { describe, expect, it, vi } from "vitest";

import { createClient, updateClient } from "./client-management";

describe("client management services", () => {
  it("preserves server authorization for create and update", async () => {
    const repository = { create: vi.fn(), update: vi.fn() };
    await expect(createClient(repository, { organizationId: "org", role: "MEMBER" }, { name: "Valid Client" })).resolves.toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    await expect(updateClient(repository, { organizationId: "org", role: "MEMBER" }, "client", { name: "Valid Client" })).resolves.toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("validates paired primary-contact fields and normalizes values", async () => {
    const create = vi.fn().mockResolvedValue({ id: "client" });
    await expect(createClient({ create }, { organizationId: "org", role: "OWNER" }, { name: "A", contactName: "Person" })).resolves.toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    const result = await createClient({ create }, { organizationId: "org", role: "ADMIN" }, { name: "  Northstar  ", contactName: " Avery Stone ", contactEmail: " AVERY@EXAMPLE.COM " });
    expect(result).toMatchObject({ ok: true });
    expect(create).toHaveBeenCalledWith("org", expect.objectContaining({ name: "Northstar", contactName: "Avery Stone", contactEmail: "avery@example.com" }));
  });

  it("returns conflict and missing-client feedback", async () => {
    await expect(createClient({ create: vi.fn().mockRejectedValue({ cause: { code: "23505" } }) }, { organizationId: "org", role: "OWNER" }, { name: "Valid Client" })).resolves.toMatchObject({ ok: false, error: { code: "CONFLICT" } });
    await expect(updateClient({ update: vi.fn().mockResolvedValue(null) }, { organizationId: "org", role: "ADMIN" }, "missing", { name: "Valid Client" })).resolves.toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });
});
