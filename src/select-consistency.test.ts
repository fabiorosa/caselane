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
});
