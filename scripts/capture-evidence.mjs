import { mkdir, rename } from "node:fs/promises";
import { chromium } from "@playwright/test";

const baseUrl = process.env.EVIDENCE_BASE_URL ?? "http://127.0.0.1:3108";
const output = "docs/evidence";
await mkdir(output, { recursive: true });

const browser = await chromium.launch();
const ownerContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: `${output}/raw-video`, size: { width: 1440, height: 900 } } });
const owner = await ownerContext.newPage();
await owner.goto(`${baseUrl}/sign-in`);
await owner.screenshot({ path: `${output}/01-demo-access.png`, fullPage: true });
await owner.getByRole("button", { name: "Explore as Owner" }).click();
await owner.waitForURL("**/orbit-labs/overview");
await owner.waitForTimeout(900);
await owner.screenshot({ path: `${output}/02-operational-overview.png`, fullPage: true });
await owner.locator('a[href="/orbit-labs/cases?overdue=true"]').click();
await owner.waitForURL("**/orbit-labs/cases?overdue=true");
await owner.waitForTimeout(700);
await owner.screenshot({ path: `${output}/03-overdue-queue.png`, fullPage: true });
await owner.goto(`${baseUrl}/orbit-labs/settings`);
await owner.waitForTimeout(700);
await owner.screenshot({ path: `${output}/04-settings.png`, fullPage: true });
const video = owner.video();
await ownerContext.close();
if (video) await rename(await video.path(), `${output}/caselane-owner-walkthrough.webm`);

const clientContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const client = await clientContext.newPage();
await client.goto(`${baseUrl}/sign-in`);
await client.getByRole("button", { name: "Explore as Client" }).click();
await client.waitForURL("**/portal/orbit-labs/requests");
await client.waitForTimeout(700);
await client.screenshot({ path: `${output}/05-client-portal-mobile.png`, fullPage: true });
await clientContext.close();
await browser.close();

console.log("Portfolio screenshots and walkthrough video captured.");
