import { test, expect } from "@playwright/test";

test.describe("Auth - signup flow", () => {
  test("signup page renders with expected fields", async ({ page }) => {
    await page.goto("/signup");

    await expect(page.getByRole("heading", { name: /sign up|create account/i })).toBeVisible();
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();

    const passwordField = page.getByLabel(/password/i).first();
    await expect(passwordField).toBeVisible();
  });

  test("signup page shows login cross-link", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByText(/already have an account|login|sign in/i)).toBeVisible();
  });

  test("signup validation blocks empty submit", async ({ page }) => {
    await page.goto("/signup");

    const button = page.getByRole("button", {
      name: /sign up|create account|continue|verify/i,
    }).first();

    await button.click();

    await expect(
      page.getByText(/required|enter|valid/i).first()
    ).toBeVisible();
  });
});