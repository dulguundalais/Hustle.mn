import {test,expect} from '@playwright/test';
import {mock,listing} from './support.mjs';
const path='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.png';
const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL2WQAAAABJRU5ErkJggg==','base64');

test.beforeEach(async({page})=>{
 await mock(page);
 await page.route('https://qa-supabase.invalid/rest/v1/rpc/marketplace_catalog',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{...listing,avatar_path:path}])}));
 await page.route('**/api/portfolio-image?path=*',r=>r.fulfill({status:200,contentType:'image/png',body:image}));
});

test('seller portrait appears in homepage service card and preserves profile navigation',async({page})=>{
 await page.goto('/');
 const card=page.locator('.v39-talent-card');
 await expect(card).toBeVisible();
 const avatar=card.locator('.v41-card-avatar-img');
 await expect(avatar).toBeVisible();
 await expect(avatar).toHaveAttribute('src',new RegExp('^/api/portfolio-image\\?path='));
 await expect(card.getByRole('link',{name:/QA Seller/})).toHaveAttribute('href','/p/qa-seller');
});

test('seller portrait appears in Explore and on corresponding detail page',async({page})=>{
 await page.goto('/explore/');
 const card=page.locator('.v39-talent-card');
 await expect(card.locator('.v41-card-avatar-img')).toBeVisible();
 await card.locator('.v39-primary').click();
 await expect(page.locator('.v39-detail-avatar img')).toBeVisible();
 await expect(page.locator('.v39-detail-avatar img')).toHaveAttribute('src',new RegExp('^/api/portfolio-image\\?path='));
});

test('no uploaded photo gracefully falls back to seller initials',async({page})=>{
 await page.route('https://qa-supabase.invalid/rest/v1/rpc/marketplace_catalog',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{...listing,avatar_path:null}])}));
 await page.goto('/');
 const card=page.locator('.v39-talent-card');
 await expect(card).toBeVisible();
 await expect(card.locator('.v41-card-avatar-img')).toHaveCount(0);
 await expect(card.locator('.v39-person-avatar')).toHaveText('Q');
});
