import { z } from "zod";
import { casePriority, caseStatus } from "@/db/schema";

const optional = (max: number) => z.preprocess((value) => typeof value === "string" && value.trim() === "" ? undefined : value, z.string().trim().max(max).optional());
export const caseQueueQuerySchema = z.object({
  search: optional(180), status: z.preprocess((value) => value === "" ? undefined : value, z.enum(caseStatus.enumValues).optional()),
  priority: z.preprocess((value) => value === "" ? undefined : value, z.enum(casePriority.enumValues).optional()),
  assigneeId: optional(36), clientId: optional(36), overdue: z.boolean().default(false), view: z.enum(["list", "board"]).default("list"), cursor: optional(1000), limit: z.coerce.number().int().min(1).max(100).default(25),
});
export type CaseQueueQuery = z.infer<typeof caseQueueQuerySchema>;
export type CaseQueueSearchParams = Record<string, string | string[] | undefined>;

export function parseCaseQueueSearchParams(params: CaseQueueSearchParams): CaseQueueQuery {
  const one = (key: string) => Array.isArray(params[key]) ? params[key]?.[0] : params[key];
  const result = caseQueueQuerySchema.safeParse({ search: one("search"), status: one("status"), priority: one("priority"), assigneeId: one("assigneeId"), clientId: one("clientId"), overdue: one("overdue") === "true", view: one("view") ?? "list", cursor: one("cursor"), limit: one("limit") ?? 25 });
  return result.success ? result.data : caseQueueQuerySchema.parse({});
}

const cursorSchema = z.object({ activity: z.string().datetime(), id: z.string().uuid() });
export function encodeCaseCursor(value: { activity: Date; id: string }) { return Buffer.from(JSON.stringify({ activity: value.activity.toISOString(), id: value.id })).toString("base64url"); }
export function decodeCaseCursor(value: string) { try { const parsed = cursorSchema.parse(JSON.parse(Buffer.from(value, "base64url").toString())); return { activity: new Date(parsed.activity), id: parsed.id }; } catch { return null; } }
