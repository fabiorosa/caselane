import "server-only";

import type { ActionResult } from "@/domain/action-result";
import { createOrganizationSlug, registerOwnerInputSchema, type RegisterOwnerInput } from "@/domain/registration";
import type { Clock } from "@/infrastructure/clock";
import { argon2PasswordService, type PasswordService } from "@/infrastructure/password";
import { generateOpaqueToken, hashOpaqueToken } from "@/infrastructure/tokens";
import { getSessionExpiry } from "./session-service";

const defaultCategories = ["General", "Technical support", "Account"];

export interface OwnerRegistrationTransaction {
  findUserByEmail(email: string): Promise<{ id: string } | null>;
  createUser(input: { name: string; email: string; passwordHash: string }): Promise<{ id: string; name: string; email: string }>;
  createOrganization(input: { name: string; slug: string }): Promise<{ id: string; slug: string }>;
  createOwnerMembership(input: { organizationId: string; userId: string }): Promise<void>;
  createDefaultCategories(organizationId: string, categories: string[]): Promise<void>;
  createSession(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<{ id: string }>;
}

export interface OwnerRegistrationStore {
  transaction<T>(callback: (transaction: OwnerRegistrationTransaction) => Promise<T>): Promise<T>;
}

export interface RegistrationSuccess {
  user: { id: string; name: string; email: string };
  organizationSlug: string;
  rawSessionToken: string;
}

export async function registerOwner(
  store: OwnerRegistrationStore,
  clock: Clock,
  input: RegisterOwnerInput,
  passwordService: PasswordService = argon2PasswordService,
): Promise<ActionResult<RegistrationSuccess>> {
  const parsed = registerOwnerInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION",
        message: "Review the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  return store.transaction(async (transaction) => {
    const existingUser = await transaction.findUserByEmail(parsed.data.email);
    if (existingUser) {
      return {
        ok: false,
        error: {
          code: "CONFLICT",
          message: "An account with this email already exists. Sign in to continue.",
        },
      };
    }

    const passwordHash = await passwordService.hash(parsed.data.password);
    const user = await transaction.createUser({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    });
    const organization = await createOrganizationWithAvailableSlug(transaction, parsed.data.workspaceName);
    await transaction.createOwnerMembership({ organizationId: organization.id, userId: user.id });
    await transaction.createDefaultCategories(organization.id, defaultCategories);

    const rawSessionToken = generateOpaqueToken();
    await transaction.createSession({
      userId: user.id,
      tokenHash: hashOpaqueToken(rawSessionToken),
      expiresAt: getSessionExpiry(clock),
    });

    return {
      ok: true,
      data: { user, organizationSlug: organization.slug, rawSessionToken },
    };
  });
}

async function createOrganizationWithAvailableSlug(
  transaction: OwnerRegistrationTransaction,
  workspaceName: string,
): Promise<{ id: string; slug: string }> {
  const baseSlug = createOrganizationSlug(workspaceName);

  for (let suffix = 1; suffix <= 100; suffix += 1) {
    const slug = suffix === 1 ? baseSlug : `${baseSlug.slice(0, 80 - String(suffix).length - 1)}-${suffix}`;

    try {
      return await transaction.createOrganization({ name: workspaceName, slug });
    } catch (error) {
      if (isUniqueViolation(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Could not allocate a workspace slug.");
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
