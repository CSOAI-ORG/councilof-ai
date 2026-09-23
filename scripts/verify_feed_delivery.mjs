#!/usr/bin/env node
/** Offline content and optional unsigned request/response-record checks. No network, payment or signature operations. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
export const KEYS=['signals','first_fine_watch','root','card_index'];
export const PROFILE='csoai.card-v0.canonicalBytes/1: recursively sorted object keys, JSON.stringify, UTF-8; retain array order';
export const hash=b=>createHash('sha256').update(b).digest('hex');
const hex=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const fail=message=>{throw new Error(message);};
export function canonicalBytes(value){
 let count=0;
 const rec=(v,depth=0)=>{
  if(++count>100000||depth>50)fail('JSON structure exceeds validation budget');
  if(typeof v==='number'&&!Number.isFinite(v))fail('Non-finite number');
  if(Array.isArray(v))return v.map(x=>rec(x,depth+1));
  if(v&&typeof v==='object'){const out={};for(const k of Object.keys(v).sort()){if(k==='__proto__')fail('Unsupported prototype key');out[k]=rec(v[k],depth+1);}return out;}
  if(v!==null&&!['number','boolean','string'].includes(typeof v))fail('Non-JSON value');
  return v;
 };return Buffer.from(JSON.stringify(rec(value)),'utf8');
}
export function verifyFeed(manifestRaw,payloadRaw,options={}){
 if(!Buffer.isBuffer(manifestRaw)||!Buffer.isBuffer(payloadRaw)||manifestRaw.length>1000000||payloadRaw.length>10000000)fail('Inputs exceed bounded byte contract');
 if(options.manifestSha256!==undefined&&(!hex(options.manifestSha256)||hash(manifestRaw)!==options.manifestSha256))fail('Retained manifest digest mismatch');
 const manifest=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(manifestRaw));const payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(payloadRaw));
 canonicalBytes(manifest);canonicalBytes(payload);
 if(manifest.schema!=='csoai.eunomia-feed-manifest/1.0'||manifest.free!==true||manifest.settlement_attempted!==false)fail('Not the free feed manifest contract');
 const resource=new URL(manifest.resource);if(resource.protocol!=='https:'||!['councilof.ai','councilof-ai.pages.dev'].includes(resource.host)||resource.username||resource.password||resource.pathname!=='/api/eunomia-data'||resource.search!=='?feed=1'||resource.hash)fail('Unexpected manifest resource');
 if(payload.schema!=='csoai.eunomia-data/0.2'||payload.kind!=='feed'||!payload.blocks||typeof payload.blocks!=='object'||Array.isArray(payload.blocks))fail('Not an assembled feed delivery');
 if(Object.keys(payload.blocks).sort().join('|')!==[...KEYS].sort().join('|'))fail('Missing or additional feed blocks');
 if(manifest.coverage?.complete_assembly!==true||manifest.coverage.required_blocks?.slice().sort().join('|')!==[...KEYS].sort().join('|'))fail('Incomplete coverage contract');
 const e=manifest.evidence;
 if(!e||!hex(e.blocks_sha256)||!Number.isSafeInteger(e.blocks_bytes)||e.blocks_bytes<1||e.hash_covers!=='payload.blocks'||e.canonicalization!==PROFILE||e.digest_algorithm!=='SHA-256')fail('Invalid digest contract');
 const bytes=canonicalBytes(payload.blocks);if(hash(bytes)!==e.blocks_sha256||bytes.length!==e.blocks_bytes)fail('Delivered block content differs from retained manifest');
 if(manifest.pinning?.value!==e.blocks_sha256||manifest.pinning?.request_header!=='x-csoai-expected-feed-sha256'||manifest.pinning?.mismatch_http_status!==409||manifest.pinning.checked_before_facilitator!==true)fail('Digest pinning contract inconsistent');
 const delivered=payload.delivery_manifest;
 if(!delivered||delivered.schema!==manifest.schema||delivered.resource!==manifest.resource||delivered.evidence?.blocks_sha256!==e.blocks_sha256||delivered.evidence?.blocks_bytes!==e.blocks_bytes||delivered.evidence?.canonicalization!==PROFILE)fail('Embedded manifest does not match retained contract');
 if(!Array.isArray(manifest.sources)||manifest.sources.length!==4||new Set(manifest.sources.map(x=>x.name)).size!==4)fail('Source inventory invalid');
 const paths={signals:'/signals/_index.json',first_fine_watch:'/api/fines',root:'/root.json',card_index:'/signed/card_index.json'};
 for(const source of manifest.sources){
  if(!KEYS.includes(source.name)||source.url!==resource.origin+paths[source.name]||!hex(source.block_sha256)||hash(canonicalBytes(payload.blocks[source.name]))!==source.block_sha256)fail('Individual source block differs');
  const date=typeof payload.blocks[source.name]?.as_of==='string'?payload.blocks[source.name].as_of:null;if(source.as_of!==date)fail('Source observation date changed');
 }
 if(!Array.isArray(manifest.claim_boundary?.does_not_prove)||!manifest.claim_boundary.does_not_prove.length||manifest.freshness?.assembly_is_new_measurement!==false)fail('Evidence limitations missing');
 if((options.method!==undefined)!==(options.requestUrl!==undefined))fail("Request URL and method must be supplied together");
 let requestMatches=null;let payloadRecordMatches=null;
 if(options.requestUrl!==undefined){
  const target=new URL(options.requestUrl);if(target.href!==options.requestUrl||target.origin!==resource.origin||target.pathname!==resource.pathname||target.username||target.password||target.hash)fail('Expected request URL must be exact, same-origin and credential-free');
  if(!['GET','POST'].includes(options.method))fail('Expected request method required');
  if(target.searchParams.get('manifest')==='1'||!(target.searchParams.get('feed')==='1'||target.searchParams.get('x402')==='1'))fail('Expected URL does not select the feed');
  const rr=payload.request_record;if(!rr||rr.signed!==false||rr.method!==options.method||rr.preimage!=='UTF-8(method + LF + Request.url)'||rr.target_sha256!==hash(Buffer.from(options.method+'\n'+options.requestUrl)))fail('Unsigned request record differs from supplied request');
  requestMatches=true;
 }
 if(options.payloadSha256!==undefined){if(!hex(options.payloadSha256)||hash(payloadRaw)!==options.payloadSha256)fail('Exact response bytes differ from retained response digest');payloadRecordMatches=true;}
 return {schema:'csoai.eunomia-offline-check/1.0',state:'FEED_CONTENT_MATCHES_RETAINED_MANIFEST',manifest_sha256:hash(manifestRaw),payload_sha256:hash(payloadRaw),blocks_sha256:e.blocks_sha256,verified_blocks:4,source_dates:manifest.sources.map(({name,as_of})=>({name,as_of})),request_record_matches_supplied_target:requestMatches,exact_response_matches_retained_digest:payloadRecordMatches,network_calls:0,payment_verified:false,signatures_verified:false,request_record_authenticated:false,source_truth_verified:false,claim_boundary:'Exact retained contents and optional unsigned records match. A malicious party replacing all unsigned inputs is not detected without a trusted pin/signature. No signature, payment, freshness, or customer acceptance inferred.'};
}
export function main(argv){
 if(argv.includes('--help')){console.log('Usage: node verify_feed_delivery.mjs manifest.json payload.json [--manifest-sha256 HEX] [--payload-sha256 HEX] [--request-url EXACT_URL --method GET|POST]\nOffline only. Retain the manifest before payment and the actual response bytes afterwards. Optional response digest is x-csoai-payload-sha256. Never executes downloaded code or makes a payment.');return 0;}
 try{
  if(argv.length<2)fail('Two saved JSON files required');const [m,p,...rest]=argv;const options={};const names={'--manifest-sha256':'manifestSha256','--payload-sha256':'payloadSha256','--request-url':'requestUrl','--method':'method'};
  for(let i=0;i<rest.length;i+=2){if(!names[rest[i]]||!rest[i+1]||options[names[rest[i]]]!==undefined)fail('Invalid or duplicate option');options[names[rest[i]]]=rest[i+1];}
  const load=(p,cap)=>{const s=fs.lstatSync(p);if(!s.isFile()||s.isSymbolicLink()||s.size>cap)fail('Input must be bounded regular file');return fs.readFileSync(p);};
  console.log(JSON.stringify(verifyFeed(load(m,1000000),load(p,10000000),options),null,2));return 0;
 }catch(e){console.error(JSON.stringify({state:'NOT_VERIFIED',reason:e.message,network_calls:0}));return 1;}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))process.exitCode=main(process.argv.slice(2));
