import { createHmac } from "node:crypto";

export interface RateLimitRepository {
  consume(input: { action: string; keyHash: string; limit: number; windowMs: number; now: Date }): Promise<{ allowed: boolean; retryAfterSeconds: number }>;
}

export function createRateLimitKey(secret: string, parts: string[]): string {
  return createHmac("sha256", secret).update(parts.map((part) => part.trim().toLowerCase()).join("|")).digest("hex");
}

export async function enforceRateLimit(repository: RateLimitRepository, input: { action: string; identifier: string; limit: number; windowMs: number; now: Date; secret: string }) {
  return repository.consume({
    action: input.action,
    keyHash: createRateLimitKey(input.secret, [input.identifier]),
    limit: input.limit,
    windowMs: input.windowMs,
    now: input.now,
  });
}
