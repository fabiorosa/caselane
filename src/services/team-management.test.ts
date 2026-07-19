import { describe, expect, it, vi } from "vitest";

import { setTeamMemberActive, updateTeamMemberProfile, updateTeamMemberRole } from "./team-management";

describe("team management", () => {
  it("allows owners and admins to manage non-owner members within their organization", async () => {
    const repository = { updateRole: vi.fn().mockResolvedValue(true), setActive: vi.fn().mockResolvedValue(true) };
    await expect(updateTeamMemberRole(repository, { organizationId: "org-id", role: "ADMIN" }, { userId: "member-id", role: "MEMBER" })).resolves.toEqual({ ok: true, data: undefined });
    await expect(setTeamMemberActive(repository, { organizationId: "org-id", role: "OWNER" }, { userId: "member-id", active: false })).resolves.toEqual({ ok: true, data: undefined });
    expect(repository.updateRole).toHaveBeenCalledWith("org-id", "member-id", "MEMBER");
    expect(repository.setActive).toHaveBeenCalledWith("org-id", "member-id", false);
  });

  it("rejects members, owner role changes, and protected owner mutations", async () => {
    const repository = { updateRole: vi.fn().mockResolvedValue(false), setActive: vi.fn().mockResolvedValue(false) };
    await expect(updateTeamMemberRole(repository, { organizationId: "org-id", role: "MEMBER" }, { userId: "member-id", role: "ADMIN" })).resolves.toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    await expect(updateTeamMemberRole(repository, { organizationId: "org-id", role: "OWNER" }, { userId: "owner-id", role: "OWNER" })).resolves.toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    await expect(setTeamMemberActive(repository, { organizationId: "org-id", role: "ADMIN" }, { userId: "owner-id", active: false })).resolves.toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("validates and updates a managed member profile", async () => {
    const repository = { updateProfile: vi.fn().mockResolvedValue(true) };
    await expect(updateTeamMemberProfile(repository, { organizationId: "org-id", role: "OWNER" }, { userId: "member-id", name: "  Casey Brooks ", title: "Operations lead", role: "ADMIN" })).resolves.toEqual({ ok: true, data: undefined });
    expect(repository.updateProfile).toHaveBeenCalledWith("org-id", "member-id", { name: "Casey Brooks", title: "Operations lead", role: "ADMIN" });
    await expect(updateTeamMemberProfile(repository, { organizationId: "org-id", role: "MEMBER" }, { userId: "member-id", name: "Casey", title: "", role: "MEMBER" })).resolves.toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    await expect(updateTeamMemberProfile(repository, { organizationId: "org-id", role: "OWNER" }, { userId: "member-id", name: "", title: "", role: "MEMBER" })).resolves.toMatchObject({ ok: false, error: { code: "VALIDATION" } });
  });
});
