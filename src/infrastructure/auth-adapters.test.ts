import { describe, expect, it } from "vitest";

import { argon2PasswordService } from "./password";
import { generateOpaqueToken, hashOpaqueToken } from "./tokens";

describe("password service", () => {
  it("hashes and verifies passwords with Argon2id", async () => {
    const password = "a password managed by a password manager";
    const hash = await argon2PasswordService.hash(password);

    expect(hash.startsWith("$argon2id$")).toBe(true);
    await expect(argon2PasswordService.verify(hash, password)).resolves.toBe(true);
    await expect(argon2PasswordService.verify(hash, "incorrect password")).resolves.toBe(false);
  });
});

describe("opaque tokens", () => {
  it("creates 256-bit tokens and deterministic SHA-256 hashes", () => {
    const rawToken = generateOpaqueToken();
    const tokenHash = hashOpaqueToken(rawToken);

    expect(rawToken).not.toBe(tokenHash);
    expect(hashOpaqueToken(rawToken)).toBe(tokenHash);
    expect(rawToken).toHaveLength(43);
    expect(tokenHash).toHaveLength(64);
  });

  it("exposes the raw token only as an explicit local value", () => {
    const rawToken = generateOpaqueToken();
    const persistencePayload = { tokenHash: hashOpaqueToken(rawToken) };

    expect(Object.values(persistencePayload)).not.toContain(rawToken);
    expect(Object.keys(persistencePayload)).toEqual(["tokenHash"]);
  });
});
