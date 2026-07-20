import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectFile = (...segments: string[]) => resolve(process.cwd(), ...segments);

const loadingRoutes = [
  ["(workspace)", "[organizationSlug]", "overview"],
  ["(workspace)", "[organizationSlug]", "clients"],
  ["(workspace)", "[organizationSlug]", "clients", "new"],
  ["(workspace)", "[organizationSlug]", "clients", "[clientId]"],
  ["(workspace)", "[organizationSlug]", "clients", "[clientId]", "edit"],
  ["(workspace)", "[organizationSlug]", "cases"],
  ["(workspace)", "[organizationSlug]", "cases", "new"],
  ["(workspace)", "[organizationSlug]", "cases", "[caseId]"],
  ["(workspace)", "[organizationSlug]", "team"],
  ["(workspace)", "[organizationSlug]", "team", "[userId]"],
  ["(workspace)", "[organizationSlug]", "settings"],
  ["portal", "[organizationSlug]", "requests"],
  ["portal", "[organizationSlug]", "requests", "new"],
  ["portal", "[organizationSlug]", "requests", "[caseId]"],
  ["workspace"],
  ["accept-invite", "[token]"],
];

describe("loading experience", () => {
  it("keeps every database-backed product route behind a structured fallback", async () => {
    const sources = await Promise.all(loadingRoutes.map((route) => readFile(projectFile("src", "app", ...route, "loading.tsx"), "utf8")));

    expect(sources).toHaveLength(16);
    for (const source of sources) expect(source).toMatch(/(Workspace|Portal|Auth)RouteLoading/);
  });

  it("exposes honest busy semantics and motion-safe skeletons", async () => {
    const [component, css] = await Promise.all([
      readFile(projectFile("src", "components", "loading-states.tsx"), "utf8"),
      readFile(projectFile("src", "app", "globals.css"), "utf8"),
    ]);

    expect(component).toContain('aria-busy="true"');
    expect(component).toContain('role="status"');
    expect(css).toContain("@keyframes skeleton-sweep");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(".skeleton-block::after { display: none; }");
  });

  it("covers the demo and destructive pending actions", async () => {
    const [demo, workroom, clients] = await Promise.all([
      readFile(projectFile("src", "components", "demo-access.tsx"), "utf8"),
      readFile(projectFile("src", "components", "case-workroom-controls.tsx"), "utf8"),
      readFile(projectFile("src", "components", "client-workspace-controls.tsx"), "utf8"),
    ]);

    expect(demo).toContain("Opening…");
    expect(workroom).toContain("Updating…");
    expect(clients).toContain("Archiving…");
    for (const source of [demo, workroom, clients]) expect(source).toContain("useFormStatus");
  });
});
