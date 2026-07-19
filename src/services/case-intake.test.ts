import { describe, expect, it, vi } from "vitest";
import { InvalidCaseReferenceError } from "@/db/repositories/case-intake";
import { createCase } from "./case-intake";

const valid = { clientId: "10000000-0000-4000-8000-000000000001", title: "Export correction", description: "The monthly export contains duplicate rows.", priority: "HIGH" };

describe("case intake service", () => {
  it("rejects client-role intake before persistence", async () => {
    const repository = { create: vi.fn() };
    await expect(createCase(repository, { organizationId: "org", userId: "user", role: "CLIENT" }, valid)).resolves.toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("validates and normalizes a case before persistence", async () => {
    const repository = { create: vi.fn().mockResolvedValue({ id: "case", sequence: 1042 }) };
    const result = await createCase(repository, { organizationId: "org", userId: "user", role: "MEMBER" }, { ...valid, title: "  Export correction  " });
    expect(result).toEqual({ ok: true, data: { id: "case", sequence: 1042 } });
    expect(repository.create).toHaveBeenCalledWith("org", "user", expect.objectContaining({ title: "Export correction", priority: "HIGH" }));
  });

  it("returns safe validation errors for malformed and cross-tenant references", async () => {
    const repository = { create: vi.fn().mockRejectedValue(new InvalidCaseReferenceError("CLIENT")) };
    await expect(createCase(repository, { organizationId: "org", userId: "user", role: "OWNER" }, { ...valid, title: "x" })).resolves.toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    await expect(createCase(repository, { organizationId: "org", userId: "user", role: "OWNER" }, valid)).resolves.toMatchObject({ ok: false, error: { message: "Client is not available in this workspace." } });
  });
});
