import { test, expect } from "@playwright/test";

test.describe("Auth - forgot password flow", () => {
  test("forgot-password page renders", async ({ page }) => {
    await page.goto("/forgot-password");

    await expect(
      page.getByRole("heading", { name: /forgot password/i })
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: /reset your password/i })
    ).toBeVisible();

    await expect(
      page.getByPlaceholder(/registered email/i)
    ).toBeVisible();
  });

  test("forgot-password page shows login back-link", async ({ page }) => {
    await page.goto("/forgot-password");

    await expect(
      page.getByRole("link", { name: /back to login/i })
    ).toBeVisible();
  });

  test("forgot-password validation blocks invalid email", async ({ page }) => {
    await page.goto("/forgot-password");

    await page.getByPlaceholder(/registered email/i).fill("wrong-email");

    await page.getByRole("button", { name: /send reset otp/i }).click();

    await expect(
      page.getByText(/valid email/i)
    ).toBeVisible();
  });
});