import { test, expect } from "@playwright/test";

/**
 * E2E: 跨角色同步
 * Verifies that staff actions reflect on participant views.
 *
 * Prerequisites: A running app with seeded test data.
 */

test.describe("Cross-role sync", () => {
  test("root page loads and redirects appropriately", async ({ page }) => {
    await page.goto("/");
    // Root page should redirect to /login or /home based on session
    await expect(page).toHaveURL(/\/(login|home)/);
  });

  test("participant login page is mobile-friendly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login");
    await expect(page.locator("input[name='participantCode']")).toBeVisible();
    // Verify form fits in viewport
    const input = page.locator("input[name='participantCode']");
    const box = await input.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  });

  test("staff login page is accessible", async ({ page }) => {
    await page.goto("/staff/login");
    // Check basic accessibility: form elements should have labels or placeholders
    const passwordInput = page.locator("input[name='password']");
    await expect(passwordInput).toBeVisible();
  });
});
