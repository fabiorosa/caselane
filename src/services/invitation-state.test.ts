import { describe, expect, it } from "vitest";

import { canRevokeInvitation, invitationCanBeAccepted, type InvitationState } from "./invitation-state";

const invitation: InvitationState = { id: "invite", organizationId: "org", organizationName: "Northstar Studio", organizationSlug: "northstar-studio", email: "person@example.com", role: "MEMBER", status: "PENDING", expiresAt: new Date("2026-07-25T12:00:00.000Z") };

describe("invitation state", () => {
  it("accepts only pending, unexpired invitations", () => {
    const now = new Date("2026-07-18T12:00:00.000Z");
    expect(invitationCanBeAccepted(invitation, now)).toBe(true);
    expect(invitationCanBeAccepted({ ...invitation, status: "REVOKED" }, now)).toBe(false);
    expect(invitationCanBeAccepted({ ...invitation, status: "ACCEPTED" }, now)).toBe(false);
    expect(invitationCanBeAccepted({ ...invitation, expiresAt: now }, now)).toBe(false);
  });

  it("allows only owners and admins to revoke", () => {
    expect(canRevokeInvitation("OWNER")).toBe(true);
    expect(canRevokeInvitation("ADMIN")).toBe(true);
    expect(canRevokeInvitation("MEMBER")).toBe(false);
  });
});
