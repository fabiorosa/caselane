import { describe, expect, it } from "vitest";

import { emailSchema, normalizeEmail, passwordSchema } from "./auth";

describe("authentication domain", () => {
  it("normalizes email addresses consistently", () => {
    expect(normalizeEmail("  Person@Example.COM ")).toBe("person@example.com");
    expect(emailSchema.parse("  Person@Example.COM ")).toBe("person@example.com");
  });

  it("enforces password bounds without composition rules", () => {
    expect(passwordSchema.safeParse("a".repeat(11)).success).toBe(false);
    expect(passwordSchema.safeParse("a password with spaces is allowed").success).toBe(true);
    expect(passwordSchema.safeParse("a".repeat(129)).success).toBe(false);
  });
});
