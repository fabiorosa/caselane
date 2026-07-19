import "server-only";

import { createHash, randomBytes } from "node:crypto";

const tokenBytes = 32;

export function generateOpaqueToken(): string {
  return randomBytes(tokenBytes).toString("base64url");
}

export function hashOpaqueToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
