import {test,expect} from '@playwright/test';
import {mockMessenger} from './messenger-fixture.mjs';

test.beforeEach(async({page})=>{await mockMessenger(page)});

test('guest homepage shows login, not an account dashboard',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.site-header .login-link')).toContainText(/Нэвтрэх|Log in/);
 await expect(page.locator('.site-header .login-link')).toHaveAttribute('href','/login/?mode=buyer');
});
for(const width of [390,768,1440]){
 test('signed-in dashboard > logo > homepage > dashboard keeps session at '+width,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto('/buyer/');
  await page.locator('#hustle-auth-email').fill('buyer@example.test');
  await page.locator('#hustle-auth-password').fill('TestPasswordOnly123!');
  await page.locator('.hustle-auth-submit').click();
  await expect(page.locator('.workspace-main')).toBeVisible();
  await page.locator('.site-header .wordmark').click();
  await expect(page).toHaveURL(/\/$/);
  if(width<=800){
   await page.locator('.site-header .mobile-menu').click();
   const dashboard=page.locator('.site-header .mobile-auth-nav');
   await expect(dashboard).toContainText(/Миний орон зай|My dashboard/);
   await dashboard.click();
  }else{
   const dashboard=page.locator('.site-header .login-link');
   await expect(dashboard).toContainText(/Миний орон зай|My dashboard/);
   await dashboard.click();
  }
  await expect(page.locator('.workspace-main')).toBeVisible();
  await expect(page.locator('#hustle-auth-email')).toHaveCount(0);
  await page.screenshot({path:'test-results/v26-nav-'+width+'.png',fullPage:true});
 });
}
