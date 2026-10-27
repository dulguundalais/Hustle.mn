import {test,expect} from '@playwright/test';
import {mockMessenger} from './messenger-fixture.mjs';

test.beforeEach(async({page})=>{await mockMessenger(page)});

async function signInAsBuyer(page){
 await page.goto('/buyer/');
 await page.locator('#hustle-auth-email').fill('buyer@example.test');
 await page.locator('#hustle-auth-password').fill('TestPasswordOnly123!');
 await page.locator('.hustle-auth-submit').click();
 await expect(page.locator('.workspace-main')).toBeVisible();
}

test('guest homepage shows login but no account avatar',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.hx-header .hx-login')).toContainText(/Нэвтрэх|Log in/);
 await expect(page.locator('.hx-header .hx-login')).toHaveAttribute('href','/login/?mode=buyer');
 await expect(page.locator('.global-account-trigger')).toHaveCount(0);
});

for(const width of [390,768,1440]){
 test('signed-in avatar menu preserves session across homepage and dashboard at '+width,async({page})=>{
  await page.setViewportSize({width,height:900});
  await signInAsBuyer(page);
  await page.locator('.hx-header .hx-brand').click();
  await expect(page).toHaveURL(/\/$/);
  const avatar=page.locator('.hx-header .global-account-trigger');
  await expect(avatar).toBeVisible();
  await expect(avatar).toHaveAttribute('aria-expanded','false');
  await expect(avatar).toHaveAttribute('aria-label',/QA Buyer/);
  await avatar.click();
  await expect(avatar).toHaveAttribute('aria-expanded','true');
  await expect(page.locator('#global-account-panel')).toBeVisible();
  await expect(page.locator('#global-account-panel a[href="/buyer/"]')).toBeVisible();
  await expect(page.locator('#global-account-panel a[href="/buyer/?tab=profile"]')).toBeVisible();
  await expect(page.locator('#global-account-panel button.global-account-signout')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#global-account-panel')).toHaveCount(0);
  await expect(avatar).toBeFocused();
  await avatar.click();
  await page.locator('#global-account-panel a[href="/buyer/"]').click();
  await expect(page.locator('.workspace-main')).toBeVisible();
  await expect(page.locator('#hustle-auth-email')).toHaveCount(0);
  await page.screenshot({path:'test-results/v35-1-account-'+width+'.png',fullPage:true});
 });
}

test('profile link opens editor, logout resets homepage and protected buyer view',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await signInAsBuyer(page);
 await page.locator('.hx-header .hx-brand').click();
 await page.locator('.global-account-trigger').click();
 await page.locator('#global-account-panel a[href="/buyer/?tab=profile"]').click();
 await expect(page.locator('input[name="display_name"]')).toBeVisible();
 await page.locator('.hx-header .hx-brand').click();
 await page.locator('.global-account-trigger').click();
 await page.locator('.global-account-signout').click();
 await expect(page.locator('.hx-header .hx-login')).toHaveAttribute('href','/login/?mode=buyer');
 await expect(page.locator('.global-account-trigger')).toHaveCount(0);
 await page.goto('/buyer/');
 await expect(page.locator('#hustle-auth-email')).toBeVisible();
});
