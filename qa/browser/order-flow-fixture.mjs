// Isolated, deterministic browser fixture. Never uses actual beta accounts, keys,
// email or payments. The mock enforces the same actor-facing order constraints
// that the live Postgres triggers/RLS enforce; it is NOT a replacement for SQL QA.
export const buyerId='10000000-0000-4000-8000-000000000001';
export const sellerId='10000000-0000-4000-8000-000000000002';
export const outsiderId='10000000-0000-4000-8000-000000000003';
export const serviceId='20000000-0000-4000-8000-000000000001';
const email={buyer:'buyer@example.test',seller:'seller@example.test',outsider:'outsider@example.test'};
const ids={buyer:buyerId,seller:sellerId,outsider:outsiderId};
const listing={id:serviceId,seller_id:sellerId,title:'Professional brand identity',title_en:'Professional brand identity',description:'A complete custom brand identity and logo design package.',category:'design',price:100000,delivery_days:5,revisions:1,package_name:'Basic',status:'published'};
const packages=[
 {service_id:serviceId,tier:'Basic',name:'Basic',summary:'Logo concepts',price:100000,delivery_days:5,revisions:1,includes:['Logo']},
 {service_id:serviceId,tier:'Standard',name:'Standard',summary:'Brand palette',price:220000,delivery_days:8,revisions:2,includes:['Logo','Palette']},
 {service_id:serviceId,tier:'Premium',name:'Premium',summary:'Full guidelines',price:350000,delivery_days:12,revisions:3,includes:['Logo','Palette','Brand guide']}
];
const profile=(id,name,is_seller,slug)=>({id,display_name:name,headline:'QA professional',bio:'Professional QA fixture only.',is_seller,slug,public_profile:is_seller});
const profiles=[profile(buyerId,'QA Buyer',false,null),profile(sellerId,'QA Seller',true,'qa-seller'),profile(outsiderId,'QA Outsider',false,null)];
export function makeOrderState(){return {orders:[],reviews:[],audit:[],nextOrder:1};}
function account(role){return {id:ids[role],aud:'authenticated',email:email[role],role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},identities:[],created_at:'2026-10-22T02:00:00Z'};}
function token(role){return ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',Buffer.from(JSON.stringify({sub:ids[role],email:email[role],role:'authenticated',exp:1950000000})).toString('base64url'),'qa-only'].join('.');}
const validTransition={requested:{accepted:'seller',rejected:'seller',cancelled:'buyer'},accepted:{in_progress:'seller'},in_progress:{delivered:'seller'},delivered:{completed:'buyer',in_progress:'buyer'}};
export async function mockOrderFlow(page,state,role){
 const me=ids[role],user=account(role);
 const respond=(route,data,status=200)=>route.fulfill({status,contentType:'application/json',headers:{'cache-control':'no-store'},body:JSON.stringify(data)});
 await page.route('**/api/config',route=>respond(route,{url:'https://qa-order.invalid',key:'test-publishable-only'}));
 await page.route('https://qa-order.invalid/**',async route=>{
   const req=route.request(),url=new URL(req.url()),path=url.pathname,method=req.method();
   const raw=req.postData()||'';
   let body={};try{body=JSON.parse(raw)}catch{}
   if(path==='/auth/v1/token'){
     if(body.email!==email[role])return respond(route,{code:'invalid_credentials',msg:'Unknown test user'},400);
     return respond(route,{access_token:token(role),token_type:'bearer',expires_in:3600,refresh_token:'test-refresh',user});
   }
   if(path==='/auth/v1/user')return respond(route,user);
   if(path==='/rest/v1/beta_allowlist')return respond(route,{role:'member'});
   if(path==='/rest/v1/rpc/marketplace_catalog')return respond(route,[{...listing,display_name:'QA Seller',headline:'QA professional',slug:'qa-seller',packages}]);
   if(path==='/rest/v1/profiles')return respond(route,profiles);
   if(path==='/rest/v1/services')return respond(route,[listing]);
   if(path==='/rest/v1/service_packages')return respond(route,packages);
   if(path==='/rest/v1/business_rules')return respond(route,{id:true,commission_percent:10,partner_percent:1,active_partner_percent:2,attribution_days:30,reward_months:12});
   if(path==='/rest/v1/partner_codes')return respond(route,null);
   if(['/rest/v1/referrals','/rest/v1/portfolio_items','/rest/v1/chat_attachments','/rest/v1/messenger_presence','/rest/v1/messages'].includes(path))return respond(route,[]);
   if(path==='/rest/v1/reviews'){
     if(method==='GET')return respond(route,state.reviews.filter(r=>r.buyer_id===me||r.seller_id===me));
     if(method==='POST'){
       const order=state.orders.find(o=>o.id===body.order_id);
       if(me!==buyerId||!order||order.status!=='completed'||state.reviews.some(r=>r.order_id===order.id))
         return respond(route,{code:'42501',message:'Only buyer of a completed order may review once'},403);
       const review={...body,created_at:new Date().toISOString()};
       state.reviews.push(review);state.audit.push({event:'review',actor:role});
       return respond(route,{order_id:review.order_id},201);
     }
   }
   if(path==='/rest/v1/orders'){
     if(method==='GET')return respond(route,state.orders.filter(o=>o.buyer_id===me||o.seller_id===me));
     if(method==='POST'){
       if(me!==buyerId||body.seller_id===me||body.service_id!==serviceId||!packages.some(p=>p.tier===body.package_name)||String(body.brief||'').trim().length<20)
         return respond(route,{code:'42501',message:'Order request denied'},403);
       const picked=packages.find(p=>p.tier===body.package_name);
       const order={id:'40000000-0000-4000-8000-'+String(state.nextOrder++).padStart(12,'0'),buyer_id:buyerId,seller_id:sellerId,
         service_id:serviceId,service_title:listing.title,quoted_price:picked.price,package_name:picked.tier,
         delivery_days:picked.delivery_days,revision_limit:picked.revisions,revisions_used:0,revision_note:'',
         brief:body.brief,status:'requested',delivery_note:'',created_at:new Date().toISOString()};
       state.orders.push(order);state.audit.push({event:'create',actor:role,status:'requested'});
       return respond(route,{id:order.id},201);
     }
     if(method==='PATCH'){
       const id=url.searchParams.get('id')?.replace(/^eq\./,'');
       const order=state.orders.find(o=>o.id===id);
       const actor=me===buyerId?'buyer':me===sellerId?'seller':'outsider';
       if(!order||validTransition[order.status]?.[body.status]!==actor)
         return respond(route,{code:'42501',message:'Invalid order transition'},403);
       if(body.status==='delivered'&&String(body.delivery_note||'').trim().length<10)return respond(route,{code:'23514',message:'Delivery note required'},400);
       if(body.status==='in_progress'&&actor==='buyer'&&(order.revisions_used>=order.revision_limit||String(body.revision_note||'').trim().length<10))
         return respond(route,{code:'23514',message:'Revision denied'},400);
       if(actor==='buyer'&&body.status==='in_progress')order.revisions_used++;
       Object.assign(order,{status:body.status,...(body.delivery_note!==undefined?{delivery_note:body.delivery_note}:{}),...(body.revision_note!==undefined?{revision_note:body.revision_note}:{})});
       state.audit.push({event:'transition',actor,status:body.status});
       return respond(route,{id:order.id});
     }
   }
   if(path==='/rest/v1/rpc/seller_average_response')return respond(route,{samples:0,average_minutes:null});
   if(path.startsWith('/storage/v1/'))return respond(route,{Key:'qa-placeholder'});
   return respond(route,[]);
 });
}
