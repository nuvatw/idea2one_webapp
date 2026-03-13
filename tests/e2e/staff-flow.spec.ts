import { test, expect } from "@playwright/test";

/**
 * E2E: 努努主流程
 * login → select → staff dashboard → 切 agenda → 回答 → check-in → lunch → dashboard
 *
 * Prerequisites: A running app with seeded test data.
 */

test.describe("Staff main flow", () => {
  test("staff login page loads", async ({ page }) => {
    await page.goto("/staff/login");
    await expect(page.locator("input[name='password']")).toBeVisible();
  });

  test("shows error for wrong password", async ({ page }) => {
    await page.goto("/staff/login");
    await page.fill("input[name='password']", "wrong");
    await page.click("button[type='submit']");

    await expect(page.getByText("密碼不正確")).toBeVisible({ timeout: 10000 });
  });

  test("staff dashboard requires authentication", async ({ page }) => {
    await page.goto("/staff");
    // Should redirect to login
    await expect(page).toHaveURL(/\/staff\/login/);
  });

  test("staff select page requires authentication", async ({ page }) => {
    await page.goto("/staff/select");
    // Should redirect to login
    await expect(page).toHaveURL(/\/staff\/login/);
  });
});
