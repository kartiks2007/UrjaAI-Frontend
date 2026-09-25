import { test, expect } from "@playwright/test";
test("public website, navigation and responsive layout", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Turn machine data into better utilization.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("16×2 I²C LCD for local visibility"),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `qa/landing-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("link", { name: /Get started/i })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Create your account" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("authentication protects real routes", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=/);
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(
    page.getByRole("heading", { name: "Reset your password" }),
  ).toBeVisible();
});
test("all development review routes are usable and honest", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of [
    "dashboard",
    "machines",
    "machines/new",
    "machines/review",
    "energy",
    "alerts",
    "reports",
    "share",
    "share/review",
    "bookings",
    "organization",
    "settings",
    "admin",
  ]) {
    await page.goto("/preview/" + route);
    await expect(page.getByText("Frontend design review.")).toBeVisible();
    await expect(page.locator("#main h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Overflow on ${route}`,
    ).toBe(true);
    if (["dashboard", "machines", "energy", "share"].includes(route))
      await page.screenshot({
        path: `qa/${route}-${testInfo.project.name}.png`,
        fullPage: true,
      });
  }
  expect(errors).toEqual([]);
});
test("review forms cannot mutate data and mobile navigation works", async ({
  page,
}, testInfo) => {
  await page.goto("/preview/machines/new");
  await expect(
    page.getByRole("button", { name: "Create machine" }),
  ).toBeDisabled();
  await page.getByLabel("Machine name").fill("TEST ONLY");
  await expect(page.getByLabel("Machine name")).toHaveValue("TEST ONLY");
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(
      page.getByRole("dialog", { name: "Navigation" }),
    ).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("link", { name: "UrjaAI Share", exact: true })
      .click();
    await expect(page).toHaveURL(/\/preview\/share/);
    await expect(page.getByRole("dialog")).not.toBeVisible();
  } else {
    await page.getByRole("link", { name: "UrjaAI Share", exact: true }).click();
    await expect(page).toHaveURL(/\/preview\/share/);
  }
});
