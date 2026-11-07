/** Dated source projections. No live chain read or verification is performed here. */
export const COVERAGE_SOURCES = [
  {id:'stablecoin-index',label:'Stablecoin universe',url:'/interop/stablecoin-universe-2026-09/index.json'},
  {id:'stablecoin-supply',label:'Recorded supply observations',url:'/interop/stablecoin-universe-supply-2026-09-16.json'},
  {id:'mcp',label:'MCP registry',url:'/api/mcp'},
  {id:'discovery',label:'Agent discovery: cards versus services',url:'/interop/agent-discovery-census.json'},
  {id:'x402',label:'x402 response census',url:'/interop/x402-trust/latest.json'},
  {id:'layer0',label:'Layer 0 witness record',url:'/interop/root-witness-latest.json'},
  {id:'api',label:'API description',url:'/openapi.json'},
] as const;
export interface CoverageReadout { count:number|null; unit:string; asOf:string|null; detail:string; caveat:string }
const object=(v:unknown):Record<string,any>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
const integer=(v:unknown):number|null=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0?v:null;
const text=(v:unknown):string|null=>typeof v==='string'&&v?v:null;
function rows(doc:Record<string,any>,key:string,id:string):Record<string,any>[] {
 if(!Array.isArray(doc[key]))throw new Error('Required collection missing');
 const seen=new Set<string>();
 for(const row of doc[key]){const r=object(row),v=r[id];if((typeof v!=='string'&&typeof v!=='number')||typeof v==='number'&&!Number.isFinite(v)||String(v)===''||seen.has(String(v)))throw new Error('Missing or duplicate identity');seen.add(String(v));}
 return doc[key];
}
function tally(values:Record<string,any>[],key:string):string {
 const result=new Map<string,number>();for(const r of values){const state=text(r[key])??'NOT_RECORDED';result.set(state,(result.get(state)??0)+1);}
 return [...result].sort(([a],[b])=>a.localeCompare(b)).map(([s,n])=>`${n} recorded ${s}`).join(' · ')||'Empty collection';
}
export function parseCoverage(id:string,value:unknown):CoverageReadout {
 const d=object(value),asOf=text(d.as_of)??text(d.observed_at)??text(d.probe_finished);
 if(id==='stablecoin-index'){
  if(d.schema!=='csoai.stablecoin-index.v1')throw new Error('Unexpected stablecoin index schema');
  const a=rows(d,'assets','id');return {count:a.length,unit:'registry asset identities',asOf,detail:tally(a,'deep_measurement_state'),caveat:'Frozen registry membership. An indexed asset is not a current reserve, redemption or safety assessment.'};
 }
 if(id==='stablecoin-supply'){
  if(d.schema!=='csoai.stablecoin-universe-supply/0.1')throw new Error('Unexpected supply schema');
  const a=rows(d,'rows','asset_id');return {count:a.length,unit:'asset identities in this supply snapshot',asOf,detail:tally(a,'state'),caveat:'States are quoted from this dated source, not independently re-verified here. Fetching it does not rerun on-chain reads. Supply is not reserves; no cross-chain total is computed.'};
 }
 if(id==='mcp'){
  if(d.schema!=='csoai.mcp-registry/1')throw new Error('Unexpected MCP registry schema');
  const a=rows(d,'servers','id');return {count:a.length,unit:'registry entries, including aliases',asOf,detail:tally(a,'status'),caveat:'Registry metadata is not fresh MCP conformance. Aliases and catalogued-but-unprobed entries are not distinct reachable servers.'};
 }
 if(id==='discovery'){
  if(d.schema!=='csoai.agent-discovery-census/0.2'||d.measurement_state!=='NO_NEW_EXECUTION_OR_CONFORMANCE_TEST')throw new Error('Unexpected discovery audit schema or scope');
  const cards=rows(d,'canonical_agent_cards','candidate_path'),skills=rows(d,'tool_scoped_cards','candidate_path');
  const paths=new Set<string>();
  for(const record of [...cards,...skills]){
   if(record.state!=='LOCAL_AGENT_CARD_SHAPE'||record.declared_executable!==false||record.execution!=='NOT_TESTED'||!Array.isArray(record.interface_paths))throw new Error('Discovery card must retain non-execution scope');
   for(const p of record.interface_paths){if(typeof p!=='string'||!p.startsWith('/')||p.startsWith('//')||p.includes('..')||p.includes('\\'))throw new Error('Invalid local interface path');paths.add(p);}
  }
  const c=object(d.counts);
  if(c.canonical_service_cards!==cards.length||c.tool_scoped_card_records!==skills.length||c.distinct_declared_interface_paths!==paths.size||c.executed_agents!==null)throw new Error('Discovery denominator or execution claim mismatch');
  return {count:paths.size,unit:'distinct declared service-interface paths',asOf:null,detail:`${cards.length} canonical card record(s) · ${skills.length} tool-scoped card record(s) · execution NOT TESTED`,caveat:'Local descriptor inspection, not a census of deployed agents. Multiple tool cards may share one service. No vendor affiliation, working integration, independent agent population or fresh conformance result is established.'};
 }
 if(id==='x402'){
  if(d.kind!=='csoai.x402-catalog-trust-snapshot/0.1')throw new Error('Unexpected x402 source');
  return {count:integer(object(d.counts).total),unit:'endpoints reported in this census',asOf,detail:'HTTP response census; open the report for the original categories and method.',caveat:'A 402 challenge is not delivery, payment or settlement. The aggregate is the report author’s count, not a row-level recount by this view.'};
 }
 if(id==='layer0'){
  if(d.kind!=='csoai.root-witness/v1')throw new Error('Unexpected root-witness schema');
  const w=object(d.witnesses);return {count:null,unit:'witness status',asOf,detail:`OTS: ${text(object(w.ots).status)??'NOT_RECORDED'} · Rekor: ${text(object(w.rekor).status)??'NOT_RECORDED'}`,caveat:'Reported witness states only. A fetch is not signature, inclusion-proof or chain verification. Use the verifier and retain the exact subject digest.'};
 }
 if(id==='api'){
  if(typeof d.openapi!=='string'||!d.openapi.startsWith('3.')||!Object.keys(object(d.paths)).length)throw new Error('Unexpected OpenAPI document');
  return {count:Object.keys(d.paths).length,unit:'declared API paths',asOf,detail:`OpenAPI ${d.openapi}`,caveat:'A description is not an execution test. No declared endpoint is invoked by opening this catalogue.'};
 }
 throw new Error('Unknown coverage source');
}
