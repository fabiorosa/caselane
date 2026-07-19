import { z } from "zod";

export const caseStatusSchema = z.enum([
  "NEW",
  "TRIAGED",
  "IN_PROGRESS",
  "WAITING_ON_CLIENT",
  "RESOLVED",
  "CLOSED",
]);

export type CaseStatus = z.infer<typeof caseStatusSchema>;

const transitions: Record<CaseStatus, readonly CaseStatus[]> = {
  NEW: ["TRIAGED", "CLOSED"],
  TRIAGED: ["NEW", "IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["TRIAGED", "WAITING_ON_CLIENT", "RESOLVED"],
  WAITING_ON_CLIENT: ["IN_PROGRESS", "RESOLVED"],
  RESOLVED: ["IN_PROGRESS", "CLOSED"],
  CLOSED: ["IN_PROGRESS"],
};

export function canTransitionCase(from: CaseStatus, to: CaseStatus): boolean {
  return transitions[from].includes(to);
}

export function assertCaseTransition(from: CaseStatus, to: CaseStatus): void {
  if (!canTransitionCase(from, to)) {
    throw new Error(`Case cannot transition from ${from} to ${to}.`);
  }
}
