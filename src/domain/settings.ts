import { z } from "zod";

export const organizationSettingsSchema = z.object({ name: z.string().trim().min(2, "Enter at least 2 characters.").max(120) });
export const categorySettingsSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters.").max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a valid color."),
});
