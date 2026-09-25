import { defineConfig,devices } from '@playwright/test';
export default defineConfig({
  testDir:'./e2e/fullstack',workers:1,fullyParallel:false,timeout:60000,
  reporter:'list',outputDir:'integration-results',
  use:{baseURL:'http://127.0.0.1:5180',headless:true,channel:process.env.PLAYWRIGHT_CHANNEL??'msedge',...devices['Desktop Chrome'],viewport:{width:1440,height:1000},trace:'retain-on-failure'},
  webServer:{command:'node ../urjaai-integration/scripts/test-stack.mjs',url:'http://127.0.0.1:5180/__integration/ready',reuseExistingServer:process.env.URJAAI_REUSE_TEST_STACK==='1',timeout:120000},
});
