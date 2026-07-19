import { describe, expect, it } from "vitest";
import { decodeCaseCursor, encodeCaseCursor, parseCaseQueueSearchParams } from "./case-queue";

describe("case queue URL state", () => {
  it("parses supported filters and rejects malformed state safely", () => {
    expect(parseCaseQueueSearchParams({ search: " export ", status: "IN_PROGRESS", priority: "URGENT", overdue: "true", view: "board", limit: "30" })).toMatchObject({ search: "export", status: "IN_PROGRESS", priority: "URGENT", overdue: true, view: "board", limit: 30 });
    expect(parseCaseQueueSearchParams({ status: "INVALID", view: "grid", limit: "900" })).toMatchObject({ overdue: false, view: "list", limit: 25 });
  });

  it("round-trips stable activity and id cursors", () => {
    const value = { activity: new Date("2026-07-19T12:00:00.000Z"), id: "10000000-0000-4000-8000-000000000001" };
    expect(decodeCaseCursor(encodeCaseCursor(value))).toEqual(value);
    expect(decodeCaseCursor("broken")).toBeNull();
  });
});
