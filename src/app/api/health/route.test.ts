import { describe, expect, it } from "vitest";
import { createHealthResponse } from "./route";

describe("health response", () => {
  it.each([
    ["reachable" as const, 200, { status: "ok", database: "reachable" }],
    ["unreachable" as const, 503, { status: "degraded", database: "unreachable" }],
  ])("reports %s database state without exposing connection details", async (database, status, body) => {
    const response = createHealthResponse(database, "request-123");

    expect(response.status).toBe(status);
    expect(response.headers.get("x-request-id")).toBe("request-123");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual(body);
  });
});
