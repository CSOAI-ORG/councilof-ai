import {assess,validateLock} from '../src/source_guard.mjs';
import lock from './lock.json' with {type:'json'};
const META='https://huggingface.co/api/spaces/csoai/meok-oowm-hybrid-lab';
const PREFIX='https://huggingface.co/spaces/csoai/meok-oowm-hybrid-lab/raw/';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','cdn-cache-control':'no-store','x-content-type-options':'nosniff','x-robots-tag':'noindex, nofollow'};
function json(v,status=200){return new Response(JSON.stringify(v),{status,headers});}
function age(h){const v=h.get('age');if(v===null)return null;return /^\d+$/.test(v)?Number(v):-1;}
export async function bounded(response,limit){
 if(!response.body)throw Error('MISSING_RESPONSE_BODY');
 const reader=response.body.getReader();let size=0;const chunks=[];
 try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;
   if(size>limit)throw Error('UPSTREAM_SIZE_BOUND');chunks.push(value);}}
 catch(e){await reader.cancel().catch(()=>{});throw e;}
 const all=new Uint8Array(size);let offset=0;for(const b of chunks){all.set(b,offset);offset+=b.byteLength;}return all;
}
function encode(b){let t='';for(let i=0;i<b.length;i+=8192)t+=String.fromCharCode(...b.subarray(i,i+8192));return btoa(t);}
export async function observe(fetcher=fetch,clock=Date.now){
 validateLock(lock);const started=clock();
 if(started>=lock.valid_until_ms)return assess(lock,null,started);
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
 const options={method:'GET',redirect:'manual',cache:'no-store',headers:{'Cache-Control':'no-cache'},signal:controller.signal};
 try{
  const first=await fetcher(META,options);
  if(first.status!==200||first.redirected)throw Error('UPSTREAM_META_UNAVAILABLE');
  const firstDoc=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await bounded(first,262144)));
  if(typeof firstDoc.sha!=='string'||! /^[0-9a-f]{40}$/.test(firstDoc.sha))throw Error('UPSTREAM_META_INVALID');
  const before={status:first.status,revision:firstDoc.sha,age_seconds:age(first.headers),redirected:first.redirected};
  const raw=await fetcher(PREFIX+before.revision+'/'+lock.path,options);
  if(raw.status!==200||raw.redirected)throw Error('UPSTREAM_SOURCE_UNAVAILABLE');
  const bytes=await bounded(raw,lock.max_source_bytes);
  const source={status:raw.status,revision:before.revision,age_seconds:age(raw.headers),redirected:raw.redirected,complete:true,body_base64:encode(bytes)};
  const last=await fetcher(META,options);
  if(last.status!==200||last.redirected)throw Error('UPSTREAM_META_UNAVAILABLE');
  const lastDoc=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await bounded(last,262144)));
  const after={status:last.status,revision:lastDoc.sha,age_seconds:age(last.headers),redirected:last.redirected};
  return await assess(lock,{started_ms:started,finished_ms:clock(),before,source,after},clock());
 }catch(e){return {state:'UNKNOWN',reason:'UPSTREAM_UNAVAILABLE_OR_INVALID',detail:['UPSTREAM_SIZE_BOUND','UPSTREAM_META_UNAVAILABLE','UPSTREAM_SOURCE_UNAVAILABLE','UPSTREAM_META_INVALID'].includes(e.message)?e.message:'READ_FAILED',target:lock.target,checked_at_ms:clock(),source_truth_established:false,execution_authorized:false,signature:null};}
 finally{clearTimeout(timer);}
}
export async function handle(request,env={},fetcher=fetch,clock=Date.now){
 const u=new URL(request.url);
 if(request.method!=='GET'&&request.method!=='HEAD')return json({state:'REFUSED',reason:'READ_ONLY_GET',execution_authorized:false},405);
 if(u.search)return json({state:'REFUSED',reason:'NO_CALLER_TARGET_OR_CLOCK',execution_authorized:false},400);
 if(u.pathname==='/api/registry')return json({...lock,scope:'OPERATOR_FIXED_PUBLIC_SOURCE_LOCK',signature:null,execution_authorized:false});
 if(u.pathname==='/api/current'){
  const result=await observe(fetcher,clock);
  const status=result.state==='MATCH_AT_OBSERVATION'?200:result.reason==='OPERATOR_LOCK_EXPIRED'?410:result.state==='HOLD'?409:503;
  return json(result,status);
 }
 if(u.pathname.startsWith('/api/'))return json({state:'REFUSED',reason:'UNKNOWN_ENDPOINT',execution_authorized:false},404);
 if(env.ASSETS)return env.ASSETS.fetch(request);
 return new Response('Not found',{status:404,headers});
}
export default {fetch(request,env){return handle(request,env);}};
