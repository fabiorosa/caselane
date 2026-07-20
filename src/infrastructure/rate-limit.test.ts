import { describe, expect, it, vi } from "vitest";
import { createRateLimitKey, enforceRateLimit } from "./rate-limit";

describe("rate limiting", () => {
  it("creates stable opaque keys without retaining the identifier", () => {
    const key = createRateLimitKey("a-secret-with-enough-entropy", [" User@Example.com "]);
    expect(key).toBe(createRateLimitKey("a-secret-with-enough-entropy", ["user@example.com"]));
    expect(key).toHaveLength(64);
    expect(key).not.toContain("example.com");
  });

  it("delegates window enforcement using only the hashed key", async () => {
    const consume = vi.fn().mockResolvedValue({ allowed: false, retryAfterSeconds: 60 });
    await expect(enforceRateLimit({ consume }, { action: "auth.sign-in", identifier: "private@example.com", limit: 10, windowMs: 900_000, now: new Date(0), secret: "secret" })).resolves.toEqual({ allowed: false, retryAfterSeconds: 60 });
    expect(consume).toHaveBeenCalledWith(expect.objectContaining({ action: "auth.sign-in", limit: 10, keyHash: expect.not.stringContaining("private") }));
  });
});
