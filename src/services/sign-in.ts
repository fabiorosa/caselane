import "server-only";

import type { AuthAccountRepository } from "@/db/repositories/auth";
import type { SessionRepository } from "@/db/repositories/sessions";
import type { ActionResult } from "@/domain/action-result";
import { signInInputSchema } from "@/domain/auth";
import type { Clock } from "@/infrastructure/clock";
import { argon2PasswordService, type PasswordService } from "@/infrastructure/password";
import { generateOpaqueToken } from "@/infrastructure/tokens";
import { createSession } from "./session-service";

export async function signIn(
  accounts: AuthAccountRepository,
  sessions: Pick<SessionRepository, "create">,
  clock: Clock,
  input: { email: string; password: string },
  passwordService: PasswordService = argon2PasswordService,
): Promise<ActionResult<{ user: { id: string; name: string; email: string }; rawSessionToken: string }>> {
  const parsed = signInInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION", message: "Review the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors },
    };
  }

  const account = await accounts.findByEmail(parsed.data.email);
  if (!account || account.disabledAt || !(await passwordService.verify(account.passwordHash, parsed.data.password))) {
    return { ok: false, error: { code: "CONFLICT", message: "Email or password is incorrect." } };
  }

  const rawSessionToken = generateOpaqueToken();
  await createSession(sessions, clock, { userId: account.id, rawToken: rawSessionToken });

  return { ok: true, data: { user: { id: account.id, name: account.name, email: account.email }, rawSessionToken } };
}
