import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const sql=read('supabase/migrations/20261023120000_v33_project_requests.sql');
const buyer=read('components/project-matching.tsx');
const finder=read('components/solution-finder.tsx');
test('V33 matches only approved opted-in sellers with actual published category services',()=>{
 assert.match(sql,/p\.accepting_projects=true/);
 assert.match(sql,/p\.public_profile=true/);
 assert.match(sql,/s\.status='published'/);
 assert.match(sql,/s\.category=p_category/);
 assert.match(sql,/b\.enabled=true/);
 assert.match(sql,/s\.seller_id<>v_buyer/);
 assert.match(sql,/limit 5/);
 assert.match(sql,/create_project_request/);
 assert.match(buyer,/up to five matching opt-in freelancers/);
});
test('V33 forbids anonymous table writes and enables RLS on every new relation',()=>{
 for(const t of ['project_requests','project_invitations','project_proposals']){
  assert.match(sql,new RegExp('alter table public\\.'+t+' enable row level security'));
 }
 assert.match(sql,/revoke all on public\.project_requests,public\.project_invitations,public\.project_proposals from anon,authenticated/);
 assert.match(sql,/grant select on public\.project_requests,public\.project_invitations,public\.project_proposals to authenticated/);
 assert.match(sql,/security definer set search_path=''/);
 assert.match(sql,/revoke execute on function public\.create_project_request/);
 assert.match(sql,/grant execute on function public\.award_project_proposal/);
});
test('award verifies buyer, locked request, proposal, and immutable original package price',()=>{
 assert.match(sql,/for update of r/);
 assert.match(sql,/v_request\.buyer_id<>auth\.uid\(\)/);
 assert.match(sql,/v_pkg\.price<>v_proposal\.quoted_price/);
 assert.match(sql,/v_pkg\.delivery_days<>v_proposal\.delivery_days/);
 assert.match(sql,/insert into public\.orders/);
 assert.match(sql,/update public\.project_requests set status='awarded'/);
 assert.match(sql,/update public\.project_proposals set status=case when id=p_proposal_id then 'accepted' else 'declined' end/);
});
test('public Finder retains direct hiring and adds user-consent project dispatch',()=>{
 assert.match(finder,/\/listing\/\?id=/);
 assert.match(finder,/\/project-requests\/\?/);
 assert.match(buyer,/db\.rpc\('create_project_request'/);
 assert.match(buyer,/db\.rpc\('submit_project_proposal'/);
 assert.match(buyer,/db\.rpc\('award_project_proposal'/);
 assert.match(buyer,/db\.rpc\('decline_project_invitation'/);
 assert.match(buyer,/db\.rpc\('cancel_project_request'/);
 assert.match(buyer,/accepting_projects/);
});
test('project creation requires a single explicit Send action, not page-load broadcasts',()=>{
 assert.match(buyer,/onSubmit=\{submitRequest\}/);
 assert.match(buyer,/const submitRequest=\(event:FormEvent\)/);
 assert.match(sql,/Daily project request limit reached/);
 assert.match(sql,/v_request\.buyer_id<>auth\.uid\(\)/);
});
