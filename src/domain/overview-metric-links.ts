export type OverviewMetric = "open" | "overdue" | "unassigned" | "waitingOnClient";

export function overviewMetricHref(organizationSlug: string, metric: OverviewMetric): string {
  const queue = `/${encodeURIComponent(organizationSlug)}/cases`;

  switch (metric) {
    case "overdue":
      return `${queue}?overdue=true`;
    case "unassigned":
      return `${queue}?assigneeId=unassigned`;
    case "waitingOnClient":
      return `${queue}?status=WAITING_ON_CLIENT`;
    default:
      return queue;
  }
}
