import { test, expect } from "@playwright/test";

test.describe("Auth - policy acknowledgement", () => {
  test("signup page shows policy acknowledgement UI", async ({ page }) => {
    await page.goto("/signup");

    await expect(
      page.getByText(/terms\s*&\s*conditions/i)
    ).toBeVisible();

    await expect(
      page.getByText(/privacy policy/i)
    ).toBeVisible();

    await expect(
      page.getByText(/refund\s*\/\s*cancellation policy/i)
    ).toBeVisible();
  });

  test("policy acknowledgement checkbox is visible", async ({ page }) => {
    await page.goto("/signup");

    const checkbox = page.locator('input[type="checkbox"]').first();
    await expect(checkbox).toBeVisible();
  });
});