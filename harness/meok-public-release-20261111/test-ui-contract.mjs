// Actual public ui.mjs exercised with a minimal deterministic DOM and real core/weights.
// This is not a substitute for rendered browser acceptance.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
const ids=['status','predictions','metrics','comparisonJson','replayJson','replaySummary','routing','features','rowIndex','rowMeta','export','loadRow','worstRow','compare','replay','pins','mcpStatus'];
let nodes,downloads=[],held=null,hold=false,checks=[];
class Element{
 constructor(tag='div'){this.tagName=tag;this.value='';this.textContent='';this.disabled=true;this.children=[];this.listeners={};this.classList={toggle(){}};}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
 appendChild(child){this.children.push(child);return child;}
 replaceChildren(...children){this.children=children;}
 async fire(type){for(const fn of this.listeners[type]||[])await fn();}
 click(){if(this.tagName==='a')downloads.push(this.href);else return this.fire('click');}
}
Object.defineProperty(globalThis,'crypto',{value:{subtle:{digest:async(...args)=>{if(hold){hold=false;await new Promise(resolve=>held=resolve);}return webcrypto.subtle.digest(...args);}}},configurable:true});
function check(name,condition){assert.ok(condition,name);checks.push(name);}
async function setup({corrupt=false}={}){
 nodes=Object.fromEntries(ids.map(x=>[x,new Element()]));nodes.rowIndex.value='0';downloads=[];
 globalThis.document={getElementById:id=>nodes[id],createElement:tag=>new Element(tag)};
 globalThis.fetch=async path=>{
  if(path==='evidence/live-mcp.json')return new Response(JSON.stringify({status:'PASS'}));
  const data=await readFile(new URL(path,import.meta.url));
  return new Response(corrupt&&path==='model/weights.json'?Buffer.from('{}'):data);
 };
 await import('./ui.mjs?case='+Math.random());
}
const empty=()=>nodes.comparisonJson.textContent==='No current result.'&&nodes.export.disabled;
await setup();check('startup actual inference returned receipt',!nodes.export.disabled&&nodes.comparisonJson.textContent.includes('payload_sha256'));
const valid=nodes.features.value;
nodes.features.value='[';await nodes.features.fire('input');check('edit clears successful result and export',empty());check('edit clears prediction cells',nodes.predictions.children.length===1);
await nodes.compare.fire('click');check('malformed input cannot retain success',empty());check('malformed input reports error',nodes.status.textContent.length>0&&!nodes.status.textContent.includes('complete'));
nodes.features.value=valid;await nodes.features.fire('input');await nodes.compare.fire('click');check('valid input recovers after refusal',!nodes.export.disabled);
nodes.rowIndex.value='';await nodes.rowIndex.fire('input');await nodes.loadRow.fire('click');check('blank row is refused rather than row zero',empty()&&nodes.status.textContent.includes('integer'));
nodes.rowIndex.value='999';await nodes.loadRow.fire('click');check('out of range row refuses',empty());
nodes.rowIndex.value='0';await nodes.loadRow.fire('click');check('valid row recovers',!nodes.export.disabled);
// Hold only the next actual SHA-256 calculation, then edit the input while it is pending.
hold=true;held=null;const run=nodes.compare.fire('click');
for(let i=0;i<100&&!held;i++)await new Promise(r=>setTimeout(r,1));assert.ok(held);
nodes.features.value='[]';await nodes.features.fire('input');held();await run;
check('delayed receipt cannot overwrite edited input',empty());check('delayed completion preserves changed-input status',nodes.status.textContent.includes('Input changed'));
nodes.features.value=valid;await nodes.features.fire('input');await nodes.compare.fire('click');
await nodes.export.fire('click');check('current valid receipt can be exported',downloads.length===1);
nodes.features.value='[]';await nodes.features.fire('input');await nodes.export.fire('click');check('invalidated receipt cannot be exported',downloads.length===1);
await nodes.compare.fire('click');check('invalid dimensions clear old display',empty());
nodes.features.value=valid;await nodes.features.fire('input');await nodes.replay.fire('click');check('full replay still returns 560 rows',nodes.replaySummary.textContent.includes('560 transitions')&&!nodes.export.disabled);
const r=JSON.parse(nodes.replayJson.textContent);check('replay keeps unsigned boundary',r.signed===false||r.payload?.signed===false||JSON.stringify(r).includes('"signed":false'));
nodes.rowIndex.value='1';await nodes.rowIndex.fire('input');check('row selector change clears current export',empty());
await setup({corrupt:true});check('tampered weights refuse at startup',nodes.status.textContent.startsWith('Startup refused:')&&nodes.compare.disabled&&nodes.export.disabled);
const report={status:'PASS',checks:checks.length,assertions:checks,scope:'actual UI module with deterministic DOM adapter and real inference; not rendered browser acceptance',model_weights_changed:false};
await writeFile(new URL('ui-contract-results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
