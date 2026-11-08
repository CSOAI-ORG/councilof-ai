import { useEffect, useRef, useState } from "react";
import { ownedPurchaseFetch, ownedArtifactBlob, buyerDecisionRequestId, purchaseSessionSnapshot, samePurchaseSession, readPendingBuyerDecision, markPendingBuyerDecision, clearPendingBuyerDecision } from "@/lib/buyerPurchases";
type Row={transaction:string;resource:string;result_url:string};
type Decision={owner_hash:string;transaction:string;result_sha256:string;result_version:string;request_id:string;action:string;reason:string;recorded_at:string};
type Detail={owner_hash:string;transaction:string;resource:string;result:{sha256:string;bytes:number;version:string;download_url:string};
 receipt:{payment_response:string;state:string};decisions:{rows:Decision[];cursor?:string|null;list_complete:boolean}};
const css="rounded-lg border border-border px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2";
function save(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export default function OwnedPurchases(){
 const [session,setSession]=useState(()=>purchaseSessionSnapshot()),[rows,setRows]=useState<Row[]|null>(null);
 const [cursor,setCursor]=useState<string|null>(null),[detail,setDetail]=useState<Detail|null>(null);
 const [reason,setReason]=useState(""),[note,setNote]=useState(""),[busy,setBusy]=useState(false),[unknownId,setUnknownId]=useState<string|null>(null);
 const revision=useRef(0),pending=useRef<AbortController|null>(null);
 useEffect(()=>{const changed=()=>{revision.current++;pending.current?.abort();setSession(purchaseSessionSnapshot());
  setRows(null);setDetail(null);setReason("");setNote("");setBusy(false);setUnknownId(null);};
  window.addEventListener("storage",changed);window.addEventListener("council-session-changed",changed);
  return()=>{revision.current++;pending.current?.abort();window.removeEventListener("storage",changed);window.removeEventListener("council-session-changed",changed);};},[]);
 function begin(){const op=++revision.current;pending.current?.abort();const controller=new AbortController();
  pending.current=controller;setBusy(true);setNote("");return {op,controller,token:session.token};}
 const live=(w:ReturnType<typeof begin>)=>revision.current===w.op&&!!w.token&&samePurchaseSession(w.token);
 async function history(next?:string){const w=begin();try{
  const response=await ownedPurchaseFetch("/api/purchases"+(next?"?cursor="+encodeURIComponent(next):""),{signal:w.controller.signal},w.token||undefined);
  const data=await response.json();if(!live(w))return;
  if(!response.ok||!Array.isArray(data.rows))throw new Error(data.error||"Purchase history unavailable.");
  setRows(previous=>next?[...(previous||[]),...data.rows]:data.rows);setCursor(data.list_complete?null:data.cursor||null);
  setNote("Known account-bound purchases loaded. Legacy guest payments and unrecorded index writes may be absent.");
 }catch(error){if(live(w))setNote(error instanceof Error?error.message:"Purchase history unavailable.");}finally{if(live(w))setBusy(false);}}
 async function open(row:Row){const w=begin();try{
  const response=await ownedPurchaseFetch(row.result_url,{signal:w.controller.signal},w.token||undefined),data=await response.json();
  if(!live(w))return;if(!response.ok||!data.result||!data.receipt||!Array.isArray(data.decisions?.rows))throw new Error(data.error||"Original data unavailable.");
  const prior=await readPendingBuyerDecision(data.owner_hash,data.transaction,data.result,w.token!);if(!live(w))return;
  setDetail(data);setReason("");setUnknownId(prior);if(prior)setNote("A previous decision outcome is unconfirmed. Read this exact saved request before continuing.");
 }catch(error){if(live(w))setNote(error instanceof Error?error.message:"Original data unavailable.");}finally{if(live(w))setBusy(false);}}
 function receipt(){if(!detail)return;const chosen=detail,op=revision.current,token=session.token;
  if(!token||revision.current!==op||!samePurchaseSession(token)){setNote("The session changed; reopen saved purchases before downloading a receipt.");return;}
  const blob=new Blob([JSON.stringify(chosen.receipt,null,2)],{type:"application/json"});
  if(revision.current!==op||!samePurchaseSession(token))return;
  save(blob,"csoai-route-receipt.json");
 }
 async function original(){if(!detail)return;const chosen=detail,w=begin();try{
  const response=await ownedPurchaseFetch(chosen.result.download_url,{signal:w.controller.signal},w.token||undefined);
  const blob=await ownedArtifactBlob(response,chosen.result);if(!live(w))return;
  save(blob,"csoai-original-"+chosen.result.sha256.slice(0,12)+".bin");setNote("Original bytes match the stored digest. Downloading does not record acceptance.");
 }catch(error){if(live(w))setNote(error instanceof Error?error.message:"Original bytes unavailable.");}finally{if(live(w))setBusy(false);}}
 async function confirmedDecision(row:Decision,chosen:Detail,id:string){return row.owner_hash===chosen.owner_hash&&row.transaction===chosen.transaction&&row.request_id===id&&
  row.result_sha256===chosen.result.sha256&&row.result_version===chosen.result.version&&typeof row.reason==="string"&&
  ["accept","reject","request_correction"].includes(row.action)&&await buyerDecisionRequestId({transaction:row.transaction,result_sha256:row.result_sha256,result_version:row.result_version,action:row.action,reason:row.reason})===id;}
 async function decisions(next?:string){if(!detail)return;const chosen=detail,w=begin();try{
  const query=unknownId?"?request_id="+encodeURIComponent(unknownId):next?"?cursor="+encodeURIComponent(next):"";
  const response=await ownedPurchaseFetch("/api/purchases/"+encodeURIComponent(chosen.transaction)+"/decisions"+query,{signal:w.controller.signal},w.token||undefined);
  const data=await response.json();if(!live(w))return;
  if(!response.ok||!Array.isArray(data.rows))throw new Error(data.error||"Decision read unavailable.");
  const merged=[...chosen.decisions.rows.filter(row=>!data.rows.some((d:Decision)=>d.request_id===row.request_id)),...data.rows];
  setDetail({...chosen,decisions:{...data,rows:merged}});
  if(unknownId){if(data.rows.some((d:Decision)=>d.request_id===unknownId)){const exact=data.rows.find((d:Decision)=>d.request_id===unknownId);if(!await confirmedDecision(exact,chosen,unknownId))throw new Error("The saved decision does not match this original result and request.");await clearPendingBuyerDecision(chosen.owner_hash,chosen.transaction,chosen.result,unknownId,w.token!);if(!live(w))return;setUnknownId(null);setNote("The prior explicit decision is present in the saved record.");}
   else setNote("That request is not observed yet. This does not prove the write failed; do not repost it.");}
 }catch(error){if(live(w))setNote(error instanceof Error?error.message:"Decision read unavailable.");}finally{if(live(w))setBusy(false);}}
 async function decide(action:"accept"|"reject"|"request_correction"){if(!detail||unknownId)return;
  const chosen=detail,explanation=reason,w=begin();let sent=false,id="";try{
   id=await buyerDecisionRequestId({transaction:chosen.transaction,result_sha256:chosen.result.sha256,result_version:chosen.result.version,action,reason:explanation});
   if(!live(w))return;
   const prior=await markPendingBuyerDecision(chosen.owner_hash,chosen.transaction,chosen.result,id,w.token!);if(!live(w))return;
   if(prior){setUnknownId(prior);setNote("A prior decision is unconfirmed. Read that exact saved request before continuing.");return;}
   sent=true;
   const response=await ownedPurchaseFetch("/api/purchases/"+encodeURIComponent(chosen.transaction)+"/decisions",{
    method:"POST",headers:{"content-type":"application/json"},signal:w.controller.signal,
    body:JSON.stringify({action,reason:explanation,request_id:id,result_sha256:chosen.result.sha256,result_version:chosen.result.version})},w.token||undefined);
   const data=await response.json();if(!live(w))return;
   if(!response.ok||!data.decision||!await confirmedDecision(data.decision,chosen,id)){
    if(data.state==="UNKNOWN"){setUnknownId(id);setNote("Decision outcome unconfirmed. Read this exact saved request before retrying.");return;}
    throw new Error(data.error||"Decision could not be qualified.");}
   await clearPendingBuyerDecision(chosen.owner_hash,chosen.transaction,chosen.result,id,w.token!);if(!live(w))return;
   setDetail({...chosen,decisions:{...chosen.decisions,rows:[...chosen.decisions.rows.filter(d=>d.request_id!==id),data.decision]}});
   setNote("Your explicit "+action.replace("_"," ")+" decision is recorded against this original result.");
  }catch(error){if(live(w)){if(sent)setUnknownId(id);setNote(sent?"Decision outcome unconfirmed. Read this exact saved request before retrying.":error instanceof Error?error.message:"Decision unavailable.");}}
  finally{if(live(w))setBusy(false);}}
 return <section className="mt-6 rounded-xl border border-border p-4" aria-labelledby="owned-purchases-title" data-testid="owned-purchases">
  <h2 id="owned-purchases-title" className="text-lg font-bold">Saved purchases</h2>
  <p className="mt-1 text-sm text-muted-foreground">Recover your original result and stored receipt. Reading or downloading does not accept the result.</p>
  {!session.readable?<p>Session storage is unavailable.</p>:!session.token?
   <p className="mt-2 text-sm"><a href="/login" className="underline">Sign in</a> before purchasing to attach results to your account. Guest payments are not attached retrospectively.</p>:
   <><button className={css+" mt-3"} disabled={busy} onClick={()=>void history()}>Load saved purchases</button>
   {rows?.length===0?<p className="mt-2 text-sm">No account-bound purchases were returned on this page. This does not prove that no payment occurred.</p>:null}
   <ul className="mt-3 space-y-2">{rows?.map(row=><li key={row.transaction} className="rounded-lg bg-muted p-3">
    <p className="break-all text-sm">{row.resource}</p><p className="break-all font-mono text-xs">{row.transaction}</p>
    <button className={css+" mt-2"} disabled={busy} onClick={()=>void open(row)}>Open original result and receipt</button></li>)}</ul>
   {cursor?<button className={css+" mt-2"} disabled={busy} onClick={()=>void history(cursor)}>Load next page</button>:null}
   {detail?<div className="mt-4 rounded-lg border border-border p-3" data-testid="owned-result-detail">
    <p className="break-all font-mono text-xs">SHA-256 {detail.result.sha256}</p>
    <p className="mt-1 text-xs">Original version {detail.result.version} · {detail.result.bytes} bytes</p>
    <div className="mt-3 flex flex-wrap gap-2">
     <button className={css} disabled={busy} onClick={()=>void original()}>Download original bytes</button>
     <button className={css} disabled={busy} onClick={receipt}>Download stored receipt</button>
     <button className={css} disabled={busy} onClick={()=>void decisions()}>Read saved decisions</button>
     {detail.decisions.cursor&&!unknownId?<button className={css} disabled={busy} onClick={()=>void decisions(detail.decisions.cursor!)}>Next decisions page</button>:null}
    </div>
    <p className="mt-2 text-xs text-muted-foreground">The stored receipt is route-reported and has not been independently verified here.</p>
    <label className="mt-4 block text-sm">Your decision note (optional)<textarea maxLength={2000} value={reason} onChange={e=>setReason(e.target.value)} className="mt-1 block w-full rounded-lg border border-border bg-background p-2"/></label>
    <div className="mt-2 flex flex-wrap gap-2">
     <button className={css} disabled={busy||!!unknownId} onClick={()=>void decide("accept")}>Accept this original result</button>
     <button className={css} disabled={busy||!!unknownId} onClick={()=>void decide("reject")}>Reject this original result</button>
     <button className={css} disabled={busy||!!unknownId} onClick={()=>void decide("request_correction")}>Request a correction</button>
    </div>
    <ul className="mt-3 space-y-1 text-xs">{detail.decisions.rows.map(d=><li key={d.request_id}>{d.action.replace("_"," ")} · {d.recorded_at}{d.reason?" · "+d.reason:""}</li>)}</ul>
   </div>:null}</>}
  <p role="status" aria-live="polite" className="mt-3 text-sm">{note}</p>
 </section>;
}
