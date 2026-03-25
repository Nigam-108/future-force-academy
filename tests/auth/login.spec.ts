import { test, expect } from "@playwright/test";

test("login page opens", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveURL(/login/);
});
import {
  fillLoginForm,
  submitPrimaryAuthForm,
  expectUrlToContain,
} from "../helpers/auth";


test.describe("Auth - login flow", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: /login|sign in/i })).toBeVisible();
    await expect(page.getByText(/forgot password/i)).toBeVisible();
    await expect(page.getByText(/sign up|create account/i)).toBeVisible();
  });

  test("invalid credentials show error message", async ({ page }) => {
    await page.goto("/login");

    await fillLoginForm(page, {
      identifier: "wrong@example.com",
      password: "WrongPassword123!",
    });

    await submitPrimaryAuthForm(page);

    await expect(
      page.getByText(/invalid credentials|incorrect|not found|wrong/i)
    ).toBeVisible();
  });

  test("protected route redirects to login with redirectTo", async ({ page }) => {
    await page.goto("/student/dashboard");

    await expectUrlToContain(page, "/login");
    await expect(page).toHaveURL(/redirectTo=/);
  });
});