import {test,expect} from '@playwright/test';
import {mockMessenger} from './messenger-fixture.mjs';
import {listing} from './support.mjs';

test.beforeEach(async({page})=>{
 await mockMessenger(page);
 await page.route('https://mock-messenger.invalid/rest/v1/rpc/marketplace_catalog*',r=>
  r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([listing])})
 );
});
async function signIn(page){
 await page.goto('/buyer/');
 await page.locator('#hustle-auth-email').fill('buyer@example.test');
 await page.locator('#hustle-auth-password').fill('TestPasswordOnly123!');
 await page.locator('.hustle-auth-submit').click();
 await expect(page.locator('.workspace-main')).toBeVisible();
}
test('V44: guest retains selected seller; signed-in buyer opens selected chat without login',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.v39-talent-card')).toBeVisible();
 const contact=page.locator('.v39-talent-card .v39-contact');
 await expect(contact).toHaveAttribute('href','/login/?mode=buyer&seller=qa-seller');
 await signIn(page);
 await page.goto('/');
 await expect(page.locator('.global-account-trigger')).toBeVisible();
 const signedInContact=page.locator('.v39-talent-card .v39-contact');
 await expect(signedInContact).toHaveAttribute('href','/buyer/?seller=qa-seller');
 await signedInContact.click();
 await expect(page).toHaveURL(/\/buyer\/\?seller=qa-seller/);
 await expect(page.locator('.v25-messenger')).toBeVisible();
 await expect(page.locator('.chat-thread-head')).toContainText('QA Seller');
});
test('V44: seller account routes header, account menu and chat notifications to Seller Studio',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.route('https://mock-messenger.invalid/rest/v1/profiles*',r=>{
  const profiles=[
   {id:'10000000-0000-4000-8000-000000000001',display_name:'QA Seller Buyer',is_seller:true,public_profile:true,slug:'qa-seller-buyer',headline:'Designer',bio:'QA profile'},
   {id:'10000000-0000-4000-8000-000000000002',display_name:'QA Seller',is_seller:true,public_profile:true,slug:'qa-seller',headline:'Designer',bio:'QA profile'}
  ];
  const id=new URL(r.request().url()).searchParams.get('id');
  return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(id?.startsWith('eq.')?profiles.filter(p=>p.id===id.slice(3)):profiles)});
 });
 await signIn(page);
 await page.goto('/');
 const avatar=page.locator('.global-account-trigger');
 await expect(avatar).toBeVisible();
 await avatar.click();
 await expect(page.locator('#global-account-panel a[href="/seller-studio/"]')).toHaveCount(2);
 await expect(page.locator('#global-account-panel a[href="/buyer/"]')).toBeVisible();
 await avatar.click();
 const mobileMenu=page.locator('.hx-header .hx-burger');
 await mobileMenu.click();
 await expect(page.locator('.mobile-auth-nav')).toHaveAttribute('href','/seller-studio/');
 await mobileMenu.click();
 await page.locator('.global-notice-trigger').click();
 await expect(page.locator('.global-notice-item a[href="/seller-studio/?tab=messages"]')).toBeVisible();
});
