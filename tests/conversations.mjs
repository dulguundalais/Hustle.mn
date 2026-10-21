import {test} from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('lib/marketplace/conversations.ts');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {threadMessages,conversationPeer,normalizedMessage,appendUniqueMessage}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const messages=[
{id:'1',sender_id:'buyer',recipient_id:'seller',body:'Hi',created_at:'2026-10-21T01:00:00Z'},
{id:'2',sender_id:'other',recipient_id:'seller',body:'PRIVATE',created_at:'2026-10-21T02:00:00Z'},
{id:'3',sender_id:'seller',recipient_id:'buyer',body:'Hello',created_at:'2026-10-21T03:00:00Z'}
];
test('conversations show only the selected two participants',()=>{
 assert.deepEqual(threadMessages(messages,'buyer','seller').map(m=>m.id),['1','3']);
 assert.deepEqual(threadMessages(messages,'buyer','other'),[]);
 assert.equal(conversationPeer(messages[0],'buyer'),'seller');
 assert.equal(conversationPeer(messages[1],'buyer'),null);
});
test('message input trims and enforces the database limit',()=>{
 assert.equal(normalizedMessage('  Hi  '),'Hi');
 assert.equal(normalizedMessage('  '),null);
 assert.equal(normalizedMessage('x'.repeat(4001)),null);
});
test('same realtime or fetch message cannot duplicate the timeline',()=>{
 assert.equal(appendUniqueMessage(messages,messages[0]).length,3);
 assert.equal(appendUniqueMessage(messages,{...messages[0],id:'4'}).length,4);
});
test('workspace exposes messaging while preserving order actions',()=>{
 const ui=read('components/workspace.tsx');
 assert.match(ui,/tab==='messages'/);
 assert.match(ui,/from\('messages'\)\.insert/);
 assert.match(ui,/threadMessages\(messages,uid,chatPeer\)/);
 assert.match(ui,/onClick=\{\(\)=>openChat\(o\.buyer_id===uid\?o\.seller_id:o\.buyer_id\)\}/);
});
