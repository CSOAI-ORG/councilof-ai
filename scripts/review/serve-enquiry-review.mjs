/** Loopback-only UI test bridge. Allows only fixture enquiry POSTs and read-only assets. */
import fs from 'node:fs/promises';import path from 'node:path';import http from 'node:http';import {enquiryRuntime} from './enquiry-native-runtime.mjs';
const [runtime,compiled,assets,out]=process.argv.slice(2);if(!runtime||!compiled||!assets||!out)throw Error('runtime compiled assets output required');await fs.mkdir(out,{recursive:true});const store=path.join(out,'browser-native-kv');await fs.mkdir(store);
const instance=await enquiryRuntime(runtime,compiled,store,assets);const receipts=[];let writes=0,origin;
const server=http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,origin);
 if(!['GET','HEAD'].includes(req.method)&&!(req.method==='POST'&&['/api/contact','/api/lead'].includes(u.pathname)&&writes<12)){res.writeHead(405);res.end('Outside the local fixture test scope');return;}
 let body;if(req.method==='POST'){writes++;const parts=[];let size=0;for await(const part of req){size+=part.length;if(size>24_576){res.writeHead(413);res.end('Fixture request too large');return;}parts.push(part);}body=Buffer.concat(parts);}
 const headers={accept:req.headers.accept??'*/*'};if(req.headers['content-type'])headers['content-type']=req.headers['content-type'];if(req.headers.origin)headers.origin=req.headers.origin;
 const response=await instance.worker.dispatchFetch(u.href,{method:req.method,headers,body,redirect:'manual'});const raw=Buffer.from(await response.arrayBuffer());
 if(req.method==='POST'){let j;try{j=JSON.parse(raw);}catch{j={};}receipts.push({path:u.pathname,http:response.status,state:j.state??null,receipt_id:j.receipt_id??null,submission_id:j.submission_id??null,reused:j.reused??null});}
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(req.method==='HEAD'?undefined:raw);
}catch{res.writeHead(503,{'content-type':'application/json'});res.end(JSON.stringify({ok:false,stored:null,state:'PRIVATE_RUNTIME_FAILURE'}));}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
await fs.writeFile(path.join(out,'enquiry-server.json'),JSON.stringify({pid:process.pid,origin,compiled:path.resolve(compiled),assets:path.resolve(assets),storage:'SYNTHETIC_LOCAL_ONLY',production_bindings:false},null,2));console.log('PRIVATE_ENQUIRY_UI',origin);
let stopping=false;async function stop(){if(stopping)return;stopping=true;server.close();const kv=await instance.worker.getKVNamespace('LEADS');const keys=await kv.list();await fs.writeFile(path.join(out,'enquiry-server-final.json'),JSON.stringify({state:'STOPPED_OWNED_FIXTURE_SERVER',post_requests:receipts,stored_synthetic_records:keys.keys.length,external_requests_sent:0,emails_sent:0,real_customers:0,public_deployment:false,scope:'Only local synthetic form traffic. No production storage or email channel.'},null,2));await instance.worker.dispose();process.exit(0);}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
