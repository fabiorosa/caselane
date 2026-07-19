import { describe, expect, it, vi } from "vitest";

import type { OrganizationContextRepository } from "@/db/repositories/organizations";
import { resolveWorkspaceContext } from "./organization-context";

const user = { sessionId: "session-id", userId: "user-id", email: "avery@example.com", name: "Avery Stone" };

describe("workspace context", () => {
  it("resolves only an active membership for the requested slug", async () => {
    const repository: OrganizationContextRepository = {
      listAccessibleOrganizations: vi.fn(),
      findActiveOrganizationBySlug: vi.fn().mockResolvedValue({ id: "org-id", name: "Northstar Studio", slug: "northstar-studio", role: "OWNER" }),
    };

    await expect(resolveWorkspaceContext(repository, user, "northstar-studio")).resolves.toMatchObject({ id: "org-id", user });
    expect(repository.findActiveOrganizationBySlug).toHaveBeenCalledWith("user-id", "northstar-studio");
  });

  it("returns no context for a non-member or inactive membership", async () => {
    const repository: OrganizationContextRepository = { listAccessibleOrganizations: vi.fn(), findActiveOrganizationBySlug: vi.fn().mockResolvedValue(null) };
    await expect(resolveWorkspaceContext(repository, user, "other-team")).resolves.toBeNull();
  });
});
