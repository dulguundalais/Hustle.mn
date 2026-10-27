import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

// Read-only inventory. Literals used as identifiers are deliberately not translated.
const rows=[];
function walk(dir){for(const name of fs.readdirSync(dir)){const file=path.join(dir,name);if(fs.statSync(file).isDirectory())walk(file);else if(/\.tsx?$/.test(file)){
 const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 function visit(node){
  const line=source.getLineAndCharacterOfPosition(node.getStart()).line+1;
  if(ts.isJsxText(node)&&node.text.trim()&&/[A-Za-zА-Яа-яӨөҮү]/.test(node.text))rows.push({file:file.replaceAll('\\','/'),line,kind:'jsx-text',text:node.text.trim()});
  if(ts.isJsxAttribute(node)&&['placeholder','title','aria-label','alt'].includes(node.name.getText(source))&&node.initializer&&ts.isStringLiteral(node.initializer)&&/[A-Za-zА-Яа-яӨөҮү]/.test(node.initializer.text))rows.push({file:file.replaceAll('\\','/'),line,kind:node.name.getText(source),text:node.initializer.text});
  if(ts.isCallExpression(node)&&node.expression.getText(source)==='t'&&node.arguments.length===2&&ts.isStringLiteral(node.arguments[0])&&/[A-Za-z]/.test(node.arguments[0].text))rows.push({file:file.replaceAll('\\','/'),line,kind:'mixed-mn',text:node.arguments[0].text});
  ts.forEachChild(node,visit);
 }visit(source);
}}}
for(const dir of ['components','app','lib'])walk(dir);
console.log(JSON.stringify(rows,null,2));
