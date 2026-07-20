import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("navigable collection rows", () => {
  it("uses one full-row link for every action-free detail collection", () => {
    const cases = source("src/app/(workspace)/[organizationSlug]/cases/page.tsx");
    const clients = source("src/app/(workspace)/[organizationSlug]/clients/page.tsx");
    const overview = source("src/app/(workspace)/[organizationSlug]/overview/page.tsx");
    const clientDetail = source("src/app/(workspace)/[organizationSlug]/clients/[clientId]/page.tsx");
    const portal = source("src/app/portal/[organizationSlug]/requests/page.tsx");

    expect(cases).toContain('className="case-queue-row navigable-row"');
    expect(cases).toContain('className="case-board-card navigable-row"');
    expect(clients).toContain('className="client-row navigable-row"');
    expect(overview).toContain('className="activity-row navigable-row"');
    expect(clientDetail).toContain('className="client-case-row navigable-row"');
    expect(portal).toContain('className="portal-request-row navigable-row"');
  });

  it("keeps native keyboard focus and restrained interaction feedback", () => {
    const css = source("src/app/globals.css");

    expect(css).toMatch(/\.navigable-row:focus-visible\s*{/);
    expect(css).toMatch(/\.navigable-row:hover\s*{/);
    expect(css).not.toMatch(/\.navigable-row[^}]*transition:[^;}]*(width|height|top|left)/);
  });

  it("selects the tenant-scoped case id needed by overview links", () => {
    const repository = source("src/db/repositories/overview.ts");

    expect(repository).toContain("caseId: cases.id");
    expect(repository).toContain("eq(cases.organizationId, organizationId)");
  });
});
