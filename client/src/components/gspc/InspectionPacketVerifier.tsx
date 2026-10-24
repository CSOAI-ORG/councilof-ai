import {useRef,useState} from 'react';
import {verifyInspectionPacket,type InspectionReadout} from '@/lib/inspectionPacket';
const field='w-full min-h-[44px] rounded-lg border border-emerald-500/30 bg-[#031009] px-3 py-2 text-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300';
export default function InspectionPacketVerifier(){
 const [file,setFile]=useState<File|null>(null),[expectedId,setId]=useState(''),[expectedHash,setHash]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[report,setReport]=useState<InspectionReadout|null>(null);
 const generation=useRef(0),fileInput=useRef<HTMLInputElement>(null);
 function invalidate(){generation.current++;setReport(null);setError('');setBusy(false);}
 async function verify(){
  if(!file)return;invalidate();const run=generation.current;setBusy(true);
  try{if(file.size>4_000_000)throw new Error('PACKET_SIZE_LIMIT');const r=await verifyInspectionPacket(new Uint8Array(await file.arrayBuffer()),expectedId.trim()||undefined,expectedHash.trim()||undefined);if(run===generation.current)setReport(r);}
  catch(e){if(run===generation.current)setError(e instanceof Error?e.message:'PACKET_UNCHECKABLE');}
  finally{if(run===generation.current)setBusy(false);}
 }
 function clear(){invalidate();setFile(null);setId('');setHash('');if(fileInput.current)fileInput.current.value='';}
 function save(){if(!report)return;const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='csoai-inspection-'+report.requestId+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 return <section className="rounded-2xl border border-emerald-500/30 bg-[#05140d] p-6 text-emerald-50" data-testid="inspection-packet-verifier" aria-labelledby="packet-heading">
 <h2 id="packet-heading" className="text-2xl font-bold">Inspect a delivered evidence packet</h2>
 <p className="mt-3 text-sm leading-relaxed text-emerald-100/80">Choose a CSOAI inspection ZIP already supplied to you. This check reads the file in your browser: the packet is not uploaded, its bundled code is not executed, and no new model test or ledger read is performed.</p>
 <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-950/20 p-3 text-sm text-amber-100">These packets are unsigned. Matching their contents proves internal consistency, not the publisher’s identity, present-day validity, safety or legal compliance. Obtain expected identifiers through a trusted channel.</p>
 <div className="mt-5 grid gap-4">
 <label className="text-sm font-semibold">Inspection packet ZIP<input ref={fileInput} className={`${field} mt-1`} type="file" accept=".zip,application/zip" onChange={e=>{invalidate();setFile(e.target.files?.[0]??null);}}/></label>
 <label className="text-sm font-semibold">Expected request ID <span className="font-normal">(optional)</span><input className={`${field} mt-1 font-mono text-xs`} value={expectedId} maxLength={64} spellCheck={false} autoComplete="off" onChange={e=>{invalidate();setId(e.target.value);}} placeholder="64-character lowercase SHA-256"/></label>
 <label className="text-sm font-semibold">Expected packet SHA-256 <span className="font-normal">(optional)</span><input className={`${field} mt-1 font-mono text-xs`} value={expectedHash} maxLength={64} spellCheck={false} autoComplete="off" onChange={e=>{invalidate();setHash(e.target.value);}} placeholder="Digest from the agreed trusted channel"/></label>
 </div>
 <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={verify} disabled={!file||busy} className="min-h-[44px] rounded-lg bg-emerald-300 px-4 font-semibold text-emerald-950 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">{busy?'Checking packet…':'Check packet locally'}</button><button type="button" onClick={clear} className="min-h-[44px] rounded-lg border border-emerald-400/40 px-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">Clear packet</button></div>
 <p className="mt-3 text-xs text-emerald-100/70">Maximum 4 MB. Only the seven-file inspection-packet format is supported. Files and results are not stored by this component.</p>
 {busy&&<p role="status" className="mt-3 text-sm">Checking the ZIP, file digests, request scope and retained row counts.</p>}
 {error&&<div role="alert" className="mt-4 rounded-lg border border-amber-400/40 p-4"><strong>Rejected or uncheckable</strong><p className="mt-1 break-words font-mono text-xs">{error}</p><p className="mt-2 text-sm">No positive result is retained. Ask the sender for the exact packet and expected identifiers. Unsupported browsers can use the separately supplied offline verifier.</p></div>}
 {report&&<div className="mt-5 rounded-xl border border-amber-400/40 p-4" data-testid="inspection-packet-result"><h3 className="font-bold text-amber-100">Internally consistent · unsigned · historical</h3><p role="status" className="mt-2 text-sm">Seven file records checked. {report.records===null?'This source is not a row-indexed collection.':`${report.records} retained records recounted.`}</p>
 <dl className="mt-4 grid gap-2 text-sm"><dt className="font-semibold">Source and date</dt><dd className="break-words">{report.sourceId} · {typeof report.sourceAsOf==='string'?report.sourceAsOf:report.sourceAsOf===null?'Not recorded':'Structured source dates — inspect result JSON'}</dd><dt className="font-semibold">Expected request</dt><dd>{report.expectedRequestMatched?'Matched supplied request ID':'Not supplied — continuity not established'}</dd><dt className="font-semibold">Expected packet digest</dt><dd>{report.expectedDigestMatched?'Matched supplied packet digest':'Not supplied — continuity not established'}</dd><dt className="font-semibold">Publisher authentication</dt><dd>Not established. No signature or chain inclusion checked.</dd><dt className="font-semibold">Packet SHA-256</dt><dd className="break-all font-mono text-xs">{report.packetSha256}</dd></dl>
 {Object.keys(report.states).length>0&&<table className="mt-4 w-full text-left text-sm"><caption className="mb-2 text-left text-xs text-emerald-100/70">Statuses copied from the dated source, not new measurement outcomes.</caption><thead><tr><th className="py-2">Recorded state</th><th>Rows</th></tr></thead><tbody>{Object.entries(report.states).sort(([a],[b])=>a.localeCompare(b)).map(([s,n])=><tr key={s}><td className="break-words py-2">{s}</td><td>{n}</td></tr>)}</tbody></table>}
 <button type="button" onClick={save} className="mt-4 min-h-[44px] rounded-lg border border-emerald-400/40 px-4 text-sm">Save inspection result JSON</button></div>}
 </section>;
}
