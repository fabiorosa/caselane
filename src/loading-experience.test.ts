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

const pendingControls = [
  "src/components/auth-form.tsx",
  "src/components/case-intake-form.tsx",
  "src/components/case-workroom-controls.tsx",
  "src/components/client-form.tsx",
  "src/components/client-workspace-controls.tsx",
  "src/components/demo-access.tsx",
  "src/components/invitation-form.tsx",
  "src/components/portal-reply-form.tsx",
  "src/components/portal-request-form.tsx",
  "src/components/settings-controls.tsx",
  "src/components/team-controls.tsx",
];

const resolvedRoutes = [
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

describe("purposeful motion", () => {
  it("keeps the viewport width and loading content offset stable", async () => {
    const css = await readFile(projectFile("src", "app", "globals.css"), "utf8");

    expect(css).toContain("@media (min-width: 761px) { html { overflow-y: scroll; scrollbar-gutter: stable; } }");
    expect(css).toContain(".route-loading { height: 100vh; min-height: 100vh; overflow: clip; }");
    expect(css).not.toContain(".skeleton-content { padding-top:");
  });

  it("uses one shared route-reveal boundary for workspace and portal content", async () => {
    const [workspaceTemplate, portalTemplate, css] = await Promise.all([
      readFile(projectFile("src", "app", "(workspace)", "[organizationSlug]", "template.tsx"), "utf8"),
      readFile(projectFile("src", "app", "portal", "[organizationSlug]", "template.tsx"), "utf8"),
      readFile(projectFile("src", "app", "globals.css"), "utf8"),
    ]);

    for (const source of [workspaceTemplate, portalTemplate]) expect(source).toContain('className="route-content-boundary"');
    expect(css).toContain(".route-content-boundary > main:not(.route-loading) { animation: route-content-reveal 280ms cubic-bezier(0.2, 0.7, 0.2, 1) both; }");
    expect(css).not.toContain(".route-content-boundary { animation:");
    expect(css).toMatch(/@keyframes route-content-reveal \{ from \{ opacity: \.68; filter: blur\(2px\); \} to \{ opacity: 1; filter: blur\(0\); \} \}/);
    expect(css).not.toMatch(/@keyframes route-content-reveal[^}]+translate/);
  });

  it("targets only resolved route main elements, never route-loading fallbacks", async () => {
    const sources = await Promise.all(resolvedRoutes.map((route) => readFile(projectFile("src", "app", ...route, "page.tsx"), "utf8")));

    expect(sources).toHaveLength(14);
    for (const source of sources) expect(source).toContain("return <main");
  });

  it("uses the shared pending contract for every form-status control", async () => {
    const [indicator, css, ...sources] = await Promise.all([
      readFile(projectFile("src", "components", "pending-indicator.tsx"), "utf8"),
      readFile(projectFile("src", "app", "globals.css"), "utf8"),
      ...pendingControls.map((path) => readFile(projectFile(...path.split("/")), "utf8")),
    ]);

    expect(indicator).toContain("function PendingIndicator");
    expect(indicator).toContain('aria-hidden="true"');
    expect(css).toContain("stroke: currentColor");
    for (const source of sources) {
      expect(source).toContain("useFormStatus");
      expect(source).toContain("PendingActionContent");
      expect(source).toContain("disabled={pending}");
      expect(source).toContain("aria-busy=");
    }
  });

  it("keeps pending motion and route entrance accessible under reduced motion", async () => {
    const css = await readFile(projectFile("src", "app", "globals.css"), "utf8");

    expect(css).toContain("@keyframes pending-indicator-spin");
    expect(css).toContain(".pending-indicator[data-pending=\"true\"] svg { animation: none !important; }");
    expect(css).toContain(".route-content-boundary > main:not(.route-loading) { animation: none !important; opacity: 1; filter: none; transform: none; }");
    expect(css).toContain(".pending-indicator[data-pending=\"true\"] { opacity: 1; }");
  });
});
