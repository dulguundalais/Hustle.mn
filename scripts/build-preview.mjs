import {cp,mkdir,rm,writeFile,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=process.cwd(),target=path.join(root,'.preview-build');
await rm(target,{recursive:true,force:true});await mkdir(target,{recursive:true});
for(const name of ['app','components','lib','public','next-env.d.ts','tsconfig.json','postcss.config.js','tailwind.config.ts','package.json']){try{await cp(path.join(root,name),path.join(target,name),{recursive:true})}catch(e){if(e.code!=='ENOENT')throw e}}
// Build a disposable, sample-only static preview. Runtime auth remains in the source app.
for(const name of ['api','auth','beta','p'])await rm(path.join(target,'app',name),{recursive:true,force:true});
await writeFile(path.join(target,'next.config.ts'),`export default {output:'export',images:{unoptimized:true},trailingSlash:true,experimental:{cpus:2}};`);
const run=spawnSync(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'build',target],{stdio:'inherit',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
if(run.status!==0)process.exit(run.status||1);
await rm(path.join(root,'out'),{recursive:true,force:true});await cp(path.join(target,'out'),path.join(root,'out'),{recursive:true});
console.log('Static visual preview exported to out; runtime source preserved.');
