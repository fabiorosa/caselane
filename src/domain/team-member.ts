import { z } from "zod";

export const teamMemberProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter the member's name.").max(120),
  title: z.preprocess((value) => value === "" ? undefined : value, z.string().trim().max(100).optional()),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export type TeamMemberProfileInput = z.infer<typeof teamMemberProfileSchema>;
