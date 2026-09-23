#!/usr/bin/env node
/** Offline verifier for the population rows byte contract. No network or payment. */
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const LIMIT=32*1024*1024;
// Deliberately identical to the current card-v0 canonicalBytes, not another JSON standard.
export function canonicalBytes(obj) {
  const rec=(v)=>{
    if(Array.isArray(v))return v.map(rec);
    if(v&&typeof v==='object'){
      const out={};for(const k of Object.keys(v).sort())out[k]=rec(v[k]);return out;
    }
    return v;
  };
  return Buffer.from(JSON.stringify(rec(obj)),'utf8');
}
const sha=(b)=>createHash('sha256').update(b).digest('hex');
export function verifyDelivery(manifest,payload,{maxAgeHours=null,now=Date.now()}={}) {
  const errors=[];
  if(manifest?.schema!=='csoai.population-delivery-manifest/0.1')errors.push('unsupported_manifest_schema');
  if(payload?.schema!=='csoai.population-door/0.1'||payload?.kind!=='slice')errors.push('unsupported_payload_schema');
  if(typeof manifest?.id!=='string'||payload?.id!==manifest.id)errors.push('population_mismatch');
  if(payload?.rows===undefined)errors.push('missing_payload_rows');
  if(!/^[a-f0-9]{64}$/.test(manifest?.evidence?.rows_sha256||''))errors.push('invalid_expected_digest');
  if(!Number.isSafeInteger(manifest?.evidence?.rows_bytes)||manifest.evidence.rows_bytes<0)errors.push('invalid_expected_length');
  if(payload?.as_of!==manifest?.freshness?.as_of)errors.push('source_time_mismatch');
  if(payload?.n!==manifest?.coverage?.record_count)errors.push('population_count_mismatch');
  if(payload?.state!==manifest?.coverage?.source_state)errors.push('population_state_mismatch');
  let actual=null,length=null;
  if(payload?.rows!==undefined){
    try{const b=canonicalBytes(payload.rows);actual=sha(b);length=b.byteLength;
      if(actual!==manifest?.evidence?.rows_sha256)errors.push('rows_digest_mismatch');
      if(length!==manifest?.evidence?.rows_bytes)errors.push('rows_length_mismatch');
    }catch{errors.push('rows_not_serializable');}
  }
  if(payload?.delivery_manifest&&sha(canonicalBytes(payload.delivery_manifest))!==sha(canonicalBytes(manifest)))errors.push('embedded_manifest_mismatch');
  if(payload?.attestation?.payload?.rows_sha256&&payload.attestation.payload.rows_sha256!==actual)errors.push('attestation_rows_binding_mismatch');
  let freshness='NOT_EVALUATED_NO_CONSUMER_LIMIT';
  if(maxAgeHours!==null){
    const t=Date.parse(manifest?.freshness?.as_of||'');
    if(!Number.isFinite(maxAgeHours)||maxAgeHours<0||!Number.isFinite(t)||t>now+300000){errors.push('invalid_freshness_input');freshness='UNCHECKABLE';}
    else if(now-t>maxAgeHours*3600000){errors.push('source_exceeds_consumer_age_limit');freshness='STALE';}
    else freshness='WITHIN_CONSUMER_LIMIT';
  }
  return {schema:'csoai.population-delivery-verification/0.1',verdict:errors.length?'REJECTED':'CONTENT_VERIFIED_NOT_PAYMENT_OR_SIGNATURE_VERIFIED',checks:{rows_sha256:actual,rows_bytes:length,freshness},errors,payment_verified:false,signature_verified:false,bitcoin_verified:false,source_truth_verified:false};
}
function load(file){if(statSync(file).size>LIMIT)throw new Error('file exceeds32MiB budget');return JSON.parse(readFileSync(file,'utf8'));}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const args=process.argv.slice(2);if(args.length<2)throw new Error('Usage: node verify-population-delivery.mjs manifest.json payload.json [max-age-hours]');
  const result=verifyDelivery(load(args[0]),load(args[1]),{maxAgeHours:args[2]===undefined?null:Number(args[2])});
  console.log(JSON.stringify(result,null,2));process.exitCode=result.errors.length?1:0;
 }catch(e){console.error(JSON.stringify({verdict:'REJECTED',error:e.message}));process.exitCode=2;}
}
