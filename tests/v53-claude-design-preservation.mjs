import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const protectedFiles={
 'app/v51-home-system.css':'d614e398889fa3a1912b4ffe57443194ee86f2ea',
 'app/marketplace.css':'bc5e705e9960d5f48c117b1ff5f373fc89710ebc',
 'app/globals.css':'5f3bc376e8c064a2a357f635c952a4d8845acd55',
 'components/premium-marketplace.tsx':'cf7f7a036ba54241e353681ded4e4e85f5c1ffe8',
 'components/signature-home.tsx':'00f7d26696bc0e8f573a8ee6e8c20722627e4317',
 'components/site-header.tsx':'9f3fcf4f702b6869a7f8eced6de16b83413b978f',
 'components/premium-footer.tsx':'d1b0d6e1a064f83666a0f2c38d8ff9c46c77e014',
 'app/v45-art-direction.css':'f65228e41baed92deb82b3038abb58a3566a823a',
 'app/v43-premium-editorial.css':'2d5a883c33460bf6bc732f398b6bc432d7977174',
 'app/v20-footer.css':'9b82c90b965742785aa5455227f6996b28767c6d',
 'app/unified-layout.css':'b3755ad6a07e562e3905261946cceaf07cad4ac7',
 'app/page.tsx':'162498cb83f366d5806335fc4fe92a18d7a2b08a'
};
for(const [path,expected] of Object.entries(protectedFiles)){
 test('Claude V51/V52 protected source unchanged: '+path,()=>{
  const b=readFileSync(new URL('../'+path,import.meta.url));
  const blobSha=createHash('sha1').update('blob '+b.length + String.fromCharCode(0)).update(b).digest('hex');
  assert.equal(blobSha,expected,'Protect Claude original design; changes need owner review');
 });
}
test('Claude homepage is the unchanged V52 baseline rather than a V53 redesign',()=>{
 const source=readFileSync(new URL('../components/signature-home.tsx',import.meta.url),'utf8');
 assert.match(source,/Түншийн мэдээлэл үзэх/);
 assert.doesNotMatch(source,/Become a Partner/);
});
