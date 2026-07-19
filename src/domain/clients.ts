import { z } from "zod";

const optionalTrimmedText = (maximum: number) => z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().max(maximum).optional(),
);

export const clientInputSchema = z.object({
  name: z.string().trim().min(2, "Enter a client name with at least 2 characters.").max(160, "Use 160 characters or fewer."),
  externalReference: optionalTrimmedText(100),
  notes: optionalTrimmedText(10_000),
});

export const clientListQuerySchema = z.object({
  search: optionalTrimmedText(160),
  archived: z.boolean().default(false),
  cursor: optionalTrimmedText(1_000),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const contactEmailSchema = z.string().trim().email().max(320).transform((email) => email.toLowerCase());

export const clientContactInputSchema = z.object({
  name: z.string().trim().min(2, "Enter a contact name with at least 2 characters.").max(120, "Use 120 characters or fewer."),
  email: contactEmailSchema,
  jobTitle: optionalTrimmedText(120),
  isPrimary: z.boolean().default(false),
});

export const clientFormInputSchema = clientInputSchema.extend({
  contactName: optionalTrimmedText(120),
  contactEmail: z.preprocess((value) => typeof value === "string" && value.trim() === "" ? undefined : value, contactEmailSchema.optional()),
  contactJobTitle: optionalTrimmedText(120),
}).superRefine((input, context) => {
  if (input.contactEmail && !input.contactName) context.addIssue({ code: "custom", path: ["contactName"], message: "Enter the primary contact's name." });
  if (input.contactName && !input.contactEmail) context.addIssue({ code: "custom", path: ["contactEmail"], message: "Enter the primary contact's email." });
});

const clientCursorSchema = z.object({
  name: z.string().min(1).max(160),
  id: z.string().uuid(),
});

export type ClientInput = z.infer<typeof clientInputSchema>;
export type ClientListQuery = z.infer<typeof clientListQuerySchema>;
export type ClientContactInput = z.infer<typeof clientContactInputSchema>;
export type ClientFormInput = z.infer<typeof clientFormInputSchema>;
export type ClientCursor = z.infer<typeof clientCursorSchema>;

export function encodeClientCursor(cursor: ClientCursor): string {
  return Buffer.from(JSON.stringify(clientCursorSchema.parse(cursor)), "utf8").toString("base64url");
}

export function decodeClientCursor(value: string): ClientCursor | null {
  try {
    return clientCursorSchema.parse(JSON.parse(Buffer.from(value, "base64url").toString("utf8")));
  } catch {
    return null;
  }
}
