/** GET-only loopback review server. No cloud binding, credential, signature or publication. */
import fs from 'node:fs/promises';import path from 'node:path';import http from 'node:http';import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
const repo=process.cwd(),dist=path.resolve(process.argv[2]??'dist/client'),out=path.resolve(process.argv[3]);
await fs.mkdir(out,{recursive:true});const modulePath=path.join(out,'candidate-handlers.mjs');
await build({entryPoints:[path.join(repo,'scripts/review/candidate-handlers.ts')],outfile:modulePath,bundle:true,format:'esm',platform:'node',target:'node22',logLevel:'warning'});
// A local in-memory Cache API shim, not the Cloudflare cache or an external store.
const localCache=new Map();
const cacheKey=request=>request instanceof Request?request.url:String(request);
globalThis.caches={default:{
  match:async request=>{const saved=localCache.get(cacheKey(request));return saved?new Response(saved.bytes.slice(0),{status:saved.status,headers:saved.headers}):undefined;},
  put:async(request,response)=>{const bytes=await response.arrayBuffer();localCache.set(cacheKey(request),{bytes,status:response.status,headers:Object.fromEntries(response.headers)});},
  delete:async request=>localCache.delete(cacheKey(request)),
}};
const h=await import(pathToFileURL(modulePath));
const handlers={'/api/gspc':h.board,'/api/xrpl':h.xrpl,'/api/swift':h.swift,'/api/mcp':h.mcp,'/api/cards':h.cards,'/api/dashboard/stats':h.dashboard,'/api/regulator-findings':h.regulator,'/api/cross':h.cross,'/api/hub-cards':h.hub};
const reviewRoutes=new Set(['/','/dashboard','/gspc','/gspc-scoreboard','/gspc-verify','/maternal-covenant','/charter','/layer0','/connect-gspc']);
const counts={},blocked={};let origin;
const nativeFetch=globalThis.fetch;
globalThis.fetch=async(input,init)=>{
 const u=new URL(input instanceof Request?input.url:String(input),origin);const method=(init?.method??(input instanceof Request?input.method:'GET')).toUpperCase();
 if(u.origin!==origin||!['GET','HEAD'].includes(method)){blocked[u.origin+u.pathname]=(blocked[u.origin+u.pathname]??0)+1;return Response.json({state:'OUTSIDE_PRIVATE_REVIEW_SCOPE'},{status:503});}
 return nativeFetch(u,{...init,method});
};
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.xml':'application/xml','.txt':'text/plain','.pdf':'application/pdf'};
async function staticResponse(url){
 let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{return new Response('Bad path',{status:400});}
 const file=path.resolve(dist,'.'+pathname);if(!file.startsWith(dist+path.sep)&&file!==dist)return new Response('Not found',{status:404});
 let actual=file;
 try{const stat=await fs.stat(actual);if(stat.isDirectory())actual=path.join(actual,'index.html');await fs.access(actual);}
 catch{if(reviewRoutes.has(pathname.replace(/\/$/,'')||'/')||pathname.startsWith('/gspc/'))actual=path.join(dist,'index.html');else return Response.json({state:'NOT_IN_REVIEW',path:pathname},{status:404});}
 const bytes=await fs.readFile(actual);return new Response(bytes,{headers:{'content-type':mime[path.extname(actual)]??'application/octet-stream','cache-control':'no-store'}});
}
const server=http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end('Read-only integration test');return;}
  const url=new URL(req.url,origin);counts[url.pathname]=(counts[url.pathname]??0)+1;
  const request=new Request(url,{method:req.method,headers:{accept:req.headers.accept??'*/*'}});
  const context={request,env:{},params:{},data:{},waitUntil:()=>{},next:()=>staticResponse(url)};
  const response=handlers[url.pathname]?await handlers[url.pathname](context):url.pathname.startsWith('/interop/')&&url.pathname.endsWith('.invalid')?await h.historical(context):await staticResponse(url);
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
 }catch(e){res.writeHead(500,{'content-type':'application/json'});res.end(JSON.stringify({state:'REVIEW_SERVER_ERROR',error:e.message}));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`http://127.0.0.1:${server.address().port}`;
await fs.writeFile(path.join(out,'server.json'),JSON.stringify({pid:process.pid,origin,root:dist,scope:'Actual built application with selected actual read handlers; unsupported endpoints explicit. Not Cloudflare production runtime.'},null,2));console.log('PRIVATE_CANDIDATE_SERVER',origin);
const stop=async()=>{await fs.writeFile(path.join(out,'server-observations.json'),JSON.stringify({counts,blocked},null,2));server.close(()=>process.exit(0));};process.on('SIGTERM',stop);process.on('SIGINT',stop);
