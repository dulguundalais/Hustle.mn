import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('public header resolves Supabase persisted auth, profile identity and guest controls',()=>{
 const src=read('components/premium-marketplace.tsx');
 const menu=read('components/account-menu.tsx');
 assert.match(src,/sessionState==='signed-in'/);
 assert.match(src,/auth\.getUser\(\)/);
 assert.match(src,/auth\.onAuthStateChange/);
 assert.match(src,/db\.from\('profiles'\)/);
 assert.match(src,/sessionState==='guest'/);
 assert.match(src,/AccountMenu account=\{account\}/);
 assert.match(menu,/href="\/buyer\/"/);
 assert.match(menu,/href="\/seller-studio\/"/);
 assert.match(menu,/href="\/buyer\/\?tab=profile"/);
 assert.match(menu,/onSignOut/);
});

test('mobile account avatar dropdown, keyboard and outside click',()=>{
 const ui=read('components/account-menu.tsx'),css=read('app/account-menu.css');
 assert.match(ui,/aria-expanded=\{open\}/);
 assert.match(ui,/event\.key==='Escape'/);
 assert.match(ui,/document\.addEventListener\('pointerdown'/);
 assert.match(css,/@media\(max-width:800px\)/);
 assert.match(css,/\.global-account-name,.hustle-v5 \.global-account-chevron\{display:none\}/);
 const src=read('components/premium-marketplace.tsx'),nav=read('app/marketplace.css');
 assert.match(src,/mobile-auth-nav/);
 assert.match(nav,/max-width:800px/);
});

test('logout is explicit, uses the same Supabase client, and only clears UI on success',()=>{
 const src=read('components/premium-marketplace.tsx');
 assert.match(src,/db\.auth\.signOut\(\)/);
 assert.match(src,/if\(error\)throw error/);
 assert.match(src,/setSessionState\('guest'\);setAccount\(null\)/);
 assert.match(src,/<Link className="wordmark" href="\/"/);
 const workspace=read('components/workspace.tsx');
 assert.match(workspace,/async function logout\(/);
 assert.match(workspace,/params\.get\('tab'\)==='profile'/);
});
