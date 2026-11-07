import {useEffect,useState} from 'react';
import {COVERAGE_SOURCES,parseCoverage,type CoverageReadout} from '@/lib/observatoryCoverage';
import {freshness} from '@/lib/gspcObservatory';
interface Result {id:string;label:string;url:string;value:CoverageReadout|null;error:string|null}
export default function ObservatoryCoverage(){
 const [opened,setOpened]=useState(false),[attempt,setAttempt]=useState(0),[loading,setLoading]=useState(false),[results,setResults]=useState<Result[]>([]),[readAt,setReadAt]=useState<number|null>(null);
 useEffect(()=>{
  if(!opened)return;let active=true;const ac=new AbortController(),timer=window.setTimeout(()=>ac.abort(),12000);
  setLoading(true);setResults([]);
  Promise.all(COVERAGE_SOURCES.map(async s=>{
   try{const r=await fetch(s.url,{signal:ac.signal,headers:{accept:'application/json'}});if(!r.ok||!(r.headers.get('content-type')??'').includes('application/json'))throw new Error(`HTTP ${r.status} or non-JSON`);return {...s,value:parseCoverage(s.id,await r.json()),error:null};}
   catch(e){return {...s,value:null,error:e instanceof Error?e.message:'Unavailable'};}
  })).then(rows=>{if(active){setResults(rows);setReadAt(Date.now());setLoading(false);}}).finally(()=>clearTimeout(timer));
  return()=>{active=false;ac.abort();clearTimeout(timer);};
 },[opened,attempt]);
 return <details className="mt-3 rounded-xl border border-slate-200 p-4" onToggle={e=>{if(e.currentTarget.open)setOpened(true);}} data-testid="observatory-coverage">
  <summary className="min-h-[44px] cursor-pointer text-base font-bold text-slate-900">Coverage and freshness · stablecoins, agent discovery, MCP, x402, APIs and Layer 0</summary>
  <p className="mb-3 text-sm text-slate-700">One evidence workspace, separate denominators. These dated source records do not become new measurements when this page reads them.</p>
  <p role="status" className="text-sm text-slate-700">{loading?'Reading source records…':readAt?`Fetched ${results.filter(r=>r.value).length} of ${COVERAGE_SOURCES.length} sources at ${new Date(readAt).toISOString()}. Measurement dates remain below.`:'Expand to read the sources.'}</p>
  <div className="mt-3 grid gap-3 sm:grid-cols-2">{results.map(r=><article key={r.id} className="min-w-0 rounded-lg border border-slate-200 p-3">
   <h3 className="font-bold">{r.label}</h3>
   {r.value?<><p className="mt-1 font-semibold">{r.value.count??'No numeric count'} · {r.value.unit}</p><p className="mt-1 text-xs text-slate-600">Source as of {r.value.asOf??'not recorded'} · {readAt===null?'UNKNOWN':freshness(r.value.asOf,readAt)}</p><p className="mt-2 text-sm">{r.value.detail}</p><p className="mt-2 text-sm text-slate-700">{r.value.caveat}</p></>:<p className="text-sm text-amber-900">UNAVAILABLE — {r.error}. No zero substituted.</p>}
   <a href={r.url} className="mt-2 inline-flex min-h-[44px] items-center rounded px-2 text-sm font-semibold text-emerald-800 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700">Read source JSON</a>
  </article>)}</div>
  {results.some(r=>r.error)&&<button type="button" className="mt-3 min-h-[44px] rounded border border-emerald-800 px-3 text-sm text-emerald-900" onClick={()=>setAttempt(a=>a+1)}>Retry coverage reads</button>}
 </details>;
}
