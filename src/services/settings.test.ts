import { describe, expect, it, vi } from "vitest";
import { saveCategory, setCategoryArchived, updateOrganizationSettings } from "./settings";

describe("settings services", () => {
  it("restricts workspace naming to the owner", async () => {
    const updateOrganizationName = vi.fn();
    await expect(updateOrganizationSettings({ updateOrganizationName }, { organizationId: "org", role: "ADMIN" }, { name: "Renamed" })).resolves.toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(updateOrganizationName).not.toHaveBeenCalled();
  });

  it("validates and tenant-scopes category changes", async () => {
    const createCategory = vi.fn().mockResolvedValue({ id: "category" });
    const updateCategory = vi.fn();
    await expect(saveCategory({ createCategory, updateCategory }, { organizationId: "org", role: "ADMIN" }, null, { name: " Access ", color: "#d9a441" })).resolves.toEqual({ ok: true, data: undefined });
    expect(createCategory).toHaveBeenCalledWith("org", { name: "Access", color: "#d9a441" });
  });

  it("prevents members from archiving categories", async () => {
    const archive = vi.fn();
    await expect(setCategoryArchived({ setCategoryArchived: archive }, { organizationId: "org", role: "MEMBER" }, "category", true)).resolves.toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(archive).not.toHaveBeenCalled();
  });
});
