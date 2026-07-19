import { z } from "zod";
import { casePriority } from "@/db/schema";

const optionalUuid = z.preprocess((value) => value === "" ? undefined : value, z.string().uuid().optional());

export const caseIntakeSchema = z.object({
  clientId: z.string().uuid("Choose a client."),
  requesterContactId: optionalUuid,
  categoryId: optionalUuid,
  assigneeId: optionalUuid,
  title: z.string().trim().min(4, "Enter a title with at least 4 characters.").max(180),
  description: z.string().trim().min(10, "Describe the request in at least 10 characters.").max(20_000),
  priority: z.enum(casePriority.enumValues).default("NORMAL"),
  dueAt: z.preprocess((value) => value === "" ? undefined : value, z.coerce.date().optional()),
});

export type CaseIntakeInput = z.infer<typeof caseIntakeSchema>;
