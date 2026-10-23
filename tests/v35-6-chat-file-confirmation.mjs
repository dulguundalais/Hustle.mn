import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source=readFileSync('components/workspace.tsx','utf8');
const css=readFileSync('app/messenger-v25.css','utf8');

test('chat file selection stages a local file without invoking upload/RPC',()=>{
 const stage=source.match(/function stageChatFile\(file:File\)\{([\s\S]*?)\n\}/)?.[1];
 assert.ok(stage,'stageChatFile handler must exist');
 assert.match(stage,/validateChatFile\(file\)/);
 assert.match(stage,/setPendingChatFile\(file\)/);
 assert.doesNotMatch(stage,/\.upload\(|\.rpc\(|attachFile\(/);
 assert.match(source,/onChange=\{e=>\{const file=e\.target\.files\?\.\[0\];if\(file\)stageChatFile\(file\)/);
 assert.doesNotMatch(source,/onChange=\{e=>\{const file=e\.target\.files\?\.\[0\];if\(file\)void attachFile\(file\)/);
});

test('the explicit Send handler supports text-only and file-only messages',()=>{
 const send=source.match(/async function sendMessage\(e:FormEvent<HTMLFormElement>\)\{([\s\S]*?)\n\}/)?.[1];
 assert.ok(send,'sendMessage handler must exist');
 assert.match(send,/e\.preventDefault\(\)/);
 assert.match(send,/file=pendingChatFile,recipient=chatPeer/);
 assert.match(send,/\(!body&&!file\)/);
 assert.match(send,/chatLoading\|\|uploading/);
 assert.match(send,/if\(file\)\{\s*await attachFile\(file,recipient\)/);
 assert.match(send,/if\(body\)\{/);
 assert.match(send,/setPendingChatFile\(current=>current===file\?null:current\)/);
 assert.match(source,/disabled=\{chatLoading\|\|uploading\|\|\(!normalizedMessage\(chatDraft\)&&!pendingChatFile\)\}/);
 assert.doesNotMatch(source,/maxLength=\{4000\} required/);
 assert.match(source,/e\.key==='Enter'&&!e\.shiftKey&&!e\.nativeEvent\.isComposing/);
 assert.match(source,/e\.currentTarget\.form\?\.requestSubmit\(\)/);
});

test('draft is removable, reset on peer change and failures do not discard unsent file',()=>{
 assert.match(source,/useEffect\(\(\)=>\{setPendingChatFile\(null\)\},\[uid,chatPeer\]\)/);
 assert.match(source,/onClick=\{\(\)=>setPendingChatFile\(null\)\}/);
 assert.match(source,/v25-attachment-draft/);
 assert.match(css,/\.v25-attachment-draft/);
 assert.match(source,/if\(sent.error\)\{[\s\S]*?remove\(\[path\]\)/);
 assert.match(source,/catch\(err\)\{fail\(err\)\}finally\{setChatLoading\(false\)\}/);
});

test('chat composer remains syntactically valid TSX',()=>{
 const parsed=ts.createSourceFile('workspace.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.equal(parsed.parseDiagnostics.length,0,parsed.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('; '));
});
