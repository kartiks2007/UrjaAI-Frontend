import { test, expect } from "@playwright/test";
test("synthetic sensor data → SQL → Gemini analysis → chatbot", async ({
  page,
  request,
}) => {
  test.skip(
    process.env.URJAAI_LIVE_AI_TEST !== "1",
    "Live test requires explicit opt-in and uses Gemini quota.",
  );
  const auth = await request.post(
    "http://127.0.0.1:3196/auth/v1/token?grant_type=password",
    {
      data: { email: "owner@urjaai.test", password: "Test-only-password-123" },
    },
  );
  expect(auth.ok()).toBeTruthy();
  const { access_token } = await auth.json();
  const headers = { Authorization: "Bearer " + access_token },
    base = "http://127.0.0.1:3195/api/v1";
  await request.get(base + "/auth/me", { headers });
  const org = await request.post(base + "/organizations", {
    headers,
    data: {
      name: "Synthetic AI QA workspace",
      currency: "INR",
      electricity_tariff_per_kwh: 7.5,
      emission_factor: null,
      factor_source: "",
      location: "Test",
      business_details: "",
    },
  });
  expect(org.ok()).toBeTruthy();
  const machine = await request.post(base + "/machines", {
    headers,
    data: { name: "Synthetic AI CNC", machine_type: "CNC" },
  });
  expect(machine.ok()).toBeTruthy();
  const { id } = await machine.json();
  const dev = await request.post(base + `/machines/${id}/devices`, {
    headers,
    data: { name: "Synthetic test device", device_uid: "AI-TEST-SENSOR" },
  });
  expect(dev.ok()).toBeTruthy();
  const device = await dev.json();
  for (let i = 0; i < 3; i++) {
    const response = await request.post(base + "/device/telemetry", {
      headers: { Authorization: "Device " + device.credential },
      data: {
        device_id: "AI-TEST-SENSOR",
        timestamp: new Date(Date.now() - 60000 + i * 10000).toISOString(),
        sequence_number: i,
        firmware_version: "TEST",
        measurements: {
          voltage_v: 230,
          current_a: 2,
          power_w: 460,
          energy_kwh: 10 + i * 0.001,
          frequency_hz: 50,
          power_factor: 1,
        },
      },
    });
    expect(response.ok()).toBeTruthy();
  }
  await page.goto("/login");
  await page.getByLabel("Work email").fill("owner@urjaai.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("Test-only-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.goto("/assistant");
  await expect(
    page.getByRole("heading", { name: "AI Assistant" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Enable external AI analysis", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Disable external AI analysis" }),
  ).toBeVisible();
  await page
    .locator("label")
    .filter({ hasText: "Machine" })
    .locator("select")
    .selectOption({ label: "Synthetic AI CNC" });
  await page
    .getByLabel("Your question")
    .fill(
      "Summarize the synthetic machine readings. Do we have enough evidence to predict a failure?",
    );
  await page.getByRole("button", { name: "Ask UrjaAI", exact: true }).click();
  await expect(page.locator(".ai-answer").first()).toBeVisible({
    timeout: 120000,
  });
  await expect(
    page.getByText(/gemini-3\.5-flash(?:-lite)?/).first(),
  ).toBeVisible();
  const sessions = await (
    await request.get(base + "/ai/sessions", { headers })
  ).json();
  const messages = await (
    await request.get(base + `/ai/sessions/${sessions[0].id}/messages`, {
      headers,
    })
  ).json();
  expect(messages[0].status).toBe("completed");
  expect(messages[0].context_meta.mode).toBe("live");
  expect(messages[0].result.answer.length).toBeGreaterThan(5);
  await page
    .getByRole("button", { name: "Analyze selected data", exact: true })
    .click();
  await expect(page.locator(".ai-answer")).toHaveCount(2, { timeout: 120000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "../urjaai-integration/qa/ai-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "../urjaai-integration/qa/ai-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Disable external AI analysis" })
    .click();
  await expect(
    page.getByRole("button", { name: "Ask UrjaAI", exact: true }),
  ).toBeDisabled();
});
