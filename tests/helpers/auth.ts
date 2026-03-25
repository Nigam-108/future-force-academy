import { expect, Page } from "@playwright/test";

export async function fillLoginForm(
  page: Page,
  input: { identifier: string; password: string }
) {
  const identifierInput = page
    .getByPlaceholder(/email|10-digit mobile|mobile number/i)
    .first();

  await expect(identifierInput).toBeVisible();
  await identifierInput.fill(input.identifier);

  const passwordInput = page
    .getByPlaceholder(/password/i)
    .first();

  await expect(passwordInput).toBeVisible();
  await passwordInput.fill(input.password);
}

export async function submitPrimaryAuthForm(page: Page) {
  const button = page.getByRole("button", {
    name: /login|sign in/i,
  }).first();

  await expect(button).toBeVisible();
  await button.click();
}

export async function expectUrlToContain(page: Page, value: string) {
  await expect(page).toHaveURL(
    new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  );
}

export async function expectSuccessText(page: Page, text: RegExp | string) {
  await expect(page.getByText(text)).toBeVisible();
}

export async function expectErrorText(page: Page, text: RegExp | string) {
  await expect(page.getByText(text)).toBeVisible();
}