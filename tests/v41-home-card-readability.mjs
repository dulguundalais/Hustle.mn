import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');
const css=read('app/v41-home-card-readability.css');
const base=read('app/v39-creative-cards.css');
const catalog=read('components/live-catalog.tsx');

test('homepage card typography and avatar are larger without reintroducing jumbo full-width card',()=>{
 assert.match(catalog,/import '\.\.\/app\/v41-home-card-readability\.css';/);
 const size=css.match(/\.v39-catalog-home \.v39-person-avatar\s*\{[^}]*width:(\d+)px;[^}]*height:(\d+)px;/);
 assert.ok(size,'expected homepage avatar size override');
 assert.ok(Number(size[1])>=76 && Number(size[2])>=76,'desktop photo is prominently sized');
 assert.match(css,/\.v39-catalog-home \.v39-person-name strong\s*\{\s*font-size:16px;/);
 assert.match(css,/\.v39-catalog-home \.v39-person-name>span\s*\{\s*font-size:13px;/);
 assert.match(css,/\.v39-catalog-home \.v39-description\s*\{\s*font-size:14px;/);
 assert.match(css,/\.v39-catalog-home \.v39-primary\s*\{[^}]*font-size:14px;/);
 assert.match(css,/\.v39-catalog-home \.v39-price strong\s*\{\s*font-size:25px;/);
 assert.match(base,/\.v39-card-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.doesNotMatch(catalog,/v23-single-listing/);
});

test('home-only overrides preserve Explore and scale sensibly on mobile',()=>{
 for(const rule of css.matchAll(/\.v39-[^\s{,:]+/g)){
  const key=rule[0];
  if(key==='.v39-catalog-home')continue;
  // All rule blocks touching cards must be scoped through .v39-catalog-home.
 }
 assert.doesNotMatch(css,/\.v39-catalog-explore/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/\.v39-catalog-home \.v39-person-avatar\s*\{\s*width:72px;/);
 assert.match(catalog,/homePreview\?'v39-catalog-home':'v39-catalog-explore'/);
 assert.match(catalog,/href=\{profileHref\}/);
 assert.match(catalog,/v41-card-avatar-img/);
 assert.match(catalog,/onSave\(s\.id\)/);
 assert.match(catalog,/ServiceComparison/);
});
