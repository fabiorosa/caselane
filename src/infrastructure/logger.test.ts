import { describe, expect, it, vi } from "vitest";
import { redactMetadata, writeLog } from "./logger";

describe("structured logger", () => {
  it("redacts sensitive metadata without changing safe fields", () => {
    expect(redactMetadata({ databaseUrl: "postgresql://private", token: "opaque", status: "degraded" })).toEqual({
      databaseUrl: "[REDACTED]",
      token: "[REDACTED]",
      status: "degraded",
    });
  });

  it("writes one JSON record with correlation context", () => {
    const output = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    writeLog("warn", "health.degraded", { requestId: "request-1", metadata: { reason: "database" } });
    expect(JSON.parse(String(output.mock.calls[0]?.[0]))).toMatchObject({ level: "warn", event: "health.degraded", requestId: "request-1", metadata: { reason: "database" } });
    output.mockRestore();
  });
});
