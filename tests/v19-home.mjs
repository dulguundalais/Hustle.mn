import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const home=read('components/premium-marketplace.tsx');const story=read('components/signature-home.tsx');const discovery=read('components/v19-discovery.tsx');
test('requested nine homepage sections appear in exact order',()=>{
 const needles=["<header className=\"site-header\"","<SignatureHero en={en}/>","<PopularCategories en={en}/>","<V19FeaturedIntro en={en}/>","<LiveCatalog en={en}","id=\"how\"","id=\"talent\"","id=\"for-freelancers\"","className=\"signature-partner shell\"","className=\"shell footer v19-footer\""];
 const offsets=needles.map((n,i)=>{const s=i<5||i===9?home:story;return s.indexOf(n)});
 assert.ok(offsets.every(i=>i>=0),JSON.stringify(offsets));
 assert.ok(offsets[0]<offsets[1]&&offsets[1]<offsets[2]&&offsets[2]<offsets[3]&&offsets[3]<offsets[4]);
 assert.ok(offsets[5]<offsets[6]&&offsets[6]<offsets[7]&&offsets[7]<offsets[8]);
});
test('homepage categories are actual Explore links, never fake services',()=>{assert.match(discovery,/href=\{'\/explore\/\?category='\+key\}/);assert.match(home,/view==='explore'&&<section className="shell discovery"/);assert.match(home,/view==='home'&&<SignatureStory/);});
test('seller listings retain real catalog and opt-in visibility',()=>{const s=read('components/live-catalog.tsx');assert.match(s,/rpc\('marketplace_catalog'\)/);assert.match(s,/contactSellerHref\(s.slug\)/);assert.doesNotMatch(discovery,/4\.9|12K|escrow-protected/i)});
test('microcopy reduced and UI type has larger base scale',()=>{const css=read('app/v19-home.css');assert.match(css,/font-size:16px/);assert.match(story,/signature-search-subline/);assert.doesNotMatch(story,/signature-popular/);assert.doesNotMatch(story,/signature-trust-strip/)});
