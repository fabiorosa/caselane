import { expect, test, type Page } from "@playwright/test";

async function enterOwnerDemo(page: Page) {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Explore as Owner" }).click();
  await expect(page).toHaveURL(/\/orbit-labs\/overview$/);
  await expect(page.getByRole("heading", { name: "Orbit Labs" })).toBeVisible();
}

test("resolved routes and real pending actions expose restrained motion", async ({ page }) => {
  await enterOwnerDemo(page);

  const routeMotion = await page.locator(".route-content-boundary > main:not(.route-loading)").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      name: style.animationName,
      duration: style.animationDuration,
      timing: style.animationTimingFunction,
    };
  });
  expect(routeMotion).toEqual({
    name: "route-content-reveal",
    duration: "0.28s",
    timing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
  });

  await page.goto("/orbit-labs/settings");
  await page.waitForLoadState("networkidle");
  await page.route("**/*", async (route) => {
    if (route.request().method() === "POST") {
      await new Promise((resolve) => setTimeout(resolve, 1_500));
    }
    await route.continue();
  });

  const save = page.locator('.settings-form button[type="submit"]');
  const submission = save.click();
  await expect(save).toHaveAttribute("aria-busy", "true");
  await expect(save.locator(".pending-indicator")).toHaveAttribute("data-pending", "true");
  await expect(save).toContainText("Saving...");
  await submission;
  await expect(save).not.toHaveAttribute("aria-busy", "true");
});

test("short and long routes keep the viewport width stable", async ({ page }) => {
  await enterOwnerDemo(page);
  const settledWidth = await page.evaluate(() => document.documentElement.clientWidth);

  await page.getByRole("link", { name: "Cases", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Cases", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.clientWidth)).toBe(settledWidth);

  await page.getByRole("link", { name: "Overview" }).click();
  await expect(page.getByRole("heading", { name: "Orbit Labs" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.clientWidth)).toBe(settledWidth);
  const routeHeights = await page.evaluate(async () => {
    const samples: number[] = [];
    const startedAt = performance.now();
    while (performance.now() - startedAt < 320) {
      samples.push(document.documentElement.scrollHeight);
      await new Promise(requestAnimationFrame);
    }
    return { minimum: Math.min(...samples), maximum: Math.max(...samples) };
  });
  expect(routeHeights.maximum).toBe(routeHeights.minimum);
});

test("reduced motion preserves state while removing nonessential movement", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await enterOwnerDemo(page);
  await page.goto("/orbit-labs/settings");
  await expect(page.getByRole("heading", { name: "Shape the operation" })).toBeVisible();

  const reduced = await page.evaluate(() => {
    const main = document.querySelector(".route-content-boundary > main:not(.route-loading)");
    const button = document.querySelector(".pending-action");
    const spinner = button?.querySelector(".pending-indicator svg");
    const mainStyle = main ? getComputedStyle(main) : null;
    const spinnerStyle = spinner ? getComputedStyle(spinner) : null;
    return {
      preference: matchMedia("(prefers-reduced-motion: reduce)").matches,
      routeAnimation: mainStyle?.animationName,
      routeTransform: mainStyle?.transform,
      routeFilter: mainStyle?.filter,
      spinnerAnimation: spinnerStyle?.animationName,
      pendingTextPresent: Boolean(button?.textContent?.trim()),
    };
  });

  expect(reduced).toEqual({
    preference: true,
    routeAnimation: "none",
    routeTransform: "none",
    routeFilter: "none",
    spinnerAnimation: "none",
    pendingTextPresent: true,
  });
  await context.close();
});
