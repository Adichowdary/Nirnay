import { test, expect } from "@playwright/test";

test.describe("INSIGHT Platform — Core Flows", () => {
  test("login page loads with government branding", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/INSIGHT/);
    await expect(page.locator("text=Government of India")).toBeVisible();
    await expect(page.locator("text=Ministry of Social Justice")).toBeVisible();
  });

  test("login page has role cards", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=DOSJE Official")).toBeVisible();
    await expect(page.locator("text=Inspection Officer")).toBeVisible();
    await expect(page.locator("text=NGO/Institute")).toBeVisible();
    await expect(page.locator("text=District Authority")).toBeVisible();
    await expect(page.locator("text=Administrator")).toBeVisible();
  });

  test("accessibility widget toggles", async ({ page }) => {
    await page.goto("/login");
    await page.click("button[aria-label='Accessibility options']");
    await expect(page.locator("text=Accessibility Options")).toBeVisible();
    await expect(page.locator("text=Text Size")).toBeVisible();
    await expect(page.locator("text=Contrast")).toBeVisible();
  });

  test("dark mode toggle works", async ({ page }) => {
    await page.goto("/login");
    const htmlBefore = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    await page.click("button[aria-label='Switch to dark mode']");
    const htmlAfter = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(htmlAfter).not.toBe(htmlBefore);
  });

  test("map page loads with filters", async ({ page }) => {
    await page.goto("/dashboard/map");
    await expect(page.locator("text=Map Intelligence")).toBeVisible();
    await expect(page.locator("text=GEO-VERIFIED SITES")).toBeVisible();
    await expect(page.locator("text=Map Filters")).toBeVisible();
    await expect(page.locator("text=Map Layers")).toBeVisible();
  });

  test("map filter panel toggles", async ({ page }) => {
    await page.goto("/dashboard/map");
    // Filters should be visible
    await expect(page.locator("text=Risk Level")).toBeVisible();
    await expect(page.locator("text=CCTV Status")).toBeVisible();
    await expect(page.locator("text=District")).toBeVisible();
  });

  test("map layer control toggles", async ({ page }) => {
    await page.goto("/dashboard/map");
    await expect(page.locator("text=Project Sites")).toBeVisible();
    await expect(page.locator("text=Risk Indicators")).toBeVisible();
    await expect(page.locator("text=Inspector Locations")).toBeVisible();
    await expect(page.locator("text=Geofence Zones")).toBeVisible();
  });

  test("map shows facility list in sidebar", async ({ page }) => {
    await page.goto("/dashboard/map");
    await expect(page.locator("text=FACILITIES")).toBeVisible();
    // Should show demo facilities
    await expect(page.locator("text=Asha Rehabilitation Centre")).toBeVisible();
  });

  test("map 2D/3D toggle exists", async ({ page }) => {
    await page.goto("/dashboard/map");
    await expect(page.locator("button[aria-label='Switch to 3D']")).toBeVisible();
  });

  test("map legend shows risk colors", async ({ page }) => {
    await page.goto("/dashboard/map");
    await expect(page.locator("text=Low Risk")).toBeVisible();
    await expect(page.locator("text=High Risk")).toBeVisible();
    await expect(page.locator("text=Critical Risk")).toBeVisible();
  });
});

test.describe("INSIGHT Platform — Dashboard Pages", () => {
  test("main dashboard loads", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("text=DOSJE")).toBeVisible();
  });

  test("inspections page loads", async ({ page }) => {
    await page.goto("/dashboard/inspections");
    await expect(page.locator("text=Inspection")).toBeVisible();
  });

  test("video verification page loads", async ({ page }) => {
    await page.goto("/dashboard/video-verification");
    await expect(page.locator("text=Random Video Verification")).toBeVisible();
  });

  test("CCTV monitor page loads", async ({ page }) => {
    await page.goto("/dashboard/monitor");
    await expect(page.locator("text=Live CCTV Monitor")).toBeVisible();
  });

  test("GPS verify page loads", async ({ page }) => {
    await page.goto("/dashboard/inspections/insp-1/gps-verify");
    await expect(page.locator("text=GPS Verification")).toBeVisible();
  });
});
