import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source=readFileSync(new URL('../lib/marketplace/conversations.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {mergeMessagePage,appendUniqueMessage,threadMessages}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const buyer='buyer',seller='seller';
const message=(id,created_at,read_at=null)=>({id,created_at,read_at,sender_id:buyer,recipient_id:seller,body:id});

test('older pages and realtime events merge without duplicate messages',()=>{
 const newest=[message('003','2026-10-22T09:02:00Z'),message('002','2026-10-22T09:01:00Z')];
 const older=[message('001','2026-10-22T09:00:00Z'),message('002','2026-10-22T09:01:00Z')];
 const merged=mergeMessagePage(newest,older);
 assert.deepEqual(merged.map(x=>x.id),['001','002','003']);
 assert.equal(appendUniqueMessage(merged,message('003','2026-10-22T09:02:00Z')).length,3);
});
test('read receipts survive stale polling projections, new receipts refresh',()=>{
 const read=message('001','2026-10-22T09:00:00Z','2026-10-22T09:03:00Z');
 const stale=message('001','2026-10-22T09:00:00Z',null);
 assert.equal(mergeMessagePage([read],[stale])[0].read_at,read.read_at);
 assert.equal(mergeMessagePage([stale],[read])[0].read_at,read.read_at);
});
test('ties sort deterministically and unrelated messages stay out of thread',()=>{
 const a=message('b','2026-10-22T09:00:00Z'),b=message('a','2026-10-22T09:00:00Z');
 const unrelated={...a,id:'c',recipient_id:'other'};
 assert.deepEqual(threadMessages([a,unrelated,b],buyer,seller).map(x=>x.id),['a','b']);
});
test('workspace inbox fetches newest records and exposes older history control',()=>{
 const code=readFileSync(new URL('../components/workspace.tsx',import.meta.url),'utf8');
 assert.match(code,/order\('created_at',\{ascending:false\}\)\.order\('id',\{ascending:false\}\)\.limit\(500\)/);
 assert.match(code,/async function loadOlderMessages\(/);
 assert.match(code,/Load older messages/);
 assert.match(code,/mergeMessagePage\(own,response\.data/);
});
