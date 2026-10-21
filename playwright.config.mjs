import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./qa/browser',
  timeout:45000,
  expect:{timeout:12000},
  fullyParallel:false,
  workers:1,
  retries:process.env.CI?1:0,
  reporter:[['list'],['html',{open:'never',outputFolder:'playwright-report'}]],
  outputDir:'test-results',
  use:{
    baseURL:process.env.HUSTLE_QA_BASE_URL||'http://127.0.0.1:4173',
    viewport:{width:1440,height:900},
    trace:'retain-on-failure',
    screenshot:'only-on-failure',
    headless:true,
  }
});
