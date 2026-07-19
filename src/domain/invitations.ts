import { z } from "zod";

import { emailSchema } from "./auth";

export const inviteMemberInputSchema = z.object({
  email: emailSchema,
  role: z.enum(["ADMIN", "MEMBER"]),
});

export type InvitableRole = z.infer<typeof inviteMemberInputSchema>["role"];
export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "CLIENT";

export function canInviteMembers(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}
