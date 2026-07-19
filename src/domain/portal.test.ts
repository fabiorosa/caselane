import { describe, expect, it } from "vitest";
import { clientStatus, nextAction, portalReplySchema, portalRequestSchema } from "./portal";

describe("client portal domain", () => {
  it("accepts only the fields a client may control", () => {
    expect(portalRequestSchema.parse({ title: "  Access request  ", description: " Please add access for our reviewer. ", clientId: "spoof", priority: "URGENT" })).toEqual({ title: "Access request", description: "Please add access for our reviewer." });
  });

  it("explains the next action in client language", () => {
    expect(nextAction("WAITING_ON_CLIENT")).toBe("Your response is needed");
    expect(nextAction("IN_PROGRESS")).toBe("The team is working on it");
    expect(clientStatus("NEW").label).toBe("Received");
    expect(portalReplySchema.safeParse({ body: " " }).success).toBe(false);
  });
});
