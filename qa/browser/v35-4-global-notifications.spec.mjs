import {test,expect} from '@playwright/test';
import {mockMessenger} from './messenger-fixture.mjs';

test.beforeEach(async({page})=>{
 await mockMessenger(page);
 let projectRead=false,orderRead=false;
 await page.route('https://mock-messenger.invalid/rest/v1/project_notifications*',async route=>{
  if(route.request().method()==='PATCH'){projectRead=true;return route.fulfill({status:204,body:''})}
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{
   id:'91000000-0000-4000-8000-000000000001',recipient_id:'10000000-0000-4000-8000-000000000001',
   request_id:'20000000-0000-4000-8000-000000000002',kind:'proposal',
   created_at:'2026-10-23T13:12:00Z',read_at:projectRead?'2026-10-23T13:30:00Z':null
  }])});
 });
 await page.route('https://mock-messenger.invalid/rest/v1/order_notifications*',async route=>{
  if(route.request().method()==='PATCH'){orderRead=true;return route.fulfill({status:204,body:''})}
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{
   id:'92000000-0000-4000-8000-000000000001',recipient_id:'10000000-0000-4000-8000-000000000001',
   order_id:'40000000-0000-4000-8000-000000000001',kind:'delivered',
   created_at:'2026-10-23T13:10:00Z',read_at:orderRead?'2026-10-23T13:30:00Z':null
  }])});
 });
});
async function signIn(page){
 await page.goto('/buyer/');
 await page.locator('#hustle-auth-email').fill('buyer@example.test');
 await page.locator('#hustle-auth-password').fill('TestPasswordOnly123!');
 await page.locator('.hustle-auth-submit').click();
 await expect(page.locator('.workspace-main')).toBeVisible();
}
test('anonymous users have no notification center',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.global-notice-trigger')).toHaveCount(0);
});
for(const width of [390,1440]){
 test('notification bell works across homepage and dashboard at '+width,async({page})=>{
  await page.setViewportSize({width,height:850});
  await signIn(page);
  await page.locator('.hx-header .hx-brand').click();
  const trigger=page.locator('.global-notice-trigger');
  await expect(trigger).toBeVisible();
  await expect(page.locator('.global-notice-count')).toHaveText('3');
  await trigger.click();
  await expect(page.locator('#global-notice-panel')).toBeVisible();
  await expect(page.locator('.global-notice-item')).toHaveCount(3);
  await expect(page.locator('.global-notice-item a[href^="/buyer/?tab=messages"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#global-notice-panel')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole('button',{name:/Mark alerts read|Бүгдийг уншсан/}).click();
  await expect(page.locator('.global-notice-count')).toHaveText('1');
  await page.locator('.global-notice-item a[href^="/buyer/?tab=messages"]').click();
  await expect(page).toHaveURL(/\/buyer\/\?tab=messages/);
  await expect(page.locator('.v25-messenger')).toBeVisible();
  await expect(page.locator('.global-notice-trigger')).toBeVisible();
 });
}
test('project notification routes to buyer project requests',async({page})=>{
 await signIn(page);
 await page.locator('.global-notice-trigger').click();
 await page.locator('.global-notice-item a[href="/project-requests/"]').click();
 await expect(page).toHaveURL(/\/project-requests\//);
 await expect(page.locator('.project-marketplace')).toBeVisible();
});
