const $ = id => document.getElementById(id);
let current = null, generation = 0, compareFiles = [null, null], busy = false;
const MAX = 2 * 1024 * 1024;

async function api(path, value) {
  const response = await fetch(path, {method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify(value), signal:AbortSignal.timeout(15000)});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "The local service refused this input.");
  return result;
}
function notice(id, text, error = false) {
  $(id).textContent = text; $(id).classList.toggle("error", error);
}
function reset() {
  generation++; current = null; $("download").disabled = true; $("tick").disabled = true;
  $("events").disabled=true;
  $("rows").replaceChildren(); $("counts").replaceChildren(); $("messages").replaceChildren();
  $("frame").textContent = "No result yet."; $("trace").textContent = "No trace.";
  $("sample").textContent = "The globe will show up to 120 synthetic records.";
  $("node").replaceChildren();$("node").disabled=true;
  $("node-detail").textContent="Choose a sampled record after running.";
  $("lesson").textContent = "Run the two interventions, then compare the exported bundles.";
  for (const id of ["reopen", "first", "second"]) $(id).value = "";
  compareFiles = [null, null]; $("compare").disabled = true;
  clearComparison();notice("export-result","Canonical export remains local and unsigned.");
  notice("verify-result", "No saved bundle checked.");
  notice("compare-result", "Use the same seed and population for both interventions.");
  notice("status", "Ready. Select an intervention and run."); draw(null, 0);
}
function draw(core, tick) {
  const canvas = $("globe"), ctx = canvas.getContext("2d"), x = 320, y = 216, r = 190;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#e3eee7"; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#afc8b7"; ctx.lineWidth = 1;
  for (let n = -2; n <= 2; n++) {
    ctx.beginPath(); ctx.ellipse(x,y,r*Math.cos(n*.34),r*Math.abs(Math.sin(n*.34))+.5,0,0,Math.PI*2);ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x,y,r*Math.abs(Math.sin(n*.34))+.5,r,0,0,Math.PI*2);ctx.stroke();
  }
  if (!core) return;
  const colors = ["#c68038", "#227868", "#416c9a"];
  for (const node of core.sampled_nodes) {
    // Orthographic globe projection follows the existing Council WorldGlobe convention.
    const lat=node.lat*Math.PI/180, lon=(node.lng+Number($("rotation").value))*Math.PI/180;
    if (Math.cos(lat)*Math.cos(lon)<0) continue;
    const px=x+r*Math.cos(lat)*Math.sin(lon), py=y-r*Math.sin(lat);
    ctx.fillStyle=colors[node.profile];ctx.beginPath();ctx.arc(px,py,4,0,Math.PI*2);ctx.fill();
  }
}
function render(bundle, messages = []) {
  current = bundle; const core = bundle.core;
  for(const [name,value] of Object.entries(core.config)){
    const input=$("scenario").elements.namedItem(name);if(input)input.value=String(value);
  }
  $("download").disabled = false; $("tick").disabled = false;$("events").disabled=false;
  $("tick").max = core.frames.length - 1; $("tick").value = core.frames.length - 1;
  $("sample").textContent = `Sample: ${core.sampled_nodes.length} of ${core.config.population} synthetic records; the current hemisphere is visible. Colours show fixture preferences; positions are illustrative.`;
  $("node").replaceChildren(...core.sampled_nodes.map((node,index)=>{
    const option=document.createElement("option");option.value=index;option.textContent=node.id;return option;
  }));$("node").disabled=false;
  $("counts").replaceChildren(...Object.entries(core.counters).map(([key,value])=>{
    const el=document.createElement("span");el.textContent=`${key.replaceAll("_"," ")}: ${value}`;return el;
  }));
  $("messages").replaceChildren(...messages.map(message=>{
    const box=document.createElement("div");box.className="message";
    const who=document.createElement("strong");who.textContent=message.from;
    const text=document.createElement("p");text.textContent=message.text;box.append(who,text);return box;
  }));
  if (!messages.length) notice("messages", "Reopened evidence. Live message delivery was not re-created.");
  $("lesson").textContent=core.lesson;
  $("trace").textContent=JSON.stringify(core.trace,null,2);
  $("rows").replaceChildren(...core.frames.map(frame=>{
    const tr=document.createElement("tr");
    for(const value of [frame.tick,...frame.counts,frame.undecided,frame.permit,frame.revoked_A_selected,frame.new_revoked_A_selections]){
      const td=document.createElement("td");td.textContent=value;tr.append(td);
    } return tr;
  })); frame();
}
function frame() {
  if (!current) return;
  const core=current.core, f=core.frames[Number($("tick").value)];
  $("frame").textContent=`Tick ${f.tick}: supplier A evidence is ${f.evidence_A}; update permit ${f.permit}. Retained revoked-A selections: ${f.revoked_A_selected}; new revoked-A selections: ${f.new_revoked_A_selections}.`;
  const index=Number($("node").value),node=core.sampled_nodes[index];
  if(node){const choice=f.sample_choices[index];$("node-detail").textContent=`${node.id}: fixture preference ${node.profile+1}; selection ${choice<0?"undecided":core.suppliers[choice].label} at tick ${f.tick}.`;}
  draw(core,f.tick);
}
async function readFile(file) {
  if (!file || file.size > MAX) throw new Error("Choose a JSON bundle smaller than 2 MiB.");
  // Send original text through the strict server decoder, preserving duplicate-key refusal.
  const raw=await file.text();
  const response=await fetch("/api/verify",{method:"POST",headers:{"Content-Type":"application/json"},
    body:raw,signal:AbortSignal.timeout(15000)});
  const verdict=await response.json();
  if(!response.ok) throw new Error(verdict.error || "The bundle could not be replayed.");
  return JSON.parse(raw);
}
$("scenario").addEventListener("submit",async event=>{
  event.preventDefault();if(busy)return;reset();const own=++generation;busy=true;$("run").disabled=true;
  notice("status","Running the local fixture…");
  const values=new FormData(event.currentTarget);
  try{
    const result=await api("/api/run",{population:Number(values.get("population")),
      seed:Number(values.get("seed")),intervention:values.get("intervention"),
      rounds:Number(values.get("rounds")),revocation_tick:Number(values.get("revocation_tick")),
      permit_expires_tick:Number(values.get("permit_expires_tick"))});
    if(own!==generation)return;
    render(result.bundle,result.messages);notice("status",`Rehearsal recorded locally in ${result.elapsed_ms} ms. Model calls: 0.`);
  }catch(error){if(own===generation)notice("status",error.message,true);}
  finally{busy=false;$("run").disabled=false;}
});
$("scenario").addEventListener("input",reset);
$("clear").addEventListener("click",reset);$("tick").addEventListener("input",frame);
$("rotation").addEventListener("input",frame);$("node").addEventListener("change",frame);
function save(text,name,type){
  const url=URL.createObjectURL(new Blob([text],{type}));
  const a=document.createElement("a");a.href=url;a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$("download").addEventListener("click",()=>{
  if(current)save(JSON.stringify(current,null,2),"council-rehearsal-bundle.json","application/json");
});
$("events").addEventListener("click",async()=>{
  if(!current)return;const own=generation,bundle=current;$("events").disabled=true;
  notice("export-result","Replaying the bundle before canonical export…");
  try{const result=await api("/api/events",bundle);if(own!==generation||current!==bundle)return;
    save(result.jsonl,"council-rehearsal-events.jsonl","application/x-ndjson");
    notice("export-result",`${result.event_count} canonical event exported locally. Unsigned and UNMEASURED; keep the original bundle for replay.`);
  }catch(error){if(own===generation)notice("export-result",error.message,true);}
  finally{if(own===generation&&current)$("events").disabled=false;}
});
$("reopen").addEventListener("change",async event=>{
  const file=event.target.files[0];reset();const own=++generation;
  notice("verify-result","Checking original saved bytes against deterministic replay…");
  try{const bundle=await readFile(file);if(own!==generation)return;
    render(bundle);notice("verify-result","Replay match. Unsigned fixture; human authority and external effect remain unverified.");
  }catch(error){if(own===generation)notice("verify-result",error.message,true);}
});
for(const [index,id] of ["first","second"].entries())$(id).addEventListener("change",event=>{
  compareFiles[index]=event.target.files[0]||null;
  clearComparison();
  notice("compare-result","Comparison inputs changed. No previous verdict applies.");
  $("compare").disabled=!compareFiles.every(Boolean);generation++;
});
function clearComparison(){
  $("comparison-rows").replaceChildren();$("comparison-table").hidden=true;
}
function showComparison(result){
  const explanations={
    IDENTICAL_INTERVENTIONS:"The interventions are identical; this does not isolate an intervention effect.",
    NO_REVOCATION_WINDOW:"No revoked-evidence window was tested.",
    NO_DECISIONS_AFTER_REVOCATION:"No new decisions were permitted after revocation. Zero new exposures does not show that the intervention worked.",
    NO_DIFFERENCE_OBSERVED:"No difference was observed in permitted synthetic updates.",
    SYNTHETIC_DIFFERENCE_OBSERVED:"A difference was observed under these declared synthetic rules."
  };
  notice("compare-result",`Comparable fixtures. Change in new revoked-A selection updates: ${result.new_revoked_A_selection_delta}. ${explanations[result.assessment]} Counts are record-ticks, not unique people or real actions.`);
  $("comparison-rows").replaceChildren(...result.timeline.map(row=>{
    const tr=document.createElement("tr");for(const value of [row.tick,row.permit,row.first_new_revoked_A,row.second_new_revoked_A,row.delta]){
      const td=document.createElement("td");td.textContent=value;tr.append(td);
    }return tr;
  }));$("comparison-table").hidden=false;
}
$("compare").addEventListener("click",async()=>{
  const own=++generation;clearComparison();notice("compare-result","Replaying both original bundles…");
  try{
    const first=await readFile(compareFiles[0]),second=await readFile(compareFiles[1]);
    if(own!==generation)return;const result=await api("/api/compare",[first,second]);
    if(own!==generation)return;
    showComparison(result);
  }catch(error){if(own===generation)notice("compare-result",error.message,true);}
});
reset();
