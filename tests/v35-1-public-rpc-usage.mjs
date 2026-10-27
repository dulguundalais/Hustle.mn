import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('supabase/migrations/20261023070324_restore_public_rpc_schema_usage.sql','utf8');
test('public catalog/profile RPC wrappers regain private schema name resolution only',()=>{
 assert.match(source,/grant usage on schema hustle_private to anon, authenticated/i);
 assert.doesNotMatch(source,/grant (all|select|insert|update|delete) on (all )?table/i);
 assert.doesNotMatch(source,/disable row level security/i);
 assert.doesNotMatch(source,/grant execute on all functions/i);
});
