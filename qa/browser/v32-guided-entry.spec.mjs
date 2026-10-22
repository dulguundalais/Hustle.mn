import {test,expect} from '@playwright/test';
import {mock} from './support.mjs';
test.beforeEach(async({page})=>mock(page));

test('Business → AI goal → project details → solutions → real Finder',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.guided-entry-choices button')).toHaveCount(2);
 await page.locator('.guided-entry-business').click();
 const dialog=page.getByRole('dialog');
 await expect(dialog).toBeVisible();
 await expect(dialog.locator('.guided-goal')).toHaveCount(6);
 await dialog.locator('.guided-goal').filter({hasText:'AI & процесс автоматжуулах'}).click();
 await dialog.locator('.guided-modal-footer button.guided-next').click();
 await expect(dialog.locator('#guided-need')).toBeVisible();
 await dialog.locator('#guided-need').fill('Манай бизнесийн давтагддаг ажлыг автоматжуулж, CRM-тэй холбох хэрэгтэй байна');
 await dialog.locator('#guided-industry').selectOption('restaurant');
 await dialog.locator('#guided-budget').fill('500,000 ₮');
 await dialog.locator('#guided-timeline').fill('2 долоо хоног');
 await dialog.locator('.guided-modal-footer button.guided-next').click();
 await expect(dialog.locator('.guided-recommendation')).toHaveCount(3);
 await expect(dialog.locator('.guided-modal-body h2')).toContainText('автоматжуулах');
 await dialog.locator('.guided-brief-toggle').click();
 await expect(dialog.locator('.guided-brief-exposed')).toContainText('500,000 ₮');
 await expect(dialog.locator('.guided-brief-exposed')).toContainText('Ресторан');
 await dialog.locator('.guided-modal-footer a.guided-next').click();
 await expect(page).toHaveURL(/\/solutions\/\?/);
 await expect(page.locator('.finder-brief-preview')).toContainText('CRM');
 await expect(page.locator('.finder-brief-preview')).toContainText('2 долоо хоног');
 await expect(page.locator('.finder-audience button[aria-pressed=true]')).toContainText('Бизнес');
});

test('personal choice gives a different path and can close/reopen without signup',async({page})=>{
 await page.goto('/');
 const first=page.locator('.guided-entry-choice').first();
 await first.focus();
 await first.click();
 let dialog=page.getByRole('dialog');
 await expect(dialog.locator('.guided-goal')).toHaveCount(6);
 await expect(dialog.locator('.guided-goal').first()).toContainText('Дизайн');
 await page.keyboard.press('Escape');
 await expect(dialog).toHaveCount(0);
 await expect(first).toBeFocused();
 await first.click();
 dialog=page.getByRole('dialog');
 await dialog.locator('.guided-modal-footer button.guided-next').click();
 await dialog.locator('.guided-modal-footer button.guided-next').click();
 await expect(dialog.locator('.guided-recommendation')).toHaveCount(3);
 await dialog.locator('a.guided-next').click();
 await expect(page).toHaveURL(/audience=personal/);
 await expect(page.locator('.finder-brief-preview')).toContainText('Хувь хүн');
});

test('language toggle keeps English directions with keyboard-operable dialog',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Англи хэл сонгох'}).click();
 await page.locator('.guided-entry-business').click();
 const dialog=page.getByRole('dialog');
 await expect(dialog.getByRole('heading',{name:'What would you like to improve?'})).toBeVisible();
 await dialog.locator('.guided-modal-footer button.guided-next').click();
 await expect(dialog.getByRole('heading',{name:'Tell us about your challenge'})).toBeVisible();
 await expect(dialog.locator('#guided-budget')).toBeVisible();
});

for(const width of [360,390,768,1280]){
 test('responsive premium personal/business gateway '+width,async({page})=>{
  await page.setViewportSize({width,height:850});
  await page.goto('/');
  await expect(page.locator('.guided-entry-choices')).toBeVisible();
  const viewport=await page.evaluate(()=>document.documentElement.scrollWidth);
  expect(viewport).toBeLessThanOrEqual(width+4);
  await page.locator('.guided-entry-business').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const dWidth=await page.locator('.guided-modal').evaluate(n=>n.getBoundingClientRect().width);
  expect(dWidth).toBeLessThanOrEqual(width+2);
  await page.screenshot({path:'test-results/v32-journey-'+width+'.png',fullPage:false});
 });
}
