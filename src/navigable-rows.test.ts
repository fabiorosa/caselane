import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

const luminance = (hex: string) => {
  const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

describe("navigable collection rows", () => {
  it("uses one full-row link for every action-free detail collection", () => {
    const cases = source("src/app/(workspace)/[organizationSlug]/cases/page.tsx");
    const clients = source("src/app/(workspace)/[organizationSlug]/clients/page.tsx");
    const overview = source("src/app/(workspace)/[organizationSlug]/overview/page.tsx");
    const clientDetail = source("src/app/(workspace)/[organizationSlug]/clients/[clientId]/page.tsx");
    const portal = source("src/app/portal/[organizationSlug]/requests/page.tsx");
    const team = source("src/app/(workspace)/[organizationSlug]/team/page.tsx");

    expect(cases).toContain('className="case-queue-row navigable-row"');
    expect(cases).toContain('className="case-board-card navigable-row"');
    expect(clients).toContain('className="client-row navigable-row"');
    expect(overview).toContain('className="activity-row navigable-row"');
    expect(clientDetail).toContain('className="client-case-row navigable-row"');
    expect(portal).toContain('className="portal-request-row navigable-row"');
    expect(team).toContain('className={`team-row navigable-row ${member.active ? "" : "inactive"}`}');
    expect(team).not.toContain('<Link className="team-open-profile"');
    expect(team).not.toContain("<h3><Link");
    expect(team).toContain('className="team-row pending"');
  });

  it("keeps native keyboard focus and restrained interaction feedback", () => {
    const css = source("src/app/globals.css");

    expect(css).toMatch(/\.navigable-row:focus-visible\s*{/);
    expect(css).toMatch(/\.navigable-row:hover\s*{/);
    expect(css).toMatch(/\.navigable-row:active\s*{[^}]*transform:\s*scale\(\.992\)/);
    expect(css).not.toMatch(/\.navigable-row[^}]*transition:[^;}]*(width|height|top|left)/);
  });

  it("keeps status chips legible and motion preference aware", () => {
    const css = source("src/app/globals.css");

    expect(css).toMatch(/\.queue-status\s*{[^}]*padding:\s*5px 9px[^}]*color:\s*#fff/);
    for (const status of ["new", "triaged", "in-progress", "waiting-on-client", "resolved", "closed"]) {
      const background = css.match(new RegExp(`\\.status-${status} \\{[^}]*background: (#[0-9a-f]{6})`))?.[1];
      expect(background, `${status} needs a solid status-chip background`).toBeDefined();
      expect(1.05 / (luminance(background!) + 0.05), `${status} needs 4.5:1 white-text contrast`).toBeGreaterThanOrEqual(4.5);
    }
    expect(css).toMatch(/\.status-actions button:active:not\(:disabled\)[^{]*{[^}]*translateY\(1px\)/);
    expect(css).toMatch(/\.message-composer:focus-within\s*{/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*transition-duration:\s*\.01ms !important/);
  });

  it("keeps the primary lifecycle action legible on hover", () => {
    const css = source("src/app/globals.css");

    expect(css).toMatch(/\.status-actions button:last-of-type:hover:not\(:disabled\)\s*{[^}]*background:\s*var\(--accent-strong\)[^}]*color:\s*#15120c/);
  });

  it("selects the tenant-scoped case id needed by overview links", () => {
    const repository = source("src/db/repositories/overview.ts");

    expect(repository).toContain("caseId: cases.id");
    expect(repository).toContain("eq(cases.organizationId, organizationId)");
  });
});
