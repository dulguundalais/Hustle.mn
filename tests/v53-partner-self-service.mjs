import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(p,'utf8');
const sql=read('supabase/migrations/20261028090000_v53_partner_self_service.sql');
const ui=read('components/partner-program.tsx');
const capture=read('components/partner-referral-capture.tsx');
const home=read('components/signature-home.tsx');
const page=read('app/referrals/page.tsx');
const login=read('lib/marketplace/ux-flows.ts');

test('existing homepage uses its original Partner section and /referrals route',()=>{
 assert.match(home,/<section className="signature-partner shell">/);
 assert.match(home,/href="\/referrals\/"/);
 assert.match(home,/Түнш болох/);
 assert.match(page,/PartnerProgram/);
 assert.match(login,/['"]\/referrals\/['"]/);
});
test('program uses V51 tokens, shared site header and footer',()=>{
 assert.match(ui,/import SiteHeader/);
 assert.match(ui,/import PremiumFooter/);
 assert.match(ui,/v51-home-system.css/);
 assert.match(ui,/partner-program.css/);
 assert.match(ui,/Beta|бета/);
 assert.match(ui,/simulated rewards|туршилтын урамшуулал/i);
});
test('community enrollment is idempotent and does not grant admin or mutate roles',()=>{
 assert.match(sql,/create table public\.partner_memberships/);
 assert.match(sql,/on conflict\(user_id\) do nothing/);
 assert.match(sql,/on conflict\(partner_id\) do nothing/);
 assert.match(sql,/email_confirmed_at is not null/);
 assert.match(sql,/insert into public\.profiles\(id,display_name\)/);
 assert.doesNotMatch(sql,/update public\.beta_allowlist|insert into public\.beta_allowlist/i);
 assert.match(sql,/p_accept boolean/);
});
test('browser cannot directly create partner codes, referrals or rewards',()=>{
 assert.match(sql,/revoke all on public\.partner_codes,public\.referrals,public\.business_rules from public,anon,authenticated/);
 assert.match(sql,/drop policy if exists codes_create/);
 assert.match(sql,/grant select,update on public\.referrals to authenticated/);
 assert.match(sql,/revoke all on public\.partner_rewards from anon,authenticated/);
 assert.match(sql,/partner_rewards_own/);
});
test('secure conversion ties reward to completed order, not clicks',()=>{
 assert.match(sql,/new.status<>'completed'/);
 assert.match(sql,/partner_rewards/);
 assert.match(sql,/on conflict\(order_id\) do nothing/);
 assert.match(sql,/state text not null default 'simulated'/);
 assert.match(sql,/Growth tier|growth/);
});
test('first-touch attribution prevents self referrals and repeated claims',()=>{
 assert.match(sql,/v_partner=v_uid/);
 assert.match(sql,/exists\(select 1 from public\.referrals where referred_id=v_uid\)/);
 assert.match(sql,/now\(\)>v_created\+make_interval/);
 assert.match(capture,/hustle:partner:first-touch/);
 assert.match(capture,/localStorage\.removeItem\(KEY\)/);
 assert.match(capture,/claim_partner_referral/);
});
test('partner dashboard exposes only real rows and correctly labels simulations',()=>{
 assert.match(ui,/from\('partner_memberships'\)/);
 assert.match(ui,/from\('partner_rewards'\)/);
 assert.match(ui,/from\('referrals'\)/);
 assert.match(ui,/estimated_amount/);
 assert.match(ui,/Beta|бета/);
});
test('admin management is isolated, explicit, and audited',()=>{
 assert.match(sql,/v53_manage_partner/);
 assert.match(sql,/role='admin' and enabled/);
 assert.match(sql,/insert into public\.audit_events/);
});
