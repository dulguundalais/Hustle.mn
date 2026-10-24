import {test,expect} from '@playwright/test';
import {mock} from './support.mjs';

test.beforeEach(async({page})=>mock(page));

test('published service is a compact seller card, and tier prices live on service detail',async({page})=>{
 await page.goto('/');
 const card=page.locator('.v39-talent-card');
 await expect(card).toBeVisible();
 await expect(card.getByRole('heading',{name:'QA Brand Identity Service'})).toBeVisible();
 const rect=await card.boundingBox();
 const grid=await page.locator('.v39-card-grid').boundingBox();
 expect(rect).toBeTruthy();
 expect(grid).toBeTruthy();
 expect(rect.width).toBeLessThan(grid.width*.65); // no singleton full-width "jumbo" card
 expect(rect.width).toBeGreaterThan(200);
 await expect(card.locator('.v39-price')).toContainText('100,000');
 await expect(card.getByRole('link',{name:/QA Seller/})).toHaveAttribute('href','/p/qa-seller');
 await card.locator('.v39-primary').click();
 await expect(page.locator('.v28-detail-price')).toContainText('100,000');
 await page.getByRole('button',{name:'Standard',exact:true}).click();
 await expect(page.locator('.v28-detail-price')).toContainText('200,000');
 await page.getByRole('button',{name:'Premium',exact:true}).click();
 await expect(page.locator('.v28-detail-price')).toContainText('350,000');
 await page.screenshot({path:'test-results/v40-marketplace-and-detail.png',fullPage:true});
});

for(const width of [360,390,430,768,1024,1440]){
 test('premium listing card fits viewport '+width,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto('/');
  const card=page.locator('.v39-talent-card');
  await expect(card).toBeVisible();
  const rect=await card.boundingBox();
  expect(rect).toBeTruthy();
  expect(rect.width).toBeGreaterThan(width<600?width*.65:190);
  expect(rect.x).toBeGreaterThanOrEqual(-2);
  expect(rect.x+rect.width).toBeLessThan(width+3);
  await page.screenshot({path:'test-results/v40-'+width+'.png',fullPage:true});
 });
}

test('bilingual and dark themes retain genuine public service cards',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Англи хэл сонгох'}).click();
 await expect(page.locator('.v39-talent-card')).toBeVisible();
 await page.getByRole('button',{name:'Toggle color theme'}).click();
 await expect(page.locator('.hustle-v5.night')).toBeVisible();
 await page.screenshot({path:'test-results/v40-dark-en.png',fullPage:true});
});
