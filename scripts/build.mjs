import {spawnSync} from 'node:child_process';
const args=process.env.CF_PAGES==='1'?['scripts/build-preview.mjs']:['node_modules/next/dist/bin/next','build'];
const result=spawnSync(process.execPath,args,{stdio:'inherit'});process.exit(result.status||0);
