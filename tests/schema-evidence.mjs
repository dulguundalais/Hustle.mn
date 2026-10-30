import {test} from 'node:test';
import assert from 'node:assert/strict';
import {schemaDifferences} from '../scripts/compare-schema-evidence.mjs';

test('schema comparison ignores key order but detects privilege and function drift',()=>{
 const a={'grant:requests.authenticated.SELECT':true,'function:award':{definition_md5:'baseline',security_definer:true}};
 const reordered={'function:award':{security_definer:true,definition_md5:'baseline'},'grant:requests.authenticated.SELECT':true};
 assert.deepEqual(schemaDifferences(a,reordered),[]);
 const b=structuredClone(a);b['function:award'].definition_md5='modified';b['grant:requests.authenticated.SELECT']=false;
 assert.deepEqual(schemaDifferences(a,b).map(x=>x.key),['function:award','grant:requests.authenticated.SELECT']);
 assert.equal(a['function:award'].definition_md5,'baseline');
});
test('schema comparison reports missing and unexpected schema objects',()=>{
 assert.deepEqual(schemaDifferences({'table:request':{rls:true}},{'table:other':{rls:true}}).map(x=>x.key),['table:other','table:request']);
});
test('schema comparison refuses empty or non-object evidence',()=>{
 assert.throws(()=>schemaDifferences({},{}),/empty/);
 assert.throws(()=>schemaDifferences([],{}),/schema objects/);
 assert.throws(()=>schemaDifferences(null,{}),/schema objects/);
});
