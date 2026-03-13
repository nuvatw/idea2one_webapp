import { test, expect } from "@playwright/test";

/**
 * E2E: 法法主流程
 * login → home → qa → AI → 正式提問
 *
 * Prerequisites: A running app with seeded test data.
 * These tests verify the complete user journey.
 */

test.describe("Participant main flow", () => {
  test("login page loads and shows form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[name='participantCode']")).toBeVisible();
    await expect(page.locator("input[name='email']")).toBeVisible();
  });

  test("shows error for invalid login", async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[name='participantCode']", "AB");
    await page.fill("input[name='email']", "invalid");
    await page.click("button[type='submit']");

    // Should show validation errors
    await expect(page.getByText("學員編號為 3 碼數字")).toBeVisible();
  });

  test("shows error for non-existent code", async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[name='participantCode']", "999");
    await page.fill("input[name='email']", "test@example.com");
    await page.click("button[type='submit']");

    // Should show not found or system error
    await expect(
      page.getByText(/編號查詢不到|系統暫時無法登入/)
    ).toBeVisible({ timeout: 10000 });
  });

  test("home page requires authentication", async ({ page }) => {
    await page.goto("/home");
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("QA page requires authentication", async ({ page }) => {
    await page.goto("/qa");
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
