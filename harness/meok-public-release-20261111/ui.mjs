import {WEIGHTS_SHA,TEST_SHA,validateModel,compare,replay,receipt,verifyBytes} from './core.mjs';
const $=id=>document.getElementById(id);
const labels={raw_neural:'Raw learned model',constrained_neural:'Learned + constraints',persistence:'No-change baseline',exact_synthetic_rule:'Exact synthetic rule'};
let model,rows,last=null,referenceRow=null,busy=false,generation=0;
const enc=new TextDecoder();
function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
function placeholder(id,span,text){const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=span;cell.textContent=text;row.appendChild(cell);$(id).replaceChildren(row);}
function invalidate(reason){
 generation++;last=null;$('export').disabled=true;
 placeholder('predictions',5,'No current comparison. Run inference for the selected input.');
 placeholder('metrics',4,'No current replay. Run the retained test bank.');
 $('comparisonJson').textContent='No current result.';$('replayJson').textContent='No current replay.';$('replaySummary').textContent='';
 $('routing').textContent='No result is selected. A prediction never authorises an action.';
 if(reason)status(reason);
 return generation;
}
async function getVerified(path,hash,maxBytes){const r=await fetch(path,{cache:'no-cache'});if(!r.ok)throw Error('Cannot load '+path);const b=await r.arrayBuffer();if(b.byteLength>maxBytes)throw Error('Artifact exceeds size bound.');await verifyBytes(b,hash);return enc.decode(b);}
function rowNumber(){const text=$('rowIndex').value.trim(),n=Number(text);if(!text||!Number.isInteger(n)||n<0||n>=560)throw Error('Row must be an integer from 0 to 559.');return n;}
function loadRow(){const n=rowNumber();referenceRow=rows[n];$('features').value=JSON.stringify(referenceRow.features);$('rowMeta').textContent=`Row ${n} · episode ${referenceRow.episode} · tick ${referenceRow.tick} · retained synthetic reference`;}
function cell(tr,value,heading=false){const el=document.createElement(heading?'th':'td');el.textContent=value;tr.appendChild(el);}
function showPredictions(result){const body=$('predictions');body.replaceChildren();const all={...result.outputs};if(result.reference)all.reference=result.reference;for(const [key,values]of Object.entries(all)){const tr=document.createElement('tr');cell(tr,labels[key]||'Retained engine target',true);for(const n of values)cell(tr,(n*100).toFixed(2)+'%');body.appendChild(tr);}$('routing').textContent='Selected inside the synthetic task: exact rule. Learned outputs are advisory; no real action or approval is issued.';}
async function runCompare(ticket){
 const text=$('features').value;if(text.length>4096)throw Error('Feature JSON exceeds input limit.');
 const x=JSON.parse(text),hasReference=referenceRow&&JSON.stringify(x)===JSON.stringify(referenceRow.features);
 const result=compare(model,x,hasReference?referenceRow.target:null),candidate=await receipt(result);
 // Hashing is asynchronous: edited inputs invalidate even an otherwise valid delayed answer.
 if(ticket!==generation||text!==$('features').value)return;
 last=candidate;showPredictions(result);$('comparisonJson').textContent=JSON.stringify(last,null,2);$('export').disabled=false;
 status(hasReference?'Actual model inference complete; compared with a retained synthetic engine row.':'Actual model inference complete; custom input has no observed reference target.');
}
async function runReplay(ticket){
 status('Running the frozen test bank on this browser…');await new Promise(r=>setTimeout(r,0));if(ticket!==generation)return;
 const result=replay(model,rows),candidate=await receipt(result);if(ticket!==generation)return;
 last=candidate;const body=$('metrics');body.replaceChildren();for(const [key,m]of Object.entries(result.metrics)){const tr=document.createElement('tr');cell(tr,labels[key],true);cell(tr,(m.mae*100).toFixed(4)+' pp');cell(tr,(m.max_abs_error*100).toFixed(4)+' pp');cell(tr,(m.out_of_range_fraction*100).toFixed(2)+'%');body.appendChild(tr);}
 $('replayJson').textContent=JSON.stringify(last,null,2);$('replaySummary').textContent=`Completed ${result.rows} transitions from ${result.episodes} episodes. ${result.expiry_rows} expired-permit rows. No new training or model-provider requests.`;
 $('export').disabled=false;status('Replay complete. Exact rules win on this known synthetic process; learned errors remain visible.');
}
function bind(id,fn){$(id).addEventListener('click',async()=>{
 if(busy)return;busy=true;$(id).disabled=true;const ticket=invalidate();
 try{await fn(ticket);}catch(e){if(ticket===generation){invalidate();status(e.message||'Operation failed; no result accepted.',true);}}
 finally{busy=false;$(id).disabled=false;}
});}
bind('loadRow',async ticket=>{loadRow();await runCompare(ticket);});bind('compare',runCompare);bind('replay',runReplay);
bind('worstRow',async ticket=>{let worst=0,index=0;rows.forEach((r,i)=>{const e=compare(model,r.features,r.target).errors.constrained_neural.max_abs_error;if(e>worst){worst=e;index=i;}});$('rowIndex').value=String(index);loadRow();await runCompare(ticket);});
$('features').addEventListener('input',()=>{invalidate('Input changed. Run inference again; previous results are no longer current.');$('rowMeta').textContent='Edited feature input; reference is used only if it exactly matches the loaded row.';});
$('rowIndex').addEventListener('input',()=>{invalidate('Row selection changed. Load the selected row before using a result.');$('rowMeta').textContent='New row selection has not been loaded.';});
$('export').addEventListener('click',()=>{if(!last||busy)return;const url=URL.createObjectURL(new Blob([JSON.stringify(last,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='meok-hybrid-receipt-v02.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
try{
 const [weightText,rowText]=await Promise.all([getVerified('model/weights.json',WEIGHTS_SHA,262144),getVerified('data/test.jsonl',TEST_SHA,262144)]);
 model=validateModel(JSON.parse(weightText));rows=rowText.trim().split('\n').map(JSON.parse);if(rows.length!==560)throw Error('Wrong test bank size.');
 $('pins').textContent=JSON.stringify({weights_sha256:WEIGHTS_SHA,test_sha256:TEST_SHA},null,2);
 for(const id of ['loadRow','worstRow','compare','replay'])$(id).disabled=false;
 const ticket=invalidate();$('rowIndex').value=String(Math.max(0,rows.findIndex(r=>r.features[8]>0&&r.features[9]===1)));loadRow();await runCompare(ticket);
 try{const r=await fetch('evidence/live-mcp.json');if(r.ok){const evidence=await r.json();$('mcpStatus').textContent=evidence.status==='PASS'?'Retained live check: MCP handshake, real inference and refusal checks passed. Private authentication remains required.':'Live MCP verification was not completed; see the evidence file.';}}catch{}
}catch(e){invalidate();status('Startup refused: '+e.message,true);for(const id of ['loadRow','worstRow','compare','replay','export'])$(id).disabled=true;}
