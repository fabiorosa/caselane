import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("select consistency", () => {
  it("uses the premium listbox for every audited product select", () => {
    const clients = source("src/app/(workspace)/[organizationSlug]/clients/page.tsx");
    const cases = source("src/app/(workspace)/[organizationSlug]/cases/page.tsx");
    const team = source("src/components/team-controls.tsx");

    for (const file of [clients, cases, team]) expect(file).not.toContain("<select");
    expect(clients).toContain("ClientDirectoryFilters");
    expect(cases).toContain("CaseQueueFilters");
    expect(team).toContain("<PremiumSelect");
  });

  it("submits selected values and supports keyboard selection", () => {
    const select = source("src/components/premium-select.tsx");

    expect(select).toContain('<input aria-invalid={invalid} name={name} type="hidden" value={value} />');
    expect(select).toContain('event.key === "Enter" || event.key === " "');
    expect(select).toContain("choose(option.value)");
  });

  it("keeps filter action styles out of nested listbox buttons", () => {
    const css = source("src/app/globals.css");

    expect(css).not.toMatch(/\.client-filters button(?:,|\s*\{)/);
    expect(css).not.toMatch(/\.case-queue-filters button(?:,|\s*\{)/);
    expect(css).toMatch(/\.client-filters > button/);
    expect(css).toMatch(/\.case-queue-filters > button/);
  });
});
