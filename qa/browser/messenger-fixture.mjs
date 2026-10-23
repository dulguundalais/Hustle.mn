export const buyer='10000000-0000-4000-8000-000000000001',seller='10000000-0000-4000-8000-000000000002';
const account={id:buyer,aud:'authenticated',email:'buyer@example.test',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},identities:[],created_at:'2026-10-21T10:00:00Z'};
const profile=(id,name,is_seller)=>({id,display_name:name,headline:'Professional',bio:'Test profile',is_seller,slug:is_seller?'qa-seller':null,public_profile:is_seller});
const listing={id:'20000000-0000-4000-8000-000000000001',seller_id:seller,title:'Brand design QA',title_en:'Brand design',description:'Creative brand identity',category:'design',price:100000,delivery_days:7,revisions:2,package_name:'Basic',status:'published'};
const messages=[{id:'30000000-0000-4000-8000-000000000001',sender_id:seller,recipient_id:buyer,body:'Hello QA buyer',created_at:'2026-10-21T12:00:00Z',read_at:null}];
const order={id:'40000000-0000-4000-8000-000000000001',buyer_id:buyer,seller_id:seller,service_id:listing.id,service_title:listing.title,quoted_price:100000,brief:'Please design a full logo and brand system for our restaurant.',status:'in_progress',delivery_note:'',created_at:'2026-10-21T11:00:00Z',package_name:'Basic',delivery_days:7,revision_limit:2,revisions_used:0,revision_note:''};
const jwt=['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',Buffer.from(JSON.stringify({sub:buyer,role:'authenticated',email:account.email,exp:1950000000})).toString('base64url'),'dummy-signature'].join('.');
export async function mockMessenger(page){
 await page.route('**/api/config',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({url:'https://mock-messenger.invalid',key:'public-test-key'})}));
 await page.route('https://mock-messenger.invalid/**',async r=>{
 const req=r.request(),path=new URL(req.url()).pathname,method=req.method();let data=[];
 if(path.includes('/auth/v1/token'))data={access_token:jwt,token_type:'bearer',expires_in:3600,refresh_token:'test-refresh',user:account};
 else if(path==='/auth/v1/user')data=account;
 else if(path==='/rest/v1/beta_allowlist')data={role:'member'};
 else if(path==='/rest/v1/profiles'){const idFilter=new URL(req.url()).searchParams.get('id');const profiles=[profile(buyer,'QA Buyer',false),profile(seller,'QA Seller',true)];data=idFilter?.startsWith('eq.')?profiles.filter(p=>p.id===idFilter.slice(3)):profiles;}
 else if(path==='/rest/v1/services')data=[listing];
 else if(path==='/rest/v1/service_packages'||path==='/rest/v1/reviews'||path==='/rest/v1/portfolio_items'||path==='/rest/v1/referrals'||path==='/rest/v1/chat_attachments'||path==='/rest/v1/messenger_presence')data=[];
 else if(path==='/rest/v1/orders')data=[order];
 else if(path==='/rest/v1/messages'){if(method==='POST')data={id:'30000000-0000-4000-8000-000000000003',sender_id:buyer,recipient_id:seller,body:'QA message',created_at:'2026-10-21T12:10:00Z',read_at:null};else if(method==='PATCH')data=[];else data=messages;}
 else if(path==='/rest/v1/business_rules')data={id:true,commission_percent:10,partner_percent:1,active_partner_percent:2,attribution_days:30,reward_months:12};
 else if(path==='/rest/v1/partner_codes')data=null;
 else if(path==='/rest/v1/rpc/seller_average_response')data={samples:5,average_minutes:25};
 else if(path.startsWith('/storage/v1/object/'))data={Key:'qa-file'};
 await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
}
