import { describe, expect, it } from "vitest";
import { caseDetailsSchema, caseMessageSchema } from "./case-workroom";

describe("case workroom input", () => {
  it("keeps internal and client-visible messages explicit", () => {
    expect(caseMessageSchema.parse({ body: "  Private account context  ", visibility: "INTERNAL" })).toEqual({ body: "Private account context", visibility: "INTERNAL" });
    expect(caseMessageSchema.parse({ body: "Update sent to the requester", visibility: "CLIENT" }).visibility).toBe("CLIENT");
    expect(caseMessageSchema.safeParse({ body: "", visibility: "INTERNAL" }).success).toBe(false);
  });

  it("normalizes empty optional case details", () => {
    expect(caseDetailsSchema.parse({ categoryId: "", assigneeId: "", priority: "HIGH", dueAt: "" })).toEqual({ priority: "HIGH" });
  });
});
