import { z } from "zod";

const optionalUuid = z.preprocess((value) => value === "" ? undefined : value, z.string().uuid().optional());

export const portalRequestSchema = z.object({
  title: z.string().trim().min(4, "Enter a title with at least 4 characters.").max(180),
  description: z.string().trim().min(10, "Describe the request in at least 10 characters.").max(20_000),
  categoryId: optionalUuid,
});

export type PortalRequestInput = z.infer<typeof portalRequestSchema>;

export const portalReplySchema = z.object({ body: z.string().trim().min(1, "Write a reply before sending.").max(10_000) });
export type PortalReplyInput = z.infer<typeof portalReplySchema>;

export const portalRequestQuerySchema = z.object({
  state: z.enum(["open", "closed"]).default("open"),
  search: z.string().trim().max(180).optional(),
});

export type PortalRequestQuery = z.infer<typeof portalRequestQuerySchema>;

export function nextAction(status: string): string {
  if (status === "WAITING_ON_CLIENT") return "Your response is needed";
  if (status === "RESOLVED") return "Review the resolution";
  if (status === "CLOSED") return "No action needed";
  return "The team is working on it";
}

export function clientStatus(status: string): { label: string; detail: string } {
  if (status === "WAITING_ON_CLIENT") return { label: "Waiting for you", detail: "The team needs more information before work can continue." };
  if (status === "RESOLVED") return { label: "Resolved", detail: "The team has completed this request. You can review the conversation below." };
  if (status === "CLOSED") return { label: "Closed", detail: "This request is complete and retained in your history." };
  if (status === "NEW") return { label: "Received", detail: "The team has your request and will review it next." };
  return { label: "In progress", detail: "The team is actively working on this request." };
}
