import { test, expect } from "@playwright/test";

test.describe("coach journey", () => {
  test("is redirected to sign in, signs in, and reaches the dashboard", async ({ page }) => {
    await page.goto("/team/tottenham-fall-2026");
    await expect(page).toHaveURL(/\/login\?next=/);
    await page.getByLabel("Team passcode").fill("wrong");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(/didn.t match/)).toBeVisible();
    await page.getByLabel("Team passcode").fill("e2e-passcode");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/team\/tottenham-fall-2026$/);
    await expect(page.getByRole("heading", { name: "This week" })).toBeVisible();
  });
  test("runs Game Day: attendance, start, next period, and the rotation stays fair", async ({ page }) => {
    await page.goto("/login?next=/team/tottenham-fall-2026/game/e-g1");
    await page.getByLabel("Team passcode").fill("e2e-passcode");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: /Who.s here/ })).toBeVisible();
    const buttons = page.getByRole("button", { pressed: true });
    await buttons.first().click(); // mark one player absent
    await page.getByRole("button", { name: "Start game" }).click();
    await expect(page.getByText(/quarter 1 of 4/i)).toBeVisible();
    await page.getByRole("button", { name: /Next quarter/ }).click();
    await expect(page.getByText(/quarter 2 of 4/i)).toBeVisible();
    await expect(page.getByText(/Spread: [08] min/)).toBeVisible();
  });
});
