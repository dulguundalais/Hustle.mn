import {test,expect} from '@playwright/test';
import {mock} from './support.mjs';
import {mockMessenger,buyer} from './messenger-fixture.mjs';

test('signup sends preview-origin confirmation redirect without sending real email',async({page})=>{
 await mock(page);
 await page.goto('/login/');
 await page.getByRole('button',{name:/Бүртгэл үүсгэх|Create account/}).first().click();
 await page.locator('#hustle-auth-email').fill('qa@example.test');
 await page.locator('#hustle-auth-password').fill('SafeTestPassword123!');
 const sent=page.waitForRequest(r=>r.url().includes('/auth/v1/signup')&&r.method()==='POST');
 await page.locator('.hustle-auth-form button[type=submit]').click();
 const req=await sent;
 expect(decodeURIComponent(req.url())).toContain('/login/');
 expect(req.url()).not.toContain('localhost:3000');
 await expect(page.locator('.hustle-auth-feedback')).toBeVisible();
});

test('forgot password requests recovery back to current preview origin',async({page})=>{
 await mock(page);
 await page.goto('/login/');
 await page.getByRole('button',{name:/Нууц үгээ мартсан|Forgot password/}).click();
 await page.locator('#hustle-recovery-email').fill('qa@example.test');
 const sent=page.waitForRequest(r=>r.url().includes('/auth/v1/recover')&&r.method()==='POST');
 await page.locator('.hustle-auth-form button[type=submit]').click();
 const req=await sent;
 expect(decodeURIComponent(req.url())).toContain('/auth/reset/');
 expect(req.url()).not.toContain('localhost:3000');
 await expect(page.locator('.hustle-auth-feedback')).toBeVisible();
});

test('invalid reset link never allows changing a password',async({page})=>{
 await mock(page);
 await page.goto('/auth/reset/');
 await expect(page.locator('#reset-pass')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Update password'})).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Choose a new password.'})).toBeVisible();
});

test('beta pending user cannot access a private dashboard',async({page})=>{
 await mockMessenger(page);
 await page.route('https://mock-messenger.invalid/rest/v1/beta_allowlist*',r=>r.fulfill({status:200,contentType:'application/json',body:'null'}));
 await page.goto('/buyer/');
 await page.locator('#hustle-auth-email').fill('buyer@example.test');
 await page.locator('#hustle-auth-password').fill('SafeTestPassword123!');
 await page.locator('.hustle-auth-submit').click();
 await expect(page.locator('.access-card h1')).toContainText(/Бета эрх|Beta access/);
 await expect(page.locator('.workspace-main')).toHaveCount(0);
});

test('admin sees pending confirmed signup and can approve without auto-approval',async({page})=>{
 await mockMessenger(page);
 const admin='10000000-0000-4000-8000-000000000010';
 const user={id:admin,aud:'authenticated',email:'qa-admin@example.test',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},identities:[]};
 const header=['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',Buffer.from(JSON.stringify({sub:admin,email:user.email,role:'authenticated',exp:1950000000})).toString('base64url'),'signature'].join('.');
 const respond=(r,data)=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 let approvals=0;
 await page.route('https://mock-messenger.invalid/**',r=>{
   const path=new URL(r.request().url()).pathname;
   if(path.startsWith('/auth/v1/token'))return respond(r,{access_token:header,token_type:'bearer',expires_in:3600,refresh_token:'qa-refresh',user});
   if(path==='/auth/v1/user')return respond(r,user);
   if(path==='/rest/v1/beta_allowlist')return respond(r,{role:'admin'});
   if(path==='/rest/v1/profiles')return respond(r,[{id:admin,display_name:'QA Admin',is_seller:false}]);
   if(path==='/rest/v1/rpc/list_pending_beta_signups')return respond(r,[{email:'pending@example.test',registered_at:'2026-10-21T14:00:00Z'}]);
   if(path==='/rest/v1/rpc/manage_beta'){approvals++;return respond(r,null)}
   return r.fallback();
 });
 await page.goto('/admin/');
 await page.locator('#hustle-auth-email').fill('qa-admin@example.test');
 await page.locator('#hustle-auth-password').fill('SafeTestPassword123!');
 await page.locator('.hustle-auth-submit').click();
 await expect(page.locator('.workspace-main')).toBeVisible();
 const betaPanel=page.locator('.workspace-panel').filter({hasText:'pending@example.test'}).first();
 await expect(betaPanel).toBeVisible();
 expect(approvals).toBe(0);
 await betaPanel.getByRole('button',{name:/Зөвшөөрөх|Approve/}).first().click();
 await expect.poll(()=>approvals).toBe(1);
});
