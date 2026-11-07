/** Private compiled-Worker runtime with fixture-only local storage. Never use a remote binding. */
import fs from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';
export async function enquiryRuntime(runtimePath,compiledDir,storageDir,assetDir){
 const {Miniflare,convertV4MiniflareOptions}=await import(pathToFileURL(path.resolve(runtimePath)));
 const compiled=path.resolve(compiledDir),root=assetDir?path.resolve(assetDir):null;const outbound=[];
 const types={'.html':'text/html','.json':'application/json','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.txt':'text/plain'};
 async function asset(request){
  if(!root||!['GET','HEAD'].includes(request.method))return new Response('Fixture asset unavailable',{status:404});
  let pathname;try{pathname=decodeURIComponent(new URL(request.url).pathname);}catch{return new Response('Bad path',{status:400});}
  let file=path.resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+path.sep))return new Response('Outside scope',{status:404});
  try{let stat=await fs.lstat(file);if(stat.isSymbolicLink())return new Response('Indirect asset rejected',{status:404});if(stat.isDirectory())file=path.join(file,'index.html');stat=await fs.stat(file);if(!stat.isFile()||stat.size>25*1024*1024)return new Response('Asset limit',{status:413});const bytes=await fs.readFile(file);return new Response(request.method==='HEAD'?null:bytes,{headers:{'content-type':types[path.extname(file)]??'application/octet-stream'}});}catch{return new Response('No local asset',{status:404});}
 }
 const options=convertV4MiniflareOptions({modules:[{type:'ESModule',path:path.join(compiled,'index.js')},...(await fs.readdir(compiled)).filter(n=>n.endsWith('.wasm')).map(n=>({type:'CompiledWasm',path:path.join(compiled,n)}))],modulesRoot:compiled,compatibilityDate:'2026-07-29',host:'127.0.0.1',port:0,kvNamespaces:storageDir?{LEADS:'CSOAI_FIXTURE_ENQUIRIES_V10'}:{},resourcePersistencePath:storageDir?path.resolve(storageDir):undefined,serviceBindings:{ASSETS:asset},outboundService:async request=>{const u=new URL(request.url);outbound.push({method:request.method,origin:u.origin,path:u.pathname});if(['GET','HEAD'].includes(request.method)&&['councilof.ai','csoai.org'].includes(u.hostname)&&!u.pathname.startsWith('/api/'))return asset(request);return new Response('External service blocked in fixture runtime',{status:503});}});
 return {worker:new Miniflare(options),outbound};
}
