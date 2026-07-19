import "server-only";

import type { SessionRepository } from "@/db/repositories/sessions";
import type { Clock } from "@/infrastructure/clock";
import { hashOpaqueToken } from "@/infrastructure/tokens";

const sessionLifetimeMs = 1000 * 60 * 60 * 24 * 30;
const sessionTouchIntervalMs = 1000 * 60 * 60;

export interface CurrentUserContext {
  sessionId: string;
  userId: string;
  email: string;
  name: string;
}

export function getSessionExpiry(clock: Clock): Date {
  return new Date(clock.now().getTime() + sessionLifetimeMs);
}

export async function createSession(
  repository: Pick<SessionRepository, "create">,
  clock: Clock,
  input: { userId: string; rawToken: string },
): Promise<{ id: string; expiresAt: Date }> {
  const expiresAt = getSessionExpiry(clock);
  const session = await repository.create({
    userId: input.userId,
    tokenHash: hashOpaqueToken(input.rawToken),
    expiresAt,
  });

  return { ...session, expiresAt };
}

export async function rotateSession(
  repository: SessionRepository,
  clock: Clock,
  input: { userId: string; currentRawToken: string; nextRawToken: string },
): Promise<{ id: string; expiresAt: Date }> {
  const nextSession = await createSession(repository, clock, {
    userId: input.userId,
    rawToken: input.nextRawToken,
  });
  await repository.revokeByTokenHash(hashOpaqueToken(input.currentRawToken));

  return nextSession;
}

export async function getCurrentUserContext(
  repository: SessionRepository,
  clock: Clock,
  rawToken: string | null,
): Promise<CurrentUserContext | null> {
  if (!rawToken) {
    return null;
  }

  const session = await repository.findByTokenHash(hashOpaqueToken(rawToken));
  const now = clock.now();

  if (!session || session.disabledAt || session.expiresAt <= now) {
    return null;
  }

  if (now.getTime() - session.lastSeenAt.getTime() >= sessionTouchIntervalMs) {
    await repository.touch(session.id, now);
  }

  return {
    sessionId: session.id,
    userId: session.userId,
    email: session.email,
    name: session.name,
  };
}

export async function signOutCurrentSession(repository: SessionRepository, rawToken: string | null): Promise<void> {
  if (rawToken) {
    await repository.revokeByTokenHash(hashOpaqueToken(rawToken));
  }
}
