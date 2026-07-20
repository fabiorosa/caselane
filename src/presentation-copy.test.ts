import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectFile = (...segments: string[]) => resolve(process.cwd(), ...segments);

describe("public presentation copy", () => {
  it("keeps browser metadata free of em dashes", async () => {
    const layout = await readFile(projectFile("src", "app", "layout.tsx"), "utf8");

    expect(layout).toContain('title: "CaseLane | Client request operations"');
    expect(layout).not.toContain("—");
  });

  it("uses specific descriptions for the seeded demo cases", async () => {
    const seed = await readFile(projectFile("scripts", "demo-reset.mjs"), "utf8");

    expect(seed).not.toContain("Fictional demo request for");
    expect(seed).toContain("The client needs a purchase order field before the next invoice cycle.");
  });
});
