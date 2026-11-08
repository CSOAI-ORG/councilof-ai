// A separate view of the existing bounded, loopback-only rehearsal engine.
const el = id => document.getElementById(id);
let report = null, revision = 0, pending = false;
function status(text, error=false) {
  el("measurement-status").textContent=text;
  el("measurement-status").classList.toggle("error",error);
}
function clear() {
  revision++;report=null;el("measurement-download").disabled=true;
  el("measurement-counts").replaceChildren();el("measurement-rows").replaceChildren();
  el("measurement-summary").textContent="";el("measurement-source").textContent="No report selected.";
}
async function request(path, raw) {
  const response=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},
    body:raw,signal:AbortSignal.timeout(30000)});
  const data=await response.json();
  if(!response.ok)throw Error(data.error||"Measurement refused.");
  return data;
}
function render(value) {
  report=value;el("measurement-download").disabled=false;
  const labels={
    population_records_per_episode:"Synthetic records per episode",
    simulation_episodes:"Simulation episodes",
    simulated_record_instances:"Record instances across episodes",
    actual_model_calls:"Actual model calls",
    model_response_replays:"Recorded model responses replayed",
    consenting_human_participants:"Consenting human participants"
  };
  el("measurement-counts").replaceChildren(...Object.entries(labels).map(([key,label])=>{
    const span=document.createElement("span");span.textContent=label+": "+value.counters[key];return span;
  }));
  const s=value.summary;
  el("measurement-summary").textContent=(s.controls_pass?"Declared controls passed. ":"A declared control failed. ")+
    s.discriminating_pairs+" paired cases distinguish the rules. Candidate minus baseline revoked-evidence decisions: "+
    s.candidate_minus_baseline_revoked_decisions+". No model improvement or promotion is established.";
  el("measurement-rows").replaceChildren(...value.pairs.map(pair=>{
    const a=pair.runs.baseline.metrics,b=pair.runs["evidence-aware"].metrics;
    const tr=document.createElement("tr");
    for(const text of [pair.case+" / "+pair.scenario.seed,
      a.completed_decisions+" / "+b.completed_decisions,
      a.revoked_evidence_decisions+" / "+b.revoked_evidence_decisions,
      b.revoked_evidence_decision_rate===null?"Not estimable: no decisions":(b.revoked_evidence_decision_rate*100).toFixed(2)+"%",
      Object.values(pair.controls).every(Boolean)?"Pass":"Fail"]){
      const td=document.createElement("td");td.textContent=text;tr.append(td);
    }return tr;
  }));
  el("measurement-source").textContent=JSON.stringify({report_id:value.report_id,
    engine_fingerprint:value.engine_fingerprint,method:value.method,
    counters:value.counters,limits:value.limits},null,2);
}
el("measurement-form").addEventListener("input",()=>{
  clear();status("Inputs changed. Run the controls for these inputs.");
});
el("measurement-form").addEventListener("submit",async event=>{
  event.preventDefault();if(pending)return;clear();const own=revision;
  pending=true;el("measure").disabled=true;status("Running paired deterministic controls…");
  try{
    const f=new FormData(event.currentTarget),parts=String(f.get("seeds")).split(",").map(x=>x.trim());
    if(parts.some(x=>!/^\d+$/.test(x)))throw Error("Use comma-separated integer seeds.");
    const data=await request("/api/measure",JSON.stringify({population:Number(f.get("population")),
      rounds:Number(f.get("rounds")),seeds:parts.map(Number)}));
    if(own!==revision)return;render(data.report);status("Measurement recorded in "+data.elapsed_ms+" ms. Synthetic controls only.");
  }catch(error){if(own===revision)status(error.message,true);}
  finally{pending=false;el("measure").disabled=false;}
});
el("measurement-download").addEventListener("click",()=>{
  if(!report)return;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:"application/json"}));
  const a=document.createElement("a");a.href=url;a.download="council-rehearsal-measurement.json";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
el("measurement-reopen").addEventListener("change",async event=>{
  const file=event.target.files[0];clear();const own=revision;status("Replaying the original report…");
  try{
    if(!file||file.size>2*1024*1024)throw Error("Choose a JSON report smaller than 2 MiB.");
    const raw=await file.text();await request("/api/verify-measurement",raw);
    if(own!==revision)return;render(JSON.parse(raw));
    status("Replay match. Internal consistency only; no independent observer or human authority.");
  }catch(error){if(own===revision)status(error.message,true);}
  finally{event.target.value="";}
});
