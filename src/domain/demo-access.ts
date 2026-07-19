import { z } from "zod";
export const demoPersonaSchema = z.enum(["OWNER", "MEMBER", "CLIENT"]);
export type DemoPersona = z.infer<typeof demoPersonaSchema>;
