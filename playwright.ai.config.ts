import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e/ai",
  workers: 1,
  timeout: 180000,
  reporter: "list",
  outputDir: "ai-test-results",
  use: {
    baseURL: "http://127.0.0.1:5195",
    headless: true,
    channel: "msedge",
    viewport: { width: 390, height: 844 },
    actionTimeout: 10000,
    trace: "retain-on-failure",
  },
});
