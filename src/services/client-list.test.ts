import { describe, expect, it, vi } from "vitest";

import { canManageClients, listClients, parseClientListSearchParams } from "./client-list";

describe("client list query", () => {
  it("owns search, archived state, cursor, and limit in the URL", () => {
    expect(parseClientListSearchParams({ search: "  Northstar  ", archived: "true", cursor: "opaque", limit: "10" })).toEqual({ search: "Northstar", archived: true, cursor: "opaque", limit: 10 });
    expect(parseClientListSearchParams({ archived: "false", limit: "999" })).toEqual({ archived: false, limit: 25 });
  });

  it("presents management only to owner and admin roles", () => {
    expect(canManageClients("OWNER")).toBe(true);
    expect(canManageClients("ADMIN")).toBe(true);
    expect(canManageClients("MEMBER")).toBe(false);
    expect(canManageClients("CLIENT")).toBe(false);
  });

  it("passes explicit tenant context to the repository", async () => {
    const page = { items: [], nextCursor: null };
    const list = vi.fn().mockResolvedValue(page);
    await expect(listClients({ list }, "organization-id", { archived: false, limit: 25 })).resolves.toBe(page);
    expect(list).toHaveBeenCalledWith("organization-id", { archived: false, limit: 25 });
  });
});
