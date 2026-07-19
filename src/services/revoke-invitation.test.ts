import { describe, expect, it, vi } from "vitest";

import { revokeInvitation } from "./revoke-invitation";

describe("revokeInvitation", () => {
  it("scopes revocation to the authorized organization", async () => {
    const store = { revoke: vi.fn().mockResolvedValue(true) };
    await expect(revokeInvitation(store, { organizationId: "org-id", role: "ADMIN" }, "invite-id")).resolves.toEqual({ ok: true, data: undefined });
    expect(store.revoke).toHaveBeenCalledWith("org-id", "invite-id");
  });

  it("rejects unauthorized and missing invitations", async () => {
    const store = { revoke: vi.fn().mockResolvedValue(false) };
    await expect(revokeInvitation(store, { organizationId: "org-id", role: "MEMBER" }, "invite-id")).resolves.toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    await expect(revokeInvitation(store, { organizationId: "org-id", role: "OWNER" }, "invite-id")).resolves.toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });
});
