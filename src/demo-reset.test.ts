import { describe, expect, it } from "vitest";
import { assertDemoResetEnvironment } from "../scripts/demo-reset-policy.mjs";

describe("demo reset policy", () => {
  it("rejects interactive or incompletely configured resets", () => {
    expect(() => assertDemoResetEnvironment({})).toThrow("disabled");
    expect(() => assertDemoResetEnvironment({ ALLOW_DEMO_RESET: "true" })).toThrow("DATABASE_URL");
    expect(() => assertDemoResetEnvironment({ ALLOW_DEMO_RESET: "true", DATABASE_URL: "postgres://local", DEMO_PASSWORD: "short" })).toThrow("12 characters");
  });

  it("accepts a deployment-authorized reset", () => {
    expect(() => assertDemoResetEnvironment({ ALLOW_DEMO_RESET: "true", DATABASE_URL: "postgres://local", DEMO_PASSWORD: "long-demo-password" })).not.toThrow();
  });
});
