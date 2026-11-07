import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {build} from 'esbuild';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'council-panel-check-'));
const env={...process.env};
try{
 for(const [name,input]of [['CORE','packages/council-panel/core.ts'],['ACADEMY','packages/council-panel/academy.ts'],['REGISTRY','functions/mcp/_panel.ts']]){
  const out=path.join(temporary,name.toLowerCase()+'.cjs');await build({entryPoints:[path.join(root,input)],outfile:out,bundle:true,platform:'node',format:'cjs'});env['PANEL_'+name+'_MODULE']=out;
 }
 const test=spawnSync(process.execPath,['--test','packages/council-panel/core.test.cjs','packages/council-panel/academy.test.cjs','packages/council-panel/registry.test.mjs','packages/council-panel/correction.test.mjs'],{cwd:root,env,stdio:'inherit',timeout:60000});
 if(test.error)throw test.error;if(test.status!==0)process.exitCode=test.status||1;
}finally{fs.rmSync(temporary,{recursive:true,force:true});}
