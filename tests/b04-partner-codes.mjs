import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workspace=readFileSync(new URL('../components/workspace.tsx',import.meta.url),'utf8');
const sql=readFileSync(new URL('../supabase/migrations/20261031090000_partner_code_visibility.sql',import.meta.url),'utf8');

test('B04: the browser never looks up another partner by code or writes referral attribution',()=>{
 assert.doesNotMatch(workspace,/from\('partner_codes'\)\.select\('partner_id'\)/);
 assert.doesNotMatch(workspace,/from\('referrals'\)\.insert/);
 assert.doesNotMatch(workspace,/eligible_until:/);
 assert.match(workspace,/rpc\('claim_referral',\{p_code:value\.trim\(\)\}\)/);
});

test('B04: partner codes are readable only by their owner or an administrator',()=>{
 assert.match(sql,/create policy codes_read on public\.partner_codes for select to authenticated\s+using\(partner_id=\(select auth\.uid\(\)\) or \(select public\.beta_role\(\)\)='admin'\)/);
 assert.match(sql,/security definer set search_path=''/);
 assert.match(sql,/revoke all on function public\.claim_referral\(text\) from public,anon;/);
 assert.match(sql,/a\.role in \('partner','admin'\)/);
});
