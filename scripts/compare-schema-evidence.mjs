import {readFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';

export function schemaDifferences(expected,actual){
 if(!expected||!actual||Array.isArray(expected)||Array.isArray(actual)
    ||typeof expected!=='object'||typeof actual!=='object')throw new Error('Expected schema objects');
 const keys=[...new Set([...Object.keys(expected),...Object.keys(actual)])].sort();
 if(!keys.length)throw new Error('Refusing an empty schema comparison');
 return keys.filter(key=>!isDeepStrictEqual(expected[key],actual[key])).map(key=>({
  key,expected:expected[key]??null,actual:actual[key]??null
 }));
}
if(process.argv[1]?.endsWith('compare-schema-evidence.mjs')){
 const [expectedPath,actualPath]=process.argv.slice(2);
 if(!expectedPath||!actualPath)throw new Error('Usage: node scripts/compare-schema-evidence.mjs EXPECTED.json ACTUAL.json');
 const expected=JSON.parse(readFileSync(expectedPath,'utf8'));
 const actual=JSON.parse(readFileSync(actualPath,'utf8'));
 const differences=schemaDifferences(expected,actual);
 if(differences.length){
  console.error(JSON.stringify({status:'DIFFERENT',count:differences.length,differences},null,2));
  process.exitCode=1;
 }else console.log(JSON.stringify({status:'MATCH',objects:Object.keys(expected).length}));
}
