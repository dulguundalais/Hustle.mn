import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const protectedFiles={
 'app/v51-home-system.css':'d614e398889fa3a1912b4ffe57443194ee86f2ea',
 'app/marketplace.css':'bc5e705e9960d5f48c117b1ff5f373fc89710ebc',
 'app/globals.css':'5f3bc376e8c064a2a357f635c952a4d8845acd55',
 'components/premium-marketplace.tsx':'cf7f7a036ba54241e353681ded4e4e85f5c1ffe8'
};
for(const [path,expected] of Object.entries(protectedFiles)){
 test('Claude V51/V52 protected source unchanged: '+path,()=>{
  const b=readFileSync(new URL('../'+path,import.meta.url));
  const blobSha=createHash('sha1').update('blob '+b.length + String.fromCharCode(0)).update(b).digest('hex');
  assert.equal(blobSha,expected,'Protect Claude original design; changes need owner review');
 });
}
test('Partner CTA is the only allowed homepage story adjustment',()=>{
 const source=readFileSync(new URL('../components/signature-home.tsx',import.meta.url),'utf8');
 const original=source.replace("t('Түнш болох','Become a Partner')","t('Түншийн мэдээлэл үзэх','Explore referrals')");
 const b=Buffer.from(original);
 const hash=createHash('sha1').update('blob '+b.length + String.fromCharCode(0)).update(b).digest('hex');
 assert.equal(hash,'00f7d26696bc0e8f573a8ee6e8c20722627e4317');
});
