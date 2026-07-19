import { describe, expect, it, vi } from "vitest";

import { createLocalInvitationEmailAdapter } from "@/infrastructure/invitation-email";
import { inviteMember } from "./invite-member";

const store = { create: vi.fn().mockResolvedValue({ id: "invitation-id" }) };
const clock = { now: () => new Date("2026-07-18T12:00:00.000Z") };
const context = { organizationId: "org-id", organizationName: "Northstar Studio", userId: "owner-id", role: "OWNER" as const, appUrl: "http://localhost:3108" };

describe("inviteMember", () => {
  it("creates a hashed, seven-day invitation and exposes the local preview only through the adapter", async () => {
    const result = await inviteMember(store, createLocalInvitationEmailAdapter(false), clock, context, { email: "Person@Example.com", role: "MEMBER" });
    expect(result).toMatchObject({ ok: true, data: { invitationId: "invitation-id", previewUrl: expect.stringContaining("/accept-invite/") } });
    expect(store.create).toHaveBeenCalledWith(expect.objectContaining({ email: "person@example.com", role: "MEMBER", tokenHash: expect.any(String), expiresAt: new Date("2026-07-25T12:00:00.000Z") }));
  });

  it("blocks members and owner invitations", async () => {
    await expect(inviteMember(store, createLocalInvitationEmailAdapter(false), clock, { ...context, role: "MEMBER" }, { email: "person@example.com", role: "ADMIN" })).resolves.toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    await expect(inviteMember(store, createLocalInvitationEmailAdapter(false), clock, context, { email: "person@example.com", role: "OWNER" })).resolves.toMatchObject({ ok: false, error: { code: "VALIDATION" } });
  });

  it("never returns a preview URL from the production adapter", async () => {
    await expect(inviteMember(store, createLocalInvitationEmailAdapter(true), clock, context, { email: "person@example.com", role: "ADMIN" })).resolves.toEqual({ ok: true, data: { invitationId: "invitation-id" } });
  });
});
