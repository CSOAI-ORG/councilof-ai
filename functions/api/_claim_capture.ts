/** Read a pinned, hash-verified claim-capture slice without replacing frozen evidence. */
export type Reading = { state:'INDEXED'|'MEASURED'|'UNMEASURED'|'UNCHECKABLE'; n:number|null; n_unit:string; as_of:string|null; source:string[]; reason:string|null; unmeasured:string[]; head:Record<string,unknown>; rows?:unknown; rows_unit?:string };
export const CAPTURE_POPULATIONS: Record<string,string> = {
  stablecoins: 'stablecoins', 'mcp-registry': 'mcp_versions', 'x402-bazaar': 'x402_services',
};
const BASE='https://huggingface.co/datasets/csoai/councilof-ai-mirror/resolve/';
const POINTER=BASE+'main/claim-capture/latest.json';
const HEX=/^[0-9a-f]{64}$/;
const object=(v: unknown):v is Record<string,any>=>!!v&&typeof v==='object'&&!Array.isArray(v);
async function digest(bytes:Uint8Array):Promise<string>{
 const hash=await crypto.subtle.digest('SHA-256',bytes as BufferSource);
 return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}
function pinnedUrl(value:unknown,commit:string):string{
 if(typeof value!=='string'||!value.startsWith(BASE+commit+'/claim-capture/'))throw Error('Artifact is not pinned to the declared release');
 const u=new URL(value);
 if(u.search||u.hash||u.href!==value||!u.pathname.startsWith('/datasets/csoai/councilof-ai-mirror/resolve/'+commit+'/claim-capture/')||decodeURIComponent(u.pathname).split('/').includes('..'))throw Error('Invalid artifact URL');
 return value;
}
export async function readClaimCapture(id:string,full:boolean,options:{fetchImpl?:typeof fetch;nowMs?:number}={}):Promise<Reading>{
 const population=CAPTURE_POPULATIONS[id];const sources=[POINTER];
 const absent=(reason:string,state:'UNMEASURED'|'UNCHECKABLE'='UNMEASURED'):Reading=>({state,n:null,n_unit:'captured source-scoped records',as_of:null,source:sources,reason,unmeasured:[reason],head:{capture_state:'UNAVAILABLE',truth_measured:false}});
 if(!population)return absent('No current capture adapter for this population');
 const fetchImpl=options.fetchImpl??fetch;
 async function bytes(url:string,limit:number):Promise<Uint8Array>{
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);
  try{
   const r=await fetchImpl(url,{headers:{accept:'application/json'},signal:controller.signal});
   if(!r.ok)throw Error(`Artifact HTTP ${r.status}`);
   if(Number(r.headers.get('content-length')||0)>limit)throw Error('Artifact exceeds size limit');
   if(!r.body)throw Error('Empty artifact response');
   const reader=r.body.getReader();const chunks:Uint8Array[]=[];let size=0;
   while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>limit){await reader.cancel();throw Error('Artifact exceeds size limit');}chunks.push(part.value);}
   const value=new Uint8Array(size);let offset=0;for(const chunk of chunks){value.set(chunk,offset);offset+=chunk.length;}return value;
  }finally{clearTimeout(timeout);}
 }
 try{
  const pointer=JSON.parse(new TextDecoder().decode(await bytes(POINTER,200000)));
  if(!object(pointer)||pointer.schema!=='csoai.claim-capture-pointer/0.1'||! /^[0-9a-f]{40}$/.test(pointer.hf_commit)||!HEX.test(pointer.release_sha256))return absent('Invalid capture pointer','UNCHECKABLE');
  const asOf=Date.parse(pointer.as_of);const now=options.nowMs??Date.now();
  if(!Number.isFinite(asOf)||asOf>now+300000||now-asOf>36*3600000)return absent('Capture is stale, future-dated, or has no usable observation time');
  const releaseUrl=pinnedUrl(pointer.release_url,pointer.hf_commit);sources.push(releaseUrl);
  const releaseBytes=await bytes(releaseUrl,1000000);
  if(await digest(releaseBytes)!==pointer.release_sha256)return absent('Release digest mismatch','UNCHECKABLE');
  const release=JSON.parse(new TextDecoder().decode(releaseBytes));const p=release.populations?.[population];
  if(!object(p)||release.run_id!==pointer.run_id||!Number.isSafeInteger(p.count)||p.count<1||!HEX.test(p.sha256))return absent('Capture metadata is incomplete','UNCHECKABLE');
  if(p.source_status&&p.source_status!=='OK')return absent('The capture source reported an error');
  const artifactUrl=pinnedUrl(BASE+pointer.hf_commit+'/claim-capture/'+p.path,pointer.hf_commit);sources.push(artifactUrl);
  const reading:Reading={state:'INDEXED',n:p.count,n_unit:population==='mcp_versions'?'MCP server-version records (not distinct servers)':'captured source-scoped records',as_of:p.as_of,source:sources,reason:null,unmeasured:['Truth of upstream claims is not independently measured by this capture'],head:{capture_state:'CLAIM_CAPTURED',capture_run_id:release.run_id,coverage:p.coverage,unique_entities:p.unique_entities,source_total_reported:p.source_total_reported,snapshot_merkle_root:release.snapshot_merkle_root,artifact_sha256:p.sha256,release_sha256:pointer.release_sha256,signature_state:release.signature_state??'UNKNOWN',signature_status_is_publisher_report:true,signature_key_id:release.signature_key_id??null,timestamp_status:release.anchor?.state??'UNKNOWN',timestamp_status_is_publisher_report:true,truth_measured:false,free_snapshot:pointer.snapshot_url,free_root:pointer.root_url,free_ots:pointer.ots_url??null,free_change_report:pointer.changes_url,not_a_frozen_universe_replacement:true}};
  if(!full)return reading;
  const raw=await bytes(artifactUrl,20000000);
  if(await digest(raw)!==p.sha256)return absent('Population slice digest mismatch','UNCHECKABLE');
  const slice=JSON.parse(new TextDecoder().decode(raw));
  if(slice.run_id!==release.run_id||slice.population!==population||!Array.isArray(slice.records)||slice.records.length!==p.count||slice.count!==p.count)return absent('Population slice count or identity mismatch','UNCHECKABLE');
  const ids=new Set(slice.records.map((r:any)=>r.subject_id));
  if(ids.size!==p.count||slice.records.some((r:any)=>r.population!==population||r.state!=='CLAIM_CAPTURED'))return absent('Duplicate or wrong-population records','UNCHECKABLE');
  reading.rows=slice;reading.rows_unit='Digest-verified upstream claim records from the pinned public capture; not verified truth';return reading;
 }catch(e){return absent(`Capture read failed: ${e instanceof Error?e.message:'unknown error'}`);}
}
