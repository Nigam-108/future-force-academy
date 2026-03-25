import { test, expect } from "@playwright/test";

test.describe("Auth - signup flow", () => {
  test("signup page renders with expected fields", async ({ page }) => {
    await page.goto("/signup");

    await expect(
      page.getByRole("heading", { name: /student signup|sign up|signup/i })
    ).toBeVisible();

    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mobile/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();

    await expect(
      page.getByRole("button", { name: /send otp/i })
    ).toBeVisible();
  });

  test("signup page shows login cross-link", async ({ page }) => {
    await page.goto("/signup");

    await expect(
      page.getByRole("link", { name: /login/i })
    ).toBeVisible();
  });

  test("signup validation blocks empty submit", async ({ page }) => {
    await page.goto("/signup");

    await page.getByRole("button", { name: /send otp/i }).click();

    await expect(
      page.getByText(/required|enter|valid/i).first()
    ).toBeVisible();
  });
});