import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync('lib/marketplace/ux-flows.ts','utf8');
const commonJS=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
new Function('exports','module',commonJS)(mod.exports,mod);
const {safePostLoginPath,signInWithReturn,projectDraftKey,proposalDraftKey}=mod.exports;

test('return path: only local, eligible marketplace pages',()=>{
 assert.equal(safePostLoginPath('/explore/?q=branding'),'/explore/?q=branding');
 assert.equal(safePostLoginPath('/project-requests/?q=We%20need%20design'),'/project-requests/?q=We%20need%20design');
 assert.equal(safePostLoginPath('/listing/?id=test'),'/listing/?id=test');
 assert.equal(safePostLoginPath('/explore'),'/explore/');
 assert.equal(safePostLoginPath('/'),'/');
 for(const path of ['https://evil.example/','//evil.example','/\\evil.example','/%2F%2Fevil.example','/login/','/auth/reset/','/admin/','javascript:alert(1)','/unknown/',''])assert.equal(safePostLoginPath(path),null,'must reject '+path);
 assert.equal(safePostLoginPath('/explore/?q='+('a'.repeat(2001))),null);
 const login=signInWithReturn('/explore/?q=branding');
 assert.equal(new URL(login,'https://hustle.local').searchParams.get('next'),'/explore/?q=branding');
 assert.equal(new URL(signInWithReturn('//evil.example'),'https://hustle.local').searchParams.has('next'),false);
});

test('draft identifiers are distinct for each account and invitation',()=>{
 assert.notEqual(projectDraftKey('buyer-A'),projectDraftKey('buyer-B'));
 assert.notEqual(proposalDraftKey('seller-A','invite-1'),proposalDraftKey('seller-A','invite-2'));
 assert.notEqual(proposalDraftKey('seller-A','invite-1'),proposalDraftKey('seller-B','invite-1'));
});
test('forms save only in tab storage and clear submitted content',()=>{
 const ui=readFileSync('components/project-matching.tsx','utf8');
 assert.match(ui,/sessionStorage\.getItem\(projectDraftKey\(user\)\)/);
 assert.match(ui,/sessionStorage\.setItem\(key,JSON\.stringify\(\{title,brief,audience,category,budget,days\}\)\)/);
 assert.match(ui,/sessionStorage\.removeItem\(projectDraftKey\(user\)\)/);
 assert.match(ui,/sessionStorage\.getItem\(proposalDraftKey\(user,invitation\.id\)\)/);
 assert.match(ui,/sessionStorage\.removeItem\(proposalDraftKey\(user,targetInvite\.id\)\)/);
 assert.match(ui,/window\.confirm\(t\('/);
 assert.doesNotMatch(ui,/localStorage\.setItem\(projectDraftKey/);
});
