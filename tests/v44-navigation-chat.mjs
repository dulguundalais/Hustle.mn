import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(path,'utf8');
const raw=read('lib/marketplace/contact-routing.ts').replace("import type {Profile} from './types';",'');
const js=ts.transpileModule(raw,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
new Function('exports','module',js)(mod.exports,mod);
const {sellerContactHref}=mod.exports;

test('seller CTA avoids login for authenticated buyer and retains slug for guest',()=>{
 assert.equal(sellerContactHref('creative-studio',true),'/buyer/?seller=creative-studio');
 assert.equal(sellerContactHref('creative-studio',false),'/login/?mode=buyer&seller=creative-studio');
 assert.equal(sellerContactHref('BAD SLUG',true),'/explore/');
 assert.equal(sellerContactHref('../admin',false),'/explore/');
});
test('desktop/mobile account navigation uses seller workspace without removing buyer mode',()=>{
 const menu=read('components/account-menu.tsx');
 const home=read('components/premium-marketplace.tsx')+read('components/site-header.tsx');
 assert.match(menu,/dashboardHref=account.isSeller\?'\/seller-studio\/'\:'\/buyer\/'/);
 assert.match(menu,/account.isSeller&&<Link href="\/buyer\/"/);
 assert.match(home,/<AccountMenu account=\{account\}/);
 assert.match(home,/signedIn=\{sessionState==='signed-in'\}/);
});
test('home and detail chat CTA follow signed-in session, preserve seller handoff',()=>{
 const cards=read('components/live-catalog.tsx'),detail=read('components/live-listing-detail.tsx');
 assert.match(cards,/contactSellerHref\(s.slug,signedIn\)/);
 assert.match(detail,/sellerContactHref\(listing.slug,signedIn\)/);
 assert.match(detail,/auth.getUser\(\)/);
 assert.match(detail,/auth.onAuthStateChange/);
 const workspace=read('components/workspace.tsx');
 assert.match(workspace,/resolveSellerContact\(slug,user.id/);
 assert.match(workspace,/setChatPeer\(contact.sellerId\);setTab\('messages'\)/);
});
