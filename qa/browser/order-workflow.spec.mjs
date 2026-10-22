import {test,expect} from '@playwright/test';
import {buyerId,sellerId,serviceId,makeOrderState,mockOrderFlow} from './order-flow-fixture.mjs';

const brief='Please create a complete brand identity for our restaurant, with a new logo and professional guidelines.';
const signIn=async(page,role)=>{
 await page.locator('#hustle-auth-email').fill(role+'@example.test');
 await page.locator('#hustle-auth-password').fill('QaOnlyPassword123!');
 await page.locator('.hustle-auth-submit').click();
 await expect(page.locator('.workspace-main')).toBeVisible();
};
test('Buyer chooses Premium, Seller delivers, Buyer completes and publishes verified review',async({browser})=>{
 const state=makeOrderState();
 const buyerCtx=await browser.newContext({viewport:{width:1440,height:900}});
 const sellerCtx=await browser.newContext({viewport:{width:1280,height:900}});
 const buyer=await buyerCtx.newPage(),seller=await sellerCtx.newPage();
 try{
  await mockOrderFlow(buyer,state,'buyer');
  await mockOrderFlow(seller,state,'seller');
  await buyer.goto('/listing/?id='+serviceId);
  await expect(buyer.getByRole('heading',{name:'Professional brand identity'})).toBeVisible();
  await buyer.locator('.v28-detail-tiers button',{hasText:'Premium'}).click();
  await expect(buyer.locator('.v28-detail-price')).toContainText('350,000');
  await buyer.locator('.v28-detail-primary').click();
  await signIn(buyer,'buyer');
  await expect(buyer.locator('.live-detail')).toBeVisible();
  await expect(buyer.locator('.package-picker-head')).toContainText('350,000');
  await buyer.locator('textarea[name="brief"]').fill(brief);
  await buyer.getByRole('button',{name:/Захиалгын хүсэлт илгээх|Request this service/}).click();
  await expect(buyer.locator('.order-card .status-requested')).toBeVisible();
  expect(state.orders).toHaveLength(1);
  expect(state.orders[0]).toMatchObject({buyer_id:buyerId,seller_id:sellerId,package_name:'Premium',quoted_price:350000,delivery_days:12,revision_limit:3,status:'requested'});

  await seller.goto('/seller-studio/');
  await signIn(seller,'seller');
  await seller.getByRole('button',{name:/Ирсэн захиалга|Incoming orders/}).first().click();
  await expect(seller.locator('.order-card .status-requested')).toBeVisible();
  await seller.getByRole('button',{name:/Зөвшөөрөх|Accept/}).click();
  await expect(seller.locator('.order-card .status-accepted')).toBeVisible();
  await seller.getByRole('button',{name:/Ажил эхлэх|Start work/}).click();
  await expect(seller.locator('.order-card .status-in_progress')).toBeVisible();
  await seller.locator('textarea[name="note"]').fill('Final logo and full brand guidelines are delivered in the agreed private project folder.');
  await seller.getByRole('button',{name:/Хүлээлгэн өгөх|Deliver work/}).click();
  await expect(seller.locator('.order-card .status-delivered')).toBeVisible();

  // Fresh reload reads the server-side state rather than retaining a stale local card.
  await buyer.goto('/buyer/');
  await expect(buyer.locator('.workspace-main')).toBeVisible();
  await buyer.getByRole('button',{name:/Миний захиалгууд|My orders/}).first().click();
  await expect(buyer.locator('.order-card .status-delivered')).toBeVisible();
  await buyer.getByRole('button',{name:/Хүлээн авч дуусгах|Accept delivery/}).click();
  await expect(buyer.locator('.order-card .status-completed')).toBeVisible();
  await buyer.locator('.review-composer textarea').fill('Excellent brand identity and clear communication from the freelancer.');
  await buyer.getByRole('button',{name:/Үнэлгээ нийтлэх|Publish review/}).click();
  await expect(buyer.locator('.review-existing')).toBeVisible();
  expect(state.reviews).toHaveLength(1);
  expect(state.orders[0].status).toBe('completed');
  expect(state.audit.map(x=>x.status).filter(Boolean)).toEqual(['requested','accepted','in_progress','delivered','completed']);
  await buyer.screenshot({path:'test-results/v29-buyer-completed.png',fullPage:true});
  await seller.goto('/seller-studio/');
  await seller.getByRole('button',{name:/Ирсэн захиалга|Incoming orders/}).first().click();
  await expect(seller.locator('.seller-review-note')).toContainText('Excellent brand identity');
 }finally{await buyerCtx.close();await sellerCtx.close();}
});

test('Unrelated beta user cannot view buyer or seller orders',async({page})=>{
 const state=makeOrderState();
 state.orders.push({id:'40000000-0000-4000-8000-000000000011',buyer_id:buyerId,seller_id:sellerId,service_id:serviceId,
   service_title:'Private buyer project',quoted_price:350000,brief,status:'in_progress',package_name:'Premium',
   delivery_days:12,revision_limit:3,revisions_used:0,revision_note:'',delivery_note:'',created_at:new Date().toISOString()});
 await mockOrderFlow(page,state,'outsider');
 await page.goto('/buyer/');
 await signIn(page,'outsider');
 await page.getByRole('button',{name:/Миний захиалгууд|My orders/}).first().click();
 await expect(page.locator('.order-card')).toHaveCount(0);
 await expect(page.getByText('Private buyer project')).toHaveCount(0);
});

for(const width of [390,768]){
 test('Mobile/tablet live service detail supports package selection '+width,async({page})=>{
  await page.setViewportSize({width,height:844});
  await mockOrderFlow(page,makeOrderState(),'buyer');
  await page.goto('/listing/?id='+serviceId);
  await expect(page.locator('.v28-detail-offer')).toBeVisible();
  await page.locator('.v28-detail-tiers button',{hasText:'Standard'}).click();
  await expect(page.locator('.v28-detail-price')).toContainText('220,000');
  await expect(page.locator('.v28-detail-primary')).toHaveAttribute('href',/tier=Standard/);
  const scrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(width+4);
  await page.screenshot({path:'test-results/v29-detail-'+width+'.png',fullPage:true});
 });
}
