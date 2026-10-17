/** Local compiled-Worker data origin for private rendering. No production bindings or external traffic. */
import fs from 'node:fs/promises';import path from 'node:path';import http from 'node:http';import {pathToFileURL} from 'node:url';
const [runtimePath,compiledDir,publicDir,output]=process.argv.slice(2);if(!runtimePath||!compiledDir||!publicDir||!output)throw new Error('runtime compiled public output required');
const {Miniflare,convertV4MiniflareOptions}=await import(pathToFileURL(path.resolve(runtimePath)));
const source=path.resolve(publicDir),out=path.resolve(output);await fs.mkdir(out,{recursive:true});
const mime={'.html':'text/html','.json':'application/json','.jsonl':'application/x-ndjson','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.txt':'text/plain','.xml':'application/xml','.png':'image/png','.woff2':'font/woff2'};
let worker;const counts={},denied={},active=new Map();let sent=0;
async function asset(request){
 const u=new URL(request.url);if(!['GET','HEAD'].includes(request.method))return new Response('Read-only review',{status:405});
 let decoded;try{decoded=decodeURIComponent(u.pathname);}catch{return new Response('Invalid path',{status:400});}
 let file=path.resolve(source,'.'+decoded);if(file!==source&&!file.startsWith(source+path.sep))return new Response('Out of scope',{status:404});
 try{const st=await fs.lstat(file);if(st.isSymbolicLink())return new Response('Symlink not served',{status:404});if(st.isDirectory())file=path.join(file,'index.html');const b=await fs.readFile(file);if(b.length>25*1024*1024)return new Response('Asset bound',{status:413});return new Response(request.method==='HEAD'?null:b,{headers:{'content-type':mime[path.extname(file)]??'application/octet-stream'}});}
 catch{return Response.json({state:'LOCAL_ASSET_UNAVAILABLE',path:u.pathname},{status:404});}
}
async function outbound(request){
 const u=new URL(request.url);sent++;if(sent>30000)return new Response('Review request budget exhausted',{status:429});
 if(!['GET','HEAD'].includes(request.method)||!['councilof.ai','csoai.org'].includes(u.hostname)){const key=request.method+' '+u.origin+u.pathname;denied[key]=(denied[key]??0)+1;return Response.json({state:'EXTERNAL_REQUEST_BLOCKED_IN_PRIVATE_REVIEW'},{status:503});}
 if(!u.pathname.startsWith('/api/')&&!u.pathname.startsWith('/signed/'))return asset(request);
 const key=u.pathname+u.search,n=active.get(key)??0;if(n>6)return new Response('Nested request bound',{status:503});active.set(key,n+1);
 try{return await worker.dispatchFetch('https://councilof.ai'+u.pathname+u.search,{method:request.method,headers:{accept:'application/json'}});}finally{active.set(key,n);}
}
const compiled=path.resolve(compiledDir),modules=[{type:'ESModule',path:path.join(compiled,'index.js')},...(await fs.readdir(compiled)).filter(n=>n.endsWith('.wasm')).map(n=>({type:'CompiledWasm',path:path.join(compiled,n)}))];
worker=new Miniflare(convertV4MiniflareOptions({modules,modulesRoot:compiled,compatibilityDate:'2026-07-29',host:'127.0.0.1',port:0,outboundService:outbound,serviceBindings:{ASSETS:asset}}));
const server=http.createServer(async(req,res)=>{try{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end('Read-only review');return;}
 const u=new URL(req.url,'https://councilof.ai');counts[u.pathname]=(counts[u.pathname]??0)+1;
 const response=await worker.dispatchFetch(u.href,{method:req.method,headers:{accept:req.headers.accept??'application/json'},redirect:'manual'});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
}catch(e){res.writeHead(503,{'content-type':'application/json'});res.end(JSON.stringify({state:'REVIEW_RUNTIME_ERROR',reason:String(e.message).slice(0,200)}));}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
await fs.writeFile(path.join(out,'platform-server.json'),JSON.stringify({pid:process.pid,origin,compiled,public:source,mode:'PRIVATE_LOCAL_WORKERD_READ_ONLY',production_bindings:false,external_requests_sent:0},null,2));console.log('PRIVATE_PLATFORM_DATA',origin);
let closed=false;async function stop(){if(closed)return;closed=true;server.close();await worker.dispose();await fs.writeFile(path.join(out,'platform-server-final.json'),JSON.stringify({counts,denied,subrequests_attempted:sent,external_requests_sent:0,stopped:true},null,2));process.exit(0);}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
