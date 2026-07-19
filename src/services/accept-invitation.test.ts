import { describe, expect, it, vi } from "vitest";

import { hashOpaqueToken } from "@/infrastructure/tokens";
import { acceptInvitationForExistingUser, acceptInvitationForNewUser, type InvitationAcceptanceStore } from "./accept-invitation";

const now = new Date("2026-07-18T12:00:00.000Z");
const invitation = { id: "invite-id", organizationId: "org-id", organizationName: "Northstar Studio", organizationSlug: "northstar-studio", email: "person@example.com", role: "MEMBER" as const, status: "PENDING" as const, expiresAt: new Date("2026-07-25T12:00:00.000Z") };

function store(record = invitation): InvitationAcceptanceStore {
  return { findByTokenHash: vi.fn().mockResolvedValue(record), acceptExistingUser: vi.fn().mockResolvedValue(undefined), acceptNewUser: vi.fn().mockResolvedValue({ userId: "new-user" }) };
}

describe("existing-user invitation acceptance", () => {
  it("accepts the matching normalized email once", async () => {
    const repository = store();
    await expect(acceptInvitationForExistingUser(repository, now, { rawToken: "token", user: { userId: "user-id", email: " Person@Example.COM " } })).resolves.toEqual({ ok: true, data: { organizationId: "org-id", organizationSlug: "northstar-studio" } });
    expect(repository.findByTokenHash).toHaveBeenCalledWith(hashOpaqueToken("token"));
    expect(repository.acceptExistingUser).toHaveBeenCalledWith(expect.objectContaining({ role: "MEMBER", userId: "user-id" }));
  });

  it("rejects mismatched or expired invitations safely", async () => {
    await expect(acceptInvitationForExistingUser(store(), now, { rawToken: "token", user: { userId: "user", email: "other@example.com" } })).resolves.toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    await expect(acceptInvitationForExistingUser(store({ ...invitation, expiresAt: now }), now, { rawToken: "token", user: { userId: "user", email: invitation.email } })).resolves.toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("creates a new user acceptance with a hashed session token", async () => {
    const repository = store();
    const passwordService = { hash: vi.fn().mockResolvedValue("argon2-hash"), verify: vi.fn() };
    const result = await acceptInvitationForNewUser(repository, { now: () => now }, { rawToken: "token", name: "Avery Stone", password: "a valid password with spaces" }, passwordService);
    expect(result).toMatchObject({ ok: true, data: { organizationId: "org-id", rawSessionToken: expect.any(String) } });
    expect(repository.acceptNewUser).toHaveBeenCalledWith(expect.objectContaining({ email: invitation.email, passwordHash: "argon2-hash", tokenHash: expect.any(String) }));
  });
});
