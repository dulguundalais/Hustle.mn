import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';
const git=process.env.GIT_BINARY||'git';
const base=process.argv[2]||'38c00bb83d8632412f9fa2762c0225bf06881f4b';
const files=execFileSync(git,['ls-files','components','lib'],{encoding:'utf8'}).trim().split('\n').filter(p=>/\.tsx?$/.test(p));
function copy(text,file){
 const sf=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS),values=[];
 function visit(n){
  if(ts.isCallExpression(n)&&n.expression.getText(sf)==='t'&&n.arguments.length===2&&ts.isStringLiteral(n.arguments[1]))values.push(n.arguments[1].text);
  if(ts.isPropertyAssignment(n)&&['en','titleEn','descriptionEn','hintEn'].includes(n.name.getText(sf).replaceAll('"','').replaceAll("'",''))&&ts.isStringLiteral(n.initializer))values.push(n.initializer.text);
  if(ts.isArrayLiteralExpression(n)&&n.elements.length>=2&&ts.isStringLiteral(n.elements[0])&&/[А-Яа-яӨөҮү]/.test(n.elements[0].text)&&ts.isStringLiteral(n.elements[1])&&/[A-Za-z]/.test(n.elements[1].text))values.push(n.elements[1].text);
  ts.forEachChild(n,visit);
 }visit(sf);return values;
}
let checked=0;const missing=[];
for(const file of files){let before;try{before=execFileSync(git,['show',base+':'+file],{encoding:'utf8',stdio:['ignore','pipe','ignore']})}catch{continue}
 const old=copy(before,file),now=copy(fs.readFileSync(file,'utf8'),file);checked+=old.length;
 for(const value of old){const i=now.indexOf(value);if(i<0)missing.push({file,value});else now.splice(i,1);}
}
console.log(JSON.stringify({base,checked,missing},null,2));
if(missing.length)process.exitCode=1;
