import { test, expect } from "@playwright/test";

test.describe("Auth - policy acknowledgement", () => {
  test("signup page shows policy/terms acknowledgement UI", async ({ page }) => {
    await page.goto("/signup");

    await expect(
      page.getByText(/terms|privacy|policy|agree/i).first()
    ).toBeVisible();
  });

  test("policy acknowledgement control is visible before final submit", async ({ page }) => {
    await page.goto("/signup");

    const checkbox = page.getByRole("checkbox").first();
    await expect(checkbox).toBeVisible();
  });
});