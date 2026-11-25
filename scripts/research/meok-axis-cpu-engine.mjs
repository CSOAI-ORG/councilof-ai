#!/usr/bin/env node
// Research-only read-only wrapper of the canonical specialist audit.
// No measurement, signing, publication, permissions or autonomous apply.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { auditSpecialist, validateCharterMap, sha256 } from "../axis-specialists.mjs";
const root=resolve(process.argv[2]||".");
const read=p=>JSON.parse(readFileSync(resolve(root,p),"utf8"));
const registry=read("council-os/axis-specialists/registry.json");
const snapshot=read("council-os/axis-specialists/board-2026-11-02.snapshot.json");
const index=read("public/axis-specialists/index.json");
const mapping=read("council-os/axis-specialists/charter-map.json");
const bytes=readFileSync(resolve(root,"public/.well-known/constitutional-harness.json"));
const charter=JSON.parse(bytes);
const digest=createHash("sha256").update(bytes).digest("hex");
const axes=registry.specialists.map(s=>s.axis);
const assert=(v,m)=>{if(!v)throw Error(m)};
const eq=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
assert(axes.length===new Set(axes).size && eq(axes,snapshot.axes.map(s=>s.axis))&&eq(axes,index.specialists.map(s=>s.axis)),"axis membership");
assert(!validateCharterMap({mapping,charter,digest},axes).length,"charter mapping");
assert(registry.cluster_model.shared_write_access===false && registry.rsi_contract.mode==="RECOMMENDATION_ONLY" && registry.human_gate.initial_decision==="HOLD","registry boundary");
const before=sha256(snapshot);const results=[];
for(const spec of registry.specialists){
 const row=snapshot.axes.find(x=>x.axis===spec.axis);
 const audit=auditSpecialist(spec,row,registry);
 const ctrl=[];
 const check=(candidate,id)=>auditSpecialist(spec,candidate,registry).checks.find(c=>c.id===id);
 for(const field of spec.required_fields){
  const missing={...row};delete missing[field];
  const c=check(missing,"AXIS_SPECIFIC_EVIDENCE");
  assert(c?.state==="FINDING"&&c.evidence.includes(field),"missing field "+spec.axis+" "+field);
  ctrl.push(field);
 }
 assert(check({...row,axis:"wrong-axis"},"AXIS_IDENTITY").state==="FINDING","wrong axis");
 assert(audit.human_gate.decision==="HOLD"&&audit.human_gate.may_apply===false,"human gate");
 assert(index.specialists.find(x=>x.axis===spec.axis).may_apply===false,"index gate");
 results.push({axis:spec.axis,source_row_sha256:sha256(row),source_status:row.status,
  required_field_controls:ctrl,identity_control:"PASSED",human_hold:"RETAINED",
  audit_findings:audit.checks.filter(c=>c.state==="FINDING").map(c=>c.id),
  domain_controls_state:"NOT_RUN_IN_THIS_WRAPPER",charter_articles:mapping.axes.find(a=>a.axis===spec.axis).articles});
}
assert(before===sha256(snapshot),"source mutated");
console.log("AXIS_CPU_RESULT "+JSON.stringify({state:"READ_ONLY_SPECIALIST_CPU_REPLAY",axes:results.length,
 required_field_controls:results.reduce((n,r)=>n+r.required_field_controls.length,0),
 identity_controls:results.length,hold_controls:results.length,source_snapshot_sha256:before,
 new_gspc_measurement:false,authorises_execution:false,results}));
