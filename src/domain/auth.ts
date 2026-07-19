import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128, "Use 128 characters or fewer.");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(320, "Enter an email address with 320 characters or fewer.");

export const signInInputSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type SignInInput = z.infer<typeof signInInputSchema>;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type AuthErrorCode = "INVALID_CREDENTIALS" | "ACCOUNT_DISABLED" | "SESSION_EXPIRED";

export class AuthenticationError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}
