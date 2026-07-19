import { z } from "zod";

import { emailSchema, passwordSchema } from "./auth";

export const registerOwnerInputSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(120),
  email: emailSchema,
  password: passwordSchema,
  workspaceName: z.string().trim().min(2, "Enter a workspace name.").max(120),
  acceptedTerms: z.literal(true, { error: "You must accept the terms to continue." }),
});

export interface RegisterOwnerInput {
  name: string;
  email: string;
  password: string;
  workspaceName: string;
  acceptedTerms: boolean;
}

export function createOrganizationSlug(name: string): string {
  const normalized = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return (normalized || "workspace").slice(0, 80).replace(/-+$/g, "") || "workspace";
}
