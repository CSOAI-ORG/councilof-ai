import {PACKET_NAMES,readInspectionZip,requirePacket as must,strictPacketJson} from './inspectionPacketZip';
type Dict=Record<string,unknown>;const obj=(x:unknown):Dict=>{must(x!==null&&typeof x==='object'&&!Array.isArray(x),'JSON_OBJECT_REQUIRED');return x as Dict;};
const hex=(x:unknown):string=>{must(typeof x==='string'&&/^[a-f0-9]{64}$/.test(x),'EXPECTED_64_HEX_DIGEST');return x;};
export const packetDigest=async(b:Uint8Array)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(b).buffer))].map(n=>n.toString(16).padStart(2,'0')).join('');
const canonical=(x:unknown):string=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical((x as Dict)[k])).join(',')+'}';
const equal=(a:unknown,b:unknown)=>canonical(a)===canonical(b);
const rows:Record<string,[string,string]>={'gspc-board':['axes','axis'],'xrpl-register':['assets','sha256'],'swift-register':['rows','id'],'gpai-notices':['cards','id'],'humanoid-deployments':['rows','id'],'stablecoin-index':['assets','id'],'stablecoin-supply':['rows','asset_id'],'lab-artifacts':['rows','org'],'mcp-registry':['servers','id'],'regulatory-adapters':['authority_adapters','id']};
const allowed=new Set([...Object.keys(rows),'x402-disclosures','layer0-witness','api-description']);
export interface InspectionReadout {state:'SELF_CONSISTENT_SOURCE_PACKET';requestId:string;packetSha256:string;deliverySha256:string;sourceId:string;sourceUrl:string;sourceAsOf:string|Record<string,unknown>|null;records:number|null;states:Record<string,number>;expectedDigestMatched:boolean;expectedRequestMatched:boolean;publisherAuthenticated:false;freshness:'HISTORICAL_NOT_REVALIDATED';newMeasurements:0;filesChecked:number}
export async function inspectPacketMembers(m:Record<string,Uint8Array>,expectedRequest?:string):Promise<Omit<InspectionReadout,'packetSha256'|'expectedDigestMatched'>> {
 must(equal(Object.keys(m).sort(),[...PACKET_NAMES].sort()),'PACKET_MEMBER_SET');const manifest=obj(strictPacketJson(m['manifest.json']));must(manifest.schema==='csoai.inspection-packet/1','MANIFEST_SCHEMA');
 const entries=obj(manifest.files);must(equal(Object.keys(entries).sort(),PACKET_NAMES.filter(n=>n!=='manifest.json').sort()),'MANIFEST_FILE_SET');
 for(const [name,metadata] of Object.entries(entries)){const meta=obj(metadata);must(equal(meta,{bytes:m[name].length,sha256:await packetDigest(m[name])}),'MANIFEST_DIGEST_MISMATCH');}
 const q=obj(strictPacketJson(m['request.json'])),d=obj(strictPacketJson(m['delivery.json'])),o=obj(strictPacketJson(m['observation.json']));
 const fields=['schema','source_id','source_sha256','method','method_sha256','request_id','observer_source_sha256','observer_receipt_sha256','source_url','source_as_of','admitted_at','authority','budget','publication'];
 must(equal(Object.keys(q).sort(),fields.sort()),'UNRECOGNISED_REQUEST_CONFIGURATION');
 must(q.schema==='csoai.private-source-request/0.1'&&q.method==='source-consistency/1','REQUEST_SCHEMA');
 must(typeof q.source_id==='string'&&allowed.has(q.source_id),'UNSUPPORTED_SOURCE_INSTRUMENT');
 must(q.authority==='OWNER_AUTHORISED_PRIVATE_SOURCE_CONSISTENCY_ONLY'&&q.publication==='PRIVATE_UNSIGNED','REQUEST_AUTHORITY_OVERCLAIM');
 must(equal(q.budget,{new_paid_requests:0,inference:0,wallet_actions:0}),'REQUEST_BUDGET_MISMATCH');
 const id=hex(q.request_id);if(expectedRequest)must(id===hex(expectedRequest),'EXPECTED_REQUEST_MISMATCH');
 const identity=Object.fromEntries(['schema','source_id','source_sha256','method','method_sha256'].map(k=>[k,q[k]]));
 const ascii=canonical(identity).replace(/[\u007f-\uffff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
 must(await packetDigest(new TextEncoder().encode(ascii))===id,'REQUEST_SCOPE_MISMATCH');
 for(const [key,name] of [['source_sha256','source.body'],['method_sha256','method.py'],['observer_source_sha256','observer.py'],['observer_receipt_sha256','observation.json']])must(await packetDigest(m[name])===hex(q[key]),'REQUEST_'+key.toUpperCase()+'_MISMATCH');
 must(d.schema==='csoai.private-evidence-delivery/0.1','DELIVERY_SCHEMA');
 for(const key of ['request_id','source_sha256','method_sha256','observer_receipt_sha256'])must(d[key]===q[key],'DELIVERY_SCOPE_MISMATCH');
 must(d.request_scope_sha256===id&&manifest.request_id===id,'REQUEST_REFERENCE_MISMATCH');
 must(o.source_sha256===q.observer_source_sha256&&['OBSERVED','PARTIAL'].includes(String(o.state))&&Array.isArray(o.sources),'OBSERVER_SCHEMA');
 const observed=o.sources.filter(v=>obj(v).id===q.source_id).map(obj);must(observed.length===1,'OBSERVER_IDENTITY_AMBIGUITY');const source=observed[0];
 must(source.state!=='UNAVAILABLE'&&source.body_sha256===q.source_sha256&&source.url===q.source_url&&equal(source.source_as_of,q.source_as_of),'OBSERVER_SUBJECT_BINDING');
 const data=obj(strictPacketJson(m['source.body'])),result=obj(d.measurement);must(result.instrument===q.method&&result.scope==='RETAINED_SOURCE_STRUCTURE_AND_IDENTITY_CONSISTENCY','MEASUREMENT_SCOPE');
 let count:number|null=null,unit:string|null=null;const states:Record<string,number>=Object.create(null);
 if(rows[q.source_id]){const [collection,key]=rows[q.source_id];unit=collection;const items=data[collection];must(Array.isArray(items),'SOURCE_COLLECTION');const identities=new Set<string>();
  for(const item of items){const row=obj(item),v=row[key];must((typeof v==='string'&&v!=='')||(typeof v==='number'&&Number.isSafeInteger(v)),'RECORD_ID_REQUIRED');const id=String(v);must(!identities.has(id),'DUPLICATE_RECORD_ID');identities.add(id);const raw=Object.hasOwn(row,'state')?row.state:Object.hasOwn(row,'status')?row.status:'NOT_RECORDED';const state=typeof raw==='string'?raw:'UNRECOGNISED_STATE';states[state]=(states[state]??0)+1;}
  count=items.length;must(source.observed_collection_count===count,'OBSERVER_COUNT_MISMATCH');
 }
 must(result.record_count===count&&result.record_unit===unit&&result.unique_record_ids===(unit?true:null),'RECORD_COUNT_OR_UNIT_MISMATCH');
 must(equal(result.recorded_state_counts,states),'STATE_TALLY_MISMATCH');
 const k=['asset_count','universe_asset_count','n'].find(k=>Object.hasOwn(data,k));const declared=k?data[k]:null;
 must(declared===null||(typeof declared==='number'&&Number.isSafeInteger(declared)&&declared>=0),'INVALID_DECLARED_COUNT');
 must(result.declared_count===declared&&result.declared_count_agrees===(declared!==null&&count!==null?declared===count:null),'DECLARED_COUNT_MISMATCH');
 must(equal(result.source_as_of,q.source_as_of),'DATE_MISMATCH');
 must(result.organisation_compliance==='NOT_ASSESSED'&&result.model_performance==='NOT_ASSESSED'&&result.signatures_verified===false&&result.chain_state_verified===false,'ASSESSMENT_OVERCLAIM');
 must(d.signature===null&&d.signature_state==='NOT_SIGNED'&&d.root_state==='NOT_ROOTED'&&d.witness_state==='NOT_WITNESSED'&&d.paid===false&&d.public===false,'AUTHENTICATION_PAYMENT_OR_PUBLICATION_OVERCLAIM');
 must(typeof q.source_url==='string','SOURCE_METADATA');
 let sourceDating:string|Dict|null;
 if(q.source_as_of===null)sourceDating=null;else if(typeof q.source_as_of==='string')sourceDating=q.source_as_of;else sourceDating=obj(q.source_as_of);
 return {state:'SELF_CONSISTENT_SOURCE_PACKET',requestId:id,deliverySha256:await packetDigest(m['delivery.json']),sourceId:q.source_id,sourceUrl:q.source_url,sourceAsOf:sourceDating,records:count,states,expectedRequestMatched:!!expectedRequest,publisherAuthenticated:false,freshness:'HISTORICAL_NOT_REVALIDATED',newMeasurements:0,filesChecked:7};
}
export async function verifyInspectionPacket(raw:Uint8Array,expectedRequest?:string,expectedDigest?:string):Promise<InspectionReadout>{
 must(raw.length<=4_000_000,'PACKET_SIZE_LIMIT');if(expectedRequest)hex(expectedRequest);if(expectedDigest)hex(expectedDigest);
 const packetSha256=await packetDigest(raw);if(expectedDigest)must(packetSha256===expectedDigest,'EXPECTED_PACKET_DIGEST_MISMATCH');
 const verified=await inspectPacketMembers(await readInspectionZip(raw),expectedRequest);
 return {...verified,packetSha256,expectedDigestMatched:!!expectedDigest};
}
