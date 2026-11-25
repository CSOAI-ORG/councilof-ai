#!/usr/bin/env node
// Research-only bounded event handling, using existing registry and corpus metadata.
// No model calls, external effects, source writes, signed evidence or GSPC admission.
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {resolve} from "node:path";
import {performance} from "node:perf_hooks";
const root=resolve(process.argv[2]||".");
const read=p=>readFileSync(resolve(root,p));
const sha=b=>createHash("sha256").update(b).digest("hex");
const json=p=>JSON.parse(read(p));
const assert=(x,m)=>{if(!x)throw Error(m)};
const registry=json("council-os/axis-specialists/registry.json");
const mapping=json("council-os/axis-specialists/charter-map.json");
const axes=registry.specialists.map(x=>x.axis);
const valid=new Set(axes);
const charter=read("public/.well-known/constitutional-harness.json");
assert(axes.length===valid.size&&mapping.axes.length===axes.length&&mapping.axes.every(x=>valid.has(x.axis))&&new Set(mapping.axes.map(x=>x.axis)).size===axes.length,"axis mapping");
assert(sha(charter)===mapping.charter_sha256,"charter pin");
assert(registry.cluster_model.shared_write_access===false&&registry.human_gate.initial_decision==="HOLD"&&registry.rsi_contract.mode==="RECOMMENDATION_ONLY","registry boundary");
const frozen=json("public/interop/frozen-provision-hashes.json");
const pointer=json("public/interop/regulatory-inventory-latest.json");
assert(/^\/interop\/regulatory-inventory-[0-9a-f-]+\.json$/.test(pointer.index_url),"pointer scope");
const invBytes=read("public"+pointer.index_url);
assert(sha(invBytes)===pointer.index_sha256,"inventory pin");
const inventory=JSON.parse(invBytes);
const anchors=Object.entries(frozen.anchors).sort(([a],[b])=>a<b?-1:a>b?1:0);
assert(anchors.length===frozen.provisions&&anchors.length===inventory.counts.frozen_provision_counter,"manifest count");
assert(anchors.every(([id,d])=>/^\d{5}[RL]\d{4}:-?\d+$/.test(id)&&/^[a-f0-9]{64}$/.test(d)),"manifest shape");
const corpusRoot=sha(anchors.map(([id,d])=>id+d).join(""));
assert(corpusRoot===frozen.corpus_root&&corpusRoot===inventory.frozen_provisions.corpus_root,"manifest root");
assert(sha(read("public/interop/frozen-provision-hashes.json"))===inventory.frozen_provisions.evidence_sha256,"manifest file digest");
const assets=inventory.crosswalk_assets;
assert(assets.length===pointer.crosswalk_assets&&assets.length===inventory.counts.crosswalk_assets&&new Set(assets.map(x=>x.id)).size===assets.length,"asset inventory");
const types={};for(const a of assets)types[a.asset_type]=(types[a.asset_type]||0)+1;
const roles=["observe","countercheck","remeasure"];
// Each fixture carries a single synthetic epoch. The receiving queue binds
// exact task scope and revision; it cannot act on arbitrary instructions.
const key=e=>JSON.stringify([e.axis,e.source,e.epoch,e.digest,e.role]);
const digestFor=(axis,source,epoch)=>sha(JSON.stringify([axis,source,epoch]));
function event(axis,source,epoch,role="observe"){
 return {axis,source,epoch,digest:digestFor(axis,source,epoch),role};
}
function receive(e,ctx){
 if(!e||!valid.has(e.axis)||!roles.includes(e.role)||typeof e.source!=="string"||!Number.isSafeInteger(e.epoch)||e.epoch<0||e.digest!==digestFor(e.axis,e.source,e.epoch))return "HOLD_INVALID";
 if(ctx.cancelled)return "HOLD_CANCELLED";
 const binding=ctx.expected.get(JSON.stringify([e.axis,e.source]));
 if(binding!==e.epoch)return "HOLD_STALE_OR_UNKNOWN";
 const k=key(e);if(ctx.seen.has(k))return "DUPLICATE";
 const index=roles.indexOf(e.role);
 if(index>0&&!ctx.seen.has(key({...e,role:roles[index-1]})))return "HOLD_DEPENDENCY";
 if(ctx.seen.size>=ctx.cap)return "HOLD_BUDGET";
 ctx.seen.add(k);return "RESEARCH_ACCEPTED_NOT_AUTHORIZED";
}
function context(es,cap){return{expected:new Map(es.map(e=>[JSON.stringify([e.axis,e.source]),e.epoch])),seen:new Set(),cap,cancelled:false}}
function run(){
 const rows=[];let controls=0;
 for(const axis of axes){
  const e=event(axis,"fixture:"+axis,2);
  const c=context([e],3);
  assert(receive({...e,role:"countercheck"},c)==="HOLD_DEPENDENCY","out of order");controls++;
  assert(receive({...e,axis:"unknown"},c)==="HOLD_INVALID","wrong axis");controls++;
  assert(receive({...e,digest:"0".repeat(64)},c)==="HOLD_INVALID","wrong digest");controls++;
  assert(receive(event(axis,e.source,1),c)==="HOLD_STALE_OR_UNKNOWN","old revision");controls++;
  assert(receive(e,c)==="RESEARCH_ACCEPTED_NOT_AUTHORIZED","observe");controls++;
  assert(receive(e,c)==="DUPLICATE","repeat");controls++;
  for(const role of roles.slice(1)){assert(receive({...e,role},c)==="RESEARCH_ACCEPTED_NOT_AUTHORIZED","order");controls++}
  assert(c.seen.size===3,"cap");
  const small=context([e],1);
  receive(e,small);assert(receive({...e,role:"countercheck"},small)==="HOLD_BUDGET","budget");controls++;
  const stopped=context([e],3);stopped.cancelled=true;assert(receive(e,stopped)==="HOLD_CANCELLED","cancel");controls++;
  rows.push({axis,controls:10,terminal:"REVIEW_REQUIRED",may_apply:false});
 }
 // 100 revisions per axis, 3 identical delivery attempts per stage;
 // counts are synthetic workload, not real network or model benchmarks.
 const events=axes.flatMap(a=>Array.from({length:100},(_,i)=>event(a,"fixture:"+i,7)));
 const c=context(events,events.length*3);
 let duplicates=0,accepted=0,stale=0;const start=performance.now();
 for(const e of events){
  for(const role of roles){
   const msg={...e,role};
   for(let i=0;i<3;i++){
    const s=receive(msg,c);if(s==="DUPLICATE")duplicates++;else if(s==="RESEARCH_ACCEPTED_NOT_AUTHORIZED")accepted++;else throw Error(s);
   }
  }
  assert(receive(event(e.axis,e.source,6),c)==="HOLD_STALE_OR_UNKNOWN","stale flood");stale++;
 }
 const elapsed_ms=performance.now()-start;
 assert(accepted===events.length*3&&duplicates===accepted*2&&stale===events.length,"accounting");
 return{axes:rows,structural_controls:controls,synthetic_events:events.length,accepted_stages:accepted,duplicate_deliveries_suppressed:duplicates,stale_deliveries_held:stale,elapsed_ms};
}
console.log("REACTION_RESULT "+JSON.stringify({state:"BOUNDED_REACTION_RESEARCH",new_gspc_measurement:false,authorises_execution:false,registry_axes:axes.length,manifest_identifiers:anchors.length,corpus_root:corpusRoot,source_text_state:inventory.frozen_provisions.state,crosswalk_assets:assets.length,asset_types:types,source_inventory_sha256:sha(invBytes),...run()}));
