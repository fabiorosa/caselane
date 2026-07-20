import { expect, test, type Page } from "@playwright/test";

async function enterDemo(page: Page, persona: "Owner" | "Team member" | "Client") {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: `Explore as ${persona}` }).click();
  await expect(page).toHaveURL(persona === "Client" ? /\/portal\/orbit-labs\/requests$/ : /\/orbit-labs\/overview$/);
}

test("owner moves from an operational signal into the filtered queue", async ({ page }) => {
  await enterDemo(page, "Owner");
  await expect(page).toHaveURL(/\/orbit-labs\/overview$/);
  await expect(page.getByRole("heading", { name: "Orbit Labs" })).toBeVisible();

  await page.locator('a[href="/orbit-labs/cases?overdue=true"]').click();
  await expect(page).toHaveURL(/\/orbit-labs\/cases\?overdue=true$/);
  await expect(page.getByRole("heading", { name: "Cases" })).toBeVisible();
  const firstCaseRow = page.locator(".case-queue-row").first();
  await expect(firstCaseRow).toBeVisible();
  await firstCaseRow.click({ position: { x: 900, y: 38 } });
  await expect(page).toHaveURL(/\/orbit-labs\/cases\/[0-9a-f-]+$/);

  await page.goto("/orbit-labs/settings");
  await expect(page.getByLabel("Workspace name")).toBeEnabled();
  await expect(page.getByRole("button", { name: "Save workspace" })).toBeVisible();
});

test("team member can inspect settings but cannot mutate them", async ({ page }) => {
  await enterDemo(page, "Team member");
  await expect(page).toHaveURL(/\/orbit-labs\/overview$/);
  await page.goto("/orbit-labs/settings");

  await expect(page.getByLabel("Workspace name")).toBeDisabled();
  await expect(page.getByText("Only the workspace owner can change this name.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save workspace" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add category" })).toHaveCount(0);
});

test("client submits a request that appears in the internal queue", async ({ browser }) => {
  const clientContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const clientPage = await clientContext.newPage();
  await enterDemo(clientPage, "Client");
  await expect(clientPage).toHaveURL(/\/portal\/orbit-labs\/requests$/);

  await clientPage.getByRole("link", { name: "New request" }).click();
  const uniqueTitle = `Mobile access review ${Date.now()}`;
  await clientPage.getByLabel("What do you need help with?").fill(uniqueTitle);
  await clientPage.getByLabel("Request details").fill("Please verify the mobile access policy before the next onboarding session.");
  await clientPage.getByRole("button", { name: "Send request" }).click();
  await expect(clientPage.getByRole("status")).toContainText("was sent to the team");
  await expect(clientPage.locator("html")).toHaveJSProperty("scrollWidth", 390);

  const ownerContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  await enterDemo(ownerPage, "Owner");
  await ownerPage.goto(`/orbit-labs/cases?search=${encodeURIComponent(uniqueTitle)}`);
  await ownerPage.getByRole("link", { name: uniqueTitle }).click();
  const internalNote = `Private triage note ${Date.now()}`;
  await ownerPage.getByLabel("Internal note").fill(internalNote);
  await ownerPage.getByRole("button", { name: "Add internal note" }).click();
  await expect(ownerPage.getByRole("status")).toContainText("Internal note added");

  await clientPage.getByRole("link", { name: uniqueTitle }).click();
  await expect(clientPage.getByText(internalNote)).toHaveCount(0);
  const clientReply = `Client follow-up ${Date.now()}`;
  await clientPage.getByLabel("Reply to the team").fill(clientReply);
  await clientPage.getByRole("button", { name: "Send reply" }).click();
  await expect(clientPage.getByRole("status")).toContainText("Reply sent to the team");
  await ownerPage.reload();
  await expect(ownerPage.getByText(clientReply)).toBeVisible();

  await ownerContext.close();
  await clientContext.close();
});

test("critical navigation remains keyboard reachable", async ({ page }) => {
  await enterDemo(page, "Owner");
  await page.goto("/orbit-labs/settings");
  await expect(page.getByRole("heading", { name: "Shape the operation" })).toBeVisible();
  await page.locator("body").focus();
  let focusedHref: string | null = null;
  for (let attempt = 0; attempt < 10 && focusedHref !== "/orbit-labs/overview"; attempt += 1) {
    await page.keyboard.press("Tab");
    focusedHref = await page.evaluate(() => document.activeElement?.getAttribute("href") ?? null);
  }
  expect(focusedHref).toBe("/orbit-labs/overview");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/orbit-labs\/overview$/);
});
