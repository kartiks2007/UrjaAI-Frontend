import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./e2e/fullstack',workers:1,fullyParallel:false,timeout:180000,reporter:'list',outputDir:'integration-results/mobile',use:{baseURL:'http://127.0.0.1:5191',channel:'msedge',headless:true,viewport:{width:390,height:844},trace:'retain-on-failure'}});
