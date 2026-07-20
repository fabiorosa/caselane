import { describe, expect, it } from "vitest";
import { overviewMetricHref } from "./overview-metric-links";

describe("overviewMetricHref", () => {
  it("opens the matching queue filter for every operational metric", () => {
    expect(overviewMetricHref("orbit-labs", "open")).toBe("/orbit-labs/cases");
    expect(overviewMetricHref("orbit-labs", "overdue")).toBe("/orbit-labs/cases?overdue=true");
    expect(overviewMetricHref("orbit-labs", "unassigned")).toBe("/orbit-labs/cases?assigneeId=unassigned");
    expect(overviewMetricHref("orbit-labs", "waitingOnClient")).toBe("/orbit-labs/cases?status=WAITING_ON_CLIENT");
  });
});
