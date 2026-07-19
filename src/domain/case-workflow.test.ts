import { describe, expect, it } from "vitest";
import { assertCaseTransition, canTransitionCase } from "./case-workflow";

describe("case workflow", () => {
  it("enforces the complete transition matrix", () => {
    const allowed = new Set(["NEW:TRIAGED", "NEW:CLOSED", "TRIAGED:NEW", "TRIAGED:IN_PROGRESS", "TRIAGED:CLOSED", "IN_PROGRESS:TRIAGED", "IN_PROGRESS:WAITING_ON_CLIENT", "IN_PROGRESS:RESOLVED", "WAITING_ON_CLIENT:IN_PROGRESS", "WAITING_ON_CLIENT:RESOLVED", "RESOLVED:IN_PROGRESS", "RESOLVED:CLOSED", "CLOSED:IN_PROGRESS"]);
    const statuses = ["NEW", "TRIAGED", "IN_PROGRESS", "WAITING_ON_CLIENT", "RESOLVED", "CLOSED"] as const;
    for (const from of statuses) for (const to of statuses) expect(canTransitionCase(from, to), `${from} → ${to}`).toBe(allowed.has(`${from}:${to}`));
  });
  it("supports the primary case lifecycle", () => {
    expect(canTransitionCase("NEW", "TRIAGED")).toBe(true);
    expect(canTransitionCase("TRIAGED", "IN_PROGRESS")).toBe(true);
    expect(canTransitionCase("IN_PROGRESS", "WAITING_ON_CLIENT")).toBe(true);
    expect(canTransitionCase("WAITING_ON_CLIENT", "RESOLVED")).toBe(true);
    expect(canTransitionCase("RESOLVED", "CLOSED")).toBe(true);
  });

  it("blocks invalid jumps that would corrupt operational meaning", () => {
    expect(canTransitionCase("NEW", "RESOLVED")).toBe(false);
    expect(() => assertCaseTransition("WAITING_ON_CLIENT", "CLOSED")).toThrow(
      "Case cannot transition from WAITING_ON_CLIENT to CLOSED.",
    );
  });

  it("allows reopening a resolved or closed case into active work", () => {
    expect(canTransitionCase("RESOLVED", "IN_PROGRESS")).toBe(true);
    expect(canTransitionCase("CLOSED", "IN_PROGRESS")).toBe(true);
  });
});
