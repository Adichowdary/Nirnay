import { test, expect, Page } from "@playwright/test";

async function waitForPageReady(page: Page) {
  try {
    const dialog = page.locator("[role='dialog'][aria-label*='Loading Animation']");
    if (await dialog.isVisible({ timeout: 1500 })) {
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
    }
  } catch {}
}

test.describe("NIRNAY Platform — Core Flows", () => {
  test("login page loads with government branding", async ({ page }) => {
    await page.goto("/login");
    await waitForPageReady(page);
    await expect(page).toHaveTitle(/NIRNAY|INSIGHT/i);
    await expect(page.locator("text=Government of India").first()).toBeVisible();
    await expect(page.locator("text=Ministry of Social Justice").first()).toBeVisible();
  });

  test("login page has role cards", async ({ page }) => {
    await page.goto("/login");
    await waitForPageReady(page);
    await expect(page.locator("text=CENTRAL COMMAND DIRECTORATE").first()).toBeVisible();
    await expect(page.locator("text=STATE ADMINISTRATIVE AUTHORITY").first()).toBeVisible();
    await expect(page.locator("text=AUDIT SQUAD").first()).toBeVisible();
    await expect(page.locator("text=AGENCY PORTAL").first()).toBeVisible();
    await expect(page.locator("text=SYSTEM ADMIN").first()).toBeVisible();
  });

  test("dark mode toggle works", async ({ page }) => {
    await page.goto("/login");
    await waitForPageReady(page);
    const htmlBefore = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    await page.getByRole("button", { name: /Light|Dark/i }).click();
    const htmlAfter = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(htmlAfter).not.toBe(htmlBefore);
  });

  test("notification panel opens on dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForPageReady(page);
    await page.click("button[aria-label*='Notifications']");
    await expect(page.locator("text=Notifications").first()).toBeVisible();
  });

  test("map page loads with facility list and controls", async ({ page }) => {
    await page.goto("/dashboard/map");
    await waitForPageReady(page);
    await expect(page.locator("text=Map Intelligence & GIS Command")).toBeVisible();
    await expect(page.locator("text=/FACILITIES/").first()).toBeVisible();
    await expect(page.locator("text=Asha Rehabilitation Centre").first()).toBeVisible();
  });
});

test.describe("NIRNAY Platform — Dashboard Pages", () => {
  test("main dashboard loads", async ({ page }) => {
    await page.goto("/dashboard");
    await waitForPageReady(page);
    await expect(page.locator("text=NIRNAY").first()).toBeVisible();
  });

  test("inspections page loads", async ({ page }) => {
    await page.goto("/dashboard/inspections");
    await waitForPageReady(page);
    await expect(page.locator("text=Inspection").first()).toBeVisible();
  });

  test("video verification page loads", async ({ page }) => {
    await page.goto("/dashboard/video-verification");
    await waitForPageReady(page);
    await expect(page.locator("text=Surprise Video Inspection System")).toBeVisible();
  });

  test("CCTV monitor page loads", async ({ page }) => {
    await page.goto("/dashboard/monitor");
    await waitForPageReady(page);
    await expect(page.locator("text=Live CCTV Command")).toBeVisible();
  });

  test("GPS verify page loads", async ({ page }) => {
    await page.goto("/dashboard/inspections/insp-1/gps-verify");
    await waitForPageReady(page);
    await expect(page.getByRole("heading", { name: "GPS Verification" })).toBeVisible();
  });
});


