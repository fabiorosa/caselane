import { describe, expect, it } from "vitest";

import { EnvironmentConfigurationError, parseServerEnvironment } from "./env";

const validEnvironment = {
  DATABASE_URL: "postgresql://caselane:caselane@localhost:55432/caselane",
  APP_URL: "http://localhost:3108",
  SESSION_SECRET: "a-secure-session-secret-with-at-least-32-characters",
  DEMO_ACCESS_ENABLED: "true",
};

describe("server environment", () => {
  it("parses the required server-only configuration", () => {
    expect(parseServerEnvironment(validEnvironment)).toEqual({ ...validEnvironment, DEMO_ACCESS_ENABLED: true });
  });

  it("reports missing configuration by field without exposing values", () => {
    expect(() => parseServerEnvironment({ ...validEnvironment, DATABASE_URL: undefined })).toThrow(
      EnvironmentConfigurationError,
    );

    try {
      parseServerEnvironment({ ...validEnvironment, SESSION_SECRET: "secret-value-must-not-leak" });
    } catch (error) {
      expect(error).toBeInstanceOf(EnvironmentConfigurationError);
      expect(error).toMatchObject({ fields: ["SESSION_SECRET"] });
      expect(String(error)).not.toContain("secret-value-must-not-leak");
    }
  });

  it("rejects invalid PostgreSQL URLs", () => {
    expect(() => parseServerEnvironment({ ...validEnvironment, DATABASE_URL: "https://example.com" })).toThrow(
      "DATABASE_URL",
    );
  });

  it("disables demo access by default", () => {
    const withoutFlag: Record<string,string|undefined> = { ...validEnvironment };
    delete withoutFlag.DEMO_ACCESS_ENABLED;
    expect(parseServerEnvironment(withoutFlag).DEMO_ACCESS_ENABLED).toBe(false);
  });
});
