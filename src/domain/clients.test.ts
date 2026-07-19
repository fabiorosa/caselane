import { describe, expect, it } from "vitest";

import { clientContactInputSchema, clientInputSchema, clientListQuerySchema, contactEmailSchema, decodeClientCursor, encodeClientCursor } from "./clients";

describe("client domain", () => {
  it("normalizes editable fields and contact emails", () => {
    expect(clientInputSchema.parse({ name: "  Northstar Studio  ", externalReference: "  AC-42 ", notes: "   " })).toEqual({
      name: "Northstar Studio",
      externalReference: "AC-42",
      notes: undefined,
    });
    expect(contactEmailSchema.parse("  Contact@Example.COM ")).toBe("contact@example.com");
    expect(clientContactInputSchema.parse({ name: "  Avery Stone ", email: " AVERY@EXAMPLE.COM ", jobTitle: " " })).toEqual({ name: "Avery Stone", email: "avery@example.com", jobTitle: undefined, isPrimary: false });
  });

  it("rejects invalid client fields and bounds list queries", () => {
    expect(clientInputSchema.safeParse({ name: "A", externalReference: "x".repeat(101) }).success).toBe(false);
    expect(contactEmailSchema.safeParse("not-an-email").success).toBe(false);
    expect(clientListQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(clientListQuerySchema.parse({})).toMatchObject({ archived: false, limit: 25 });
  });

  it("round-trips opaque cursors and safely rejects malformed values", () => {
    const cursor = { name: "Acme & Sons", id: "4fd242dc-f9ca-44ad-a3b1-01d63638132e" };
    expect(decodeClientCursor(encodeClientCursor(cursor))).toEqual(cursor);
    expect(decodeClientCursor("not-a-cursor")).toBeNull();
  });
});
