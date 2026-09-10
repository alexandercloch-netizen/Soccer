import { test, expect } from "@playwright/test";

test.describe("parent journey", () => {
  test("opens the team link and sees the next event, gear, and snacks without a login", async ({ page }) => {
    await page.goto("/t/spurs26");
    await expect(page.getByRole("heading", { name: "This week" })).toBeVisible();
    const hero = page.getByText("Next up").locator("..");
    await expect(hero).toBeVisible();
    await expect(page.getByText(/Bring every week/)).toBeVisible();
    await expect(page.getByText(/Micro-Field 11 South/).first()).toBeVisible();
    await page.getByRole("link", { name: "Snacks" }).first().click();
    await expect(page.getByRole("heading", { name: "Snack rotation" })).toBeVisible();
    await expect(page.getByText("vs Chelsea").first()).toBeVisible();
  });
  test("roster shows first names and last initials only", async ({ page }) => {
    await page.goto("/t/spurs26/roster");
    const names = await page.locator("main li span").allTextContents();
    for (const n of names.filter((x) => /\w+ \w\./.test(x))) expect(n).toMatch(/^\S+ [A-Z]\.$/);
    const html = await page.content();
    expect(html).not.toMatch(/\(\d{3}\) \d{3}-\d{4}/);
    expect(html).not.toMatch(/@(gmail|comcast|d128)\./);
  });
  test("an unknown share code is a 404", async ({ page }) => {
    const res = await page.goto("/t/definitely-not-a-code");
    expect(res?.status()).toBe(404);
  });
});
