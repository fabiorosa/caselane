import { z } from "zod";
import { casePriority, caseStatus, messageVisibility } from "@/db/schema";

const optionalUuid = z.preprocess((value) => value === "" ? undefined : value, z.string().uuid().optional());
export const caseDetailsSchema = z.object({
  categoryId: optionalUuid, assigneeId: optionalUuid,
  priority: z.enum(casePriority.enumValues),
  dueAt: z.preprocess((value) => value === "" ? undefined : value, z.coerce.date().optional()),
});
export const caseStatusChangeSchema = z.object({ toStatus: z.enum(caseStatus.enumValues) });
export const caseMessageSchema = z.object({ body: z.string().trim().min(1, "Write a message before sending.").max(10_000), visibility: z.enum(messageVisibility.enumValues) });
export type CaseDetailsInput = z.infer<typeof caseDetailsSchema>;
export type CaseMessageInput = z.infer<typeof caseMessageSchema>;
