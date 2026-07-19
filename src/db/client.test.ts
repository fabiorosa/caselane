import { describe, expect, it, vi } from "vitest";

import { checkDatabaseHealth, installDatabaseShutdownHandlers } from "./client";

describe("database health", () => {
  it("returns reachable when the adapter succeeds", async () => {
    await expect(checkDatabaseHealth({ executeHealthQuery: async () => undefined })).resolves.toBe("reachable");
  });

  it("returns unreachable when the adapter fails without exposing the cause", async () => {
    await expect(
      checkDatabaseHealth({
        executeHealthQuery: async () => Promise.reject(new Error("postgresql://private:secret@host/db")),
      }),
    ).resolves.toBe("unreachable");
  });
});

describe("database shutdown handlers", () => {
  it("installs one handler for each supported shutdown signal", () => {
    const register = vi.fn();
    installDatabaseShutdownHandlers(register);

    expect(register).toHaveBeenCalledTimes(2);
    expect(register).toHaveBeenCalledWith("SIGINT", expect.any(Function));
    expect(register).toHaveBeenCalledWith("SIGTERM", expect.any(Function));
  });
});
