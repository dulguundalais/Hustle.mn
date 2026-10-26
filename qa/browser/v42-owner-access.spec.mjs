import {test,expect} from '@playwright/test';
import {mock} from './support.mjs';

test.beforeEach(async({page})=>{await mock(page)});

test('guest cannot access seller-only profile editing',async({page})=>{
 await page.goto('/my-profile/');
 await expect(page.getByRole('main')).toBeVisible();
 await expect(page.getByRole('main').getByRole('link',{name:/Нэвтрэх|Sign in/})).toBeVisible();
 await expect(page.locator('.sp-grid')).toHaveCount(0);
});

test('guest cannot see cover tools or owner portfolio controls',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/my-profile/');
 await expect(page.locator('input[type=file]')).toHaveCount(0);
 await expect(page.locator('.v42-cover-editor')).toHaveCount(0);
 await expect(page.getByRole('main').getByRole('link',{name:/Нэвтрэх|Sign in/})).toBeVisible();
});
