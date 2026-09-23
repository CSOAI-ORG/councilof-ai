/** Integrity of the existing assembled feed. Not a signature, payment proof or freshness claim. */
import {canonicalBytes,sha256Hex} from '../_lib/cardSign';
export const FEED_MANIFEST_SCHEMA='csoai.eunomia-feed-manifest/1.0';
export const EXPECTED_FEED_HEADER='x-csoai-expected-feed-sha256';
export const SOURCE_CAP=2_000_000;
export const FEED_SOURCES={signals:'/signals/_index.json',first_fine_watch:'/api/fines',root:'/root.json',card_index:'/signed/card_index.json'} as const;
export type SourceName=keyof typeof FEED_SOURCES;
export type SourceRead<T=Record<string,unknown>>={ok:true;body:T;response_sha256:string;response_bytes:number}|{ok:false;reason:string};
export type Reads=Record<SourceName,SourceRead>;
export function expectedFeedDigest(r:Request):string|null{
 const value=r.headers.get(EXPECTED_FEED_HEADER);
 if(value!==null&&!/^[a-f0-9]{64}$/.test(value))throw new Error('Expected feed digest must be64lowercase hexadecimal characters');
 return value;
}
export function safeFeedJson(value:unknown):boolean{
 let count=0;
 const walk=(v:unknown,depth:number):boolean=>{
  if(++count>100000||depth>50)return false;
  if(v===null||typeof v==='string'||typeof v==='boolean')return true;
  if(typeof v==='number')return Number.isFinite(v);
  if(Array.isArray(v))return v.every(x=>walk(x,depth+1));
  if(v&&typeof v==='object')return Object.keys(v).every(k=>k!=='__proto__'&&walk((v as Record<string,unknown>)[k],depth+1));
  return false;
 };return walk(value,0);
}
export function sourceShapeIssue(name:SourceName,value:unknown):string|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return 'Source is not a JSON object';
 if(!safeFeedJson(value))return 'JSON content cannot be represented safely within the data contract';
 const v=value as Record<string,unknown>;
 if('error' in v||'unreadable' in v)return 'Source explicitly reports an error';
 if(name==='signals'&&!Array.isArray(v.signals))return 'Signals source lacks its declared array';
 if(name==='card_index'&&!Array.isArray(v.cards))return 'Card index lacks its declared array';
 if(name==='root'&&(!Number.isInteger(v.card_count)||Number(v.card_count)<0||typeof v.merkle_root!=='string'||!v.merkle_root||typeof v.as_of!=='string'||!v.as_of))return 'Root source lacks count, root or source date';
 if(name==='first_fine_watch'&&(typeof v.schema!=='string'||!v.schema))return 'Enforcement source lacks a schema identifier';
 return null;
}
export async function readFeedSource<T=Record<string,unknown>>(url:string,name:SourceName):Promise<SourceRead<T>>{
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
 try{
  const r=await fetch(url,{redirect:'error',signal:controller.signal,headers:{accept:'application/json'}});
  if(!r.ok){await r.body?.cancel();return {ok:false,reason:`HTTP ${r.status}`};}
  if(!r.body)return {ok:false,reason:'Source has no body'};
  const reader=r.body.getReader();const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>SOURCE_CAP){await reader.cancel();throw new Error('SOURCE_BYTE_CAP');}chunks.push(part.value);}}
  finally{reader.releaseLock();}
  const raw=new Uint8Array(size);let at=0;for(const part of chunks){raw.set(part,at);at+=part.byteLength;}
  const body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));const issue=sourceShapeIssue(name,body);
  if(issue)return {ok:false,reason:issue};
  return {ok:true,body:body as T,response_sha256:await sha256Hex(raw),response_bytes:raw.length};
 }catch(e){return {ok:false,reason:e instanceof Error&&e.message==='SOURCE_BYTE_CAP'?'Source exceeds byte budget':'Source read, JSON parsing or transport was uncheckable'};}
 finally{clearTimeout(timer);}
}
export function missingFeedSources(reads:Reads):string[]{return (Object.keys(FEED_SOURCES) as SourceName[]).filter(k=>!reads[k].ok);}
export function feedBlocks(reads:Reads):Record<SourceName,Record<string,unknown>>{
 const missing=missingFeedSources(reads);if(missing.length)throw new Error('Incomplete feed');
 return Object.fromEntries((Object.keys(FEED_SOURCES) as SourceName[]).map(k=>[k,(reads[k] as Extract<SourceRead,{ok:true}>).body])) as Record<SourceName,Record<string,unknown>>;
}
function sourceDate(body:Record<string,unknown>):string|null{return typeof body.as_of==='string'?body.as_of:null;}
export async function makeFeedManifest(reads:Reads,origin:string){
 const blocks=feedBlocks(reads);const bytes=canonicalBytes(blocks);const digest=await sha256Hex(bytes);
 return {schema:FEED_MANIFEST_SCHEMA,resource:origin+'/api/eunomia-data?feed=1',manifest_url:origin+'/api/eunomia-data?manifest=1',free:true,settlement_attempted:false,
  coverage:{required_blocks:Object.keys(FEED_SOURCES),complete_assembly:true,source_truth_verified:false},
  sources:await Promise.all((Object.keys(FEED_SOURCES) as SourceName[]).map(async name=>{const r=reads[name] as Extract<SourceRead,{ok:true}>;return {name,url:origin+FEED_SOURCES[name],as_of:sourceDate(r.body),response_sha256:r.response_sha256,response_bytes:r.response_bytes,block_sha256:await sha256Hex(canonicalBytes(r.body))};})),
  evidence:{blocks_sha256:digest,blocks_bytes:bytes.length,digest_algorithm:'SHA-256',hash_covers:'payload.blocks',canonicalization:'csoai.card-v0.canonicalBytes/1: recursively sorted object keys, JSON.stringify, UTF-8; retain array order',signature_state:'NOT_CREATED_BY_MANIFEST'},
  pinning:{request_header:EXPECTED_FEED_HEADER,value:digest,mismatch_http_status:409,checked_before_facilitator:true,optional_for_legacy_clients:true},
  claim_boundary:{proves:['Digests identify the assembled block contents and the individual retrieved source responses.'],does_not_prove:['Source claims are true or freshly measured.','Signatures within blocks have been verified by this manifest.','The separate payment receipt signs the request query or delivered contents.','Payment, token transfer, finality or customer acceptance.']},
  freshness:{policy:'SOURCE_DATES_RETAINED_SEPARATELY',assembly_is_new_measurement:false,max_age_hours:null},
  offline_verifier:origin+'/verifier/verify_feed_delivery.mjs'};
}
export async function requestRecord(request:Request){return {method:request.method,target_sha256:await sha256Hex(new TextEncoder().encode(request.method+'\n'+request.url)),preimage:'UTF-8(method + LF + Request.url)',signed:false};}
export async function feedJson(body:unknown,status=200,extra:Record<string,string>={}){
 const raw=new TextEncoder().encode(JSON.stringify(body,null,2));
 return new Response(raw,{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store, no-transform','access-control-allow-origin':'*','access-control-expose-headers':'x-csoai-payload-sha256, x-csoai-feed-sha256, x-payment-response, payment-response',...extra,'x-csoai-payload-sha256':await sha256Hex(raw)}});
}
