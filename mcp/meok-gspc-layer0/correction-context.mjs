// SPDX-License-Identifier: Apache-2.0
// MEOK read-only public corrections and Layer-0 source projection.
// No credentials, arbitrary URLs, signing, execution, model calls, admission or persistence.
import {createHash} from 'node:crypto';

const SITE='https://councilof.ai';
const PATHS={
  corrections:'/api/corrections',
  root:'/root.json',
  witness:'/interop/root-witness-pointer.json',
};
const CAP=1_000_000;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const goodDate=x=>typeof x==='string'&& /^\d{4}-\d{2}-\d{2}T\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)$/.test(x)&&Number.isFinite(Date.parse(x));
const goodDay=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+'T00:00:00Z'));
const hex64=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const claimEnum=(value,allowed)=>typeof value==='string'&&allowed.includes(value)?value:'UNAVAILABLE';

async function fixedRead(path,fetchImpl,now){
  if(!Object.values(PATHS).includes(path))throw new Error('SOURCE_NOT_ALLOWED');
  const url=SITE+path;
  let r,reader;
  try {
    r=await fetchImpl(url,{method:'GET',credentials:'omit',redirect:'error',cache:'no-store',
      headers:{accept:'application/json'},signal:AbortSignal.timeout(6000)});
    if(!r.ok||r.redirected||(r.url&&r.url!==url))throw Error('SOURCE_UNAVAILABLE');
    if(!/^application\/(?:[\w.+-]+\+)?json[ \t]*(?:;|$)/i.test(r.headers.get('content-type')||''))
      throw Error('SOURCE_NOT_JSON');
    const size=r.headers.get('content-length');
    if(size&&(!/^\d+$/.test(size)||Number(size)>CAP))throw Error('SOURCE_TOO_LARGE');
    if(!r.body?.getReader)throw Error('SOURCE_UNREADABLE');
    reader=r.body.getReader();
    let total=0;const chunks=[];
    while(true){
      const x=await reader.read();
      if(x.done)break;
      total+=x.value.byteLength;
      if(total>CAP)throw Error('SOURCE_TOO_LARGE');
      chunks.push(Buffer.from(x.value));
    }
    const bytes=Buffer.concat(chunks,total);
    return {json:JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)),
      source:{url,bytes:total,bytes_sha256:sha(bytes),read_at:now().toISOString(),
        issuer_signature:'NOT_VERIFIED_BY_THIS_READER'}};
  }finally{
    if(reader)await reader.cancel().catch(()=>{});
    else await r?.body?.cancel().catch(()=>{});
  }
}

function correctionCounts(rows){
  if(!Array.isArray(rows)||rows.length===0||rows.length>10000)throw Error('INVALID_CORRECTIONS');
  const ids=new Set(),types={EXACT_SOURCE_DECLARED:0,WINDOW_BOUNDED_SOURCE_DECLARED:0,UNMEASURED:0};
  for(const row of rows){
    if(!isObject(row)||typeof row.id!=='string'||!row.id||row.id.length>100||ids.has(row.id))
      throw Error('INVALID_CORRECTION_ID');
    ids.add(row.id);
    const pub=goodDate(row.published_at),det=goodDate(row.detected_at);
    const day=goodDay(row.detected_at);
    const windowStart=isObject(row.detected_window)&&goodDate(row.detected_window.not_before);
    if(pub&&det)types.EXACT_SOURCE_DECLARED++;
    else if(pub&&(day||windowStart))types.WINDOW_BOUNDED_SOURCE_DECLARED++;
    else types.UNMEASURED++;
  }
  return types;
}

export async function readMeokCorrectionEvidence(args={}, {fetchImpl=fetch,now=()=>new Date()}={}){
  if(!isObject(args)||Object.keys(args).some(k=>k!=='correction_id')||
      (args.correction_id!==undefined&&(typeof args.correction_id!=='string'||
        !/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(args.correction_id))))
    throw new TypeError('Only one bounded public correction_id is permitted.');
  const observed=now();
  if(!(observed instanceof Date)||!Number.isFinite(observed.getTime()))throw new TypeError('Invalid observation clock');
  const base={
    state:'UNCHECKABLE',reason:null,source:null,corrections:null,selected:null,
    layer0:{source:null,declared_root:null,declared_witness:null,
      root_signature:'NOT_VERIFIED',root_merkle:'NOT_VERIFIED',
      correction_to_root_inclusion:'NOT_VERIFIED',
      ots:'NOT_VERIFIED',rekor:'NOT_VERIFIED'},
    control:{surface:'MEOK_READ_ONLY_PUBLIC_REFERENCE',
      evidence_event_schema:'csoai.evidence-event/0.1',
      canonical_event_created:false,
      measured_gspc_axis_created:false,
      signed_correction_created:false,
      authenticated_human_decision:false,
      approved_executor:false,downstream_effect:'NOT_MEASURED',
      model_weight_update:false,grants_tool_authority:false},
    limits:[
      'The source declarations do not establish a publisher-independent verified correction or a first-publication time.',
      'This tool computes no signature, root inclusion, OpenTimestamps or Rekor proof; use canonical independent verifiers.',
      'An observed public row is not an authorised human decision, an accepted external effect or an admitted GSPC score.',
      'No historical publication timestamp is inferred from a retrieval, signer, source commit or witness event.',
    ],
  };
  const correction=await fixedRead(PATHS.corrections,fetchImpl,now).catch(()=>null);
  if(!correction)return {...base,reason:'CORRECTIONS_READ_UNAVAILABLE'};
  if(!isObject(correction.json)||correction.json.schema!=='csoai.corrections/0.1')
    return {...base,reason:'CORRECTIONS_CONTRACT_INVALID'};
  let counts;
  try{counts=correctionCounts(correction.json.corrections);}
  catch{return {...base,reason:'CORRECTIONS_CONTRACT_INVALID'};}
  const all=correction.json.corrections;
  const match=args.correction_id===undefined?null:all.find(r=>r.id===args.correction_id);
  const chosen=match?{
    id:match.id,
    record_date:goodDay(match.date)?match.date:null,
    record_sha256:sha(Buffer.from(JSON.stringify(match))),
    published_at_source_claim:goodDate(match.published_at)?match.published_at:'UNRECORDED',
    detection_time_source_claim:goodDate(match.detected_at)||goodDay(match.detected_at)?match.detected_at:'UNRECORDED',
    exact_publication_time_independently_confirmed:false,
    recipient_effect:'NOT_MEASURED',
  }:null;
  const result={...base,state:'PUBLIC_SOURCE_OBSERVED',source:correction.source,
    corrections:{n_records:all.length,declared_source_signature_state:
      typeof correction.json.signature_state==='string'?correction.json.signature_state:'UNAVAILABLE',
      source_signature_checked_by_this_tool:false,
      publication_time_unknown:all.filter(r=>!goodDate(r.published_at)).length,
      timing_classes:counts},
    selected:chosen,
    reason:args.correction_id!==undefined&&!chosen?'CORRECTION_ID_NOT_FOUND':null,
  };
  const [root,witness]=await Promise.allSettled([
    fixedRead(PATHS.root,fetchImpl,now),
    fixedRead(PATHS.witness,fetchImpl,now),
  ]);
  if(root.status==='fulfilled'&&isObject(root.value.json)){
    const j=root.value.json;
    const validShape=j.kind==='csoai.public-root/v1'&&typeof j.merkle_root==='string'&&
      /^[a-f0-9]{64}$/.test(j.merkle_root)&&Number.isSafeInteger(j.card_count)&&j.card_count>=0&&
      Array.isArray(j.card_sha256)&&j.card_sha256.length===j.card_count;
    if(validShape){
      result.layer0.source=root.value.source;
      result.layer0.declared_root={merkle_root:j.merkle_root,card_count:j.card_count,
        as_of:typeof j.as_of==='string'?j.as_of:null,signature_source_assertion_present:typeof j.sig_ed25519==='string'};
    }
  }
  if(witness.status==='fulfilled'&&isObject(witness.value.json)){
    const v=witness.value.json;
    // A witness declaration is about specific earlier bytes and a dated observation;
    // never project its positive status beside a different root without its subject/drift.
    const subject=isObject(v.live_root)?v.live_root:{};
    const drift=isObject(v.drift)?v.drift:{};
    const conflict=isObject(v.conflict)?v.conflict:{};
    const subjectSha=hex64(subject.sha256)?subject.sha256:null;
    const subjectMerkle=hex64(subject.merkle_root)?subject.merkle_root:null;
    const observedSha=result.layer0.source?.bytes_sha256??null;
    const observedMerkle=result.layer0.declared_root?.merkle_root??null;
    result.layer0.declared_witness={
      source:witness.value.source,
      witnessed_subject_source_claim:{
        root_bytes_sha256:subjectSha,
        merkle_root:subjectMerkle,
        as_of:goodDate(subject.as_of)?subject.as_of:null,
        card_count:Number.isSafeInteger(subject.card_count)&&subject.card_count>=0?subject.card_count:null,
      },
      witness_status_observed_at_source_claim:
        goodDate(v.witness_status_observed_at)?v.witness_status_observed_at:null,
      rekor_state_source_claim:claimEnum(v.witnesses?.rekor,['WITNESSED','NOT_YET','UNAVAILABLE']),
      ots_state_source_claim:claimEnum(v.witnesses?.ots,['CONFIRMED_BITCOIN','NOT_YET','UNAVAILABLE']),
      source_drift:{
        status:claimEnum(drift.status,['DRIFTED','MATCHED','NO_DRIFT','UNAVAILABLE']),
        checked_at:goodDate(drift.checked_at)?drift.checked_at:null,
        witnessed_root_bytes_sha256:hex64(drift.witness_artifact_sha256)?drift.witness_artifact_sha256:null,
        checked_live_root_bytes_sha256:hex64(drift.live_root_sha256)?drift.live_root_sha256:null,
        match_sha256:typeof drift.match_sha256==='boolean'?drift.match_sha256:null,
        match_merkle_root:typeof drift.match_merkle_root==='boolean'?drift.match_merkle_root:null,
      },
      source_conflict:{
        status:claimEnum(conflict.status,['NONE','CONFLICT','UNAVAILABLE']),
        as_of:goodDate(conflict.as_of)?conflict.as_of:null,
        merkle_root:hex64(conflict.merkle_root)?conflict.merkle_root:null,
      },
      observed_root_bytes_match_witness_subject:
        subjectSha&&observedSha?subjectSha===observedSha:null,
      observed_root_merkle_match_witness_subject:
        subjectMerkle&&observedMerkle?subjectMerkle===observedMerkle:null,
    };
  }
  return result;
}
