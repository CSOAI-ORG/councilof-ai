import type { PurchaseIdentity, PurchasePreparation } from "../../../shared/buyerPurchase";
import { buyerNonce, checkedPurchaseUrl, validGeneration, purchaseSha256 } from "../../../shared/buyerPurchase";
import type { X402Challenge } from "./x402Wallet";
export const PURCHASE_SESSION_KEY="csoai_token";
export function purchaseSessionSnapshot():{readable:boolean;token:string|null}{
  if(typeof window==="undefined")return {readable:true,token:null};
  try{return {readable:true,token:window.localStorage.getItem(PURCHASE_SESSION_KEY)};}
  catch{return {readable:false,token:null};}
}
export function samePurchaseSession(token:string|null):boolean{
  const now=purchaseSessionSnapshot();return now.readable && now.token===token;
}
export async function ownedPurchaseFetch(path:string,init:RequestInit={},token?:string,fetcher:typeof fetch=fetch):Promise<Response>{
  const snapshot=token===undefined?purchaseSessionSnapshot():{readable:true,token};
  if(!snapshot.readable||!snapshot.token)throw new Error("Sign in to read your saved purchases.");
  const origin=globalThis.location?.origin || "https://councilof.ai",u=new URL(path,origin);
  if(u.origin!==origin || !(u.pathname==="/api/purchases"||u.pathname.startsWith("/api/purchases/")) || u.username || u.password || u.hash)
    throw new Error("Purchase access must stay on this site's API.");
  if(!samePurchaseSession(snapshot.token))throw new Error("The session changed.");
  const headers=new Headers(init.headers);headers.set("authorization","Bearer "+snapshot.token);
  const response=await fetcher(u.pathname+u.search,{...init,headers,credentials:"omit",redirect:"error",cache:"no-store"});
  if(!samePurchaseSession(snapshot.token))throw new Error("The session changed; the response was discarded.");
  return response;
}
export async function prepareOwnedChallenge(challenge:X402Challenge,identity:PurchaseIdentity,fetcher:typeof fetch=fetch){
  const snapshot=purchaseSessionSnapshot();
  if(!snapshot.readable)throw new Error("Session storage is unavailable; payment ownership cannot be qualified.");
  const stillCurrent=()=>samePurchaseSession(snapshot.token);
  if(!snapshot.token)return {challenge,token:null,stillCurrent};
  const origin=globalThis.location?.origin || "https://councilof.ai";
  checkedPurchaseUrl(identity.url,origin);checkedPurchaseUrl(identity.resource,origin);
  if(!stillCurrent())throw new Error("The session changed before purchase preparation.");
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3000);
  let p:PurchasePreparation;
  try{
    const deadline=new Promise<never>((_,reject)=>controller.signal.addEventListener("abort",()=>reject(new Error("Purchase preparation timed out before wallet approval.")),{once:true}));
    const response=await Promise.race([ownedPurchaseFetch("/api/purchases/prepare",{method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify(identity),signal:controller.signal},snapshot.token,fetcher),deadline]);
    if(!response.ok)throw new Error("Sign in again or check the request before paying; purchase ownership was not prepared.");
    p=await Promise.race([response.json() as Promise<PurchasePreparation>,deadline]);
  }finally{clearTimeout(timer);}
  if(p.schema!=="csoai.purchase-preparation/1"||!validGeneration(p.seed)||!validGeneration(p.owner_hash)||!p.request||
      !["url","resource","method","body_sha256"].every(k=>p.request[k as keyof PurchaseIdentity]===identity[k as keyof PurchaseIdentity])||
      p.nonce!==await buyerNonce(p.owner_hash,identity,p.seed)||!stillCurrent())
    throw new Error("The purchase request or session changed before wallet approval.");
  return {challenge:{...challenge,nonce:p.nonce,purchaseSeed:p.seed},token:snapshot.token,stillCurrent};
}
export async function ownedArtifactBlob(response:Response,expected:{sha256:string;bytes:number}):Promise<Blob>{
  if(!response.ok||!validGeneration(expected.sha256)||!Number.isSafeInteger(expected.bytes)||expected.bytes<0)
    throw new Error("Original result identity is unavailable.");
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(bytes.byteLength!==expected.bytes||await purchaseSha256(bytes)!==expected.sha256)
    throw new Error("Original result bytes do not match the stored digest.");
  return new Blob([bytes],{type:"application/octet-stream"});
}
export const buyerDecisionRequestId=async(input:{transaction:string;result_sha256:string;result_version:string;action:string;reason:string})=>
  purchaseSha256(new TextEncoder().encode(JSON.stringify(["csoai.browser-buyer-decision/1",input.transaction,input.result_sha256,input.result_version,input.action,input.reason])));

async function pendingDecisionKey(owner:string,transaction:string,result:{sha256:string;version:string},token:string):Promise<string>{
  if(!validGeneration(owner)||typeof transaction!=="string"||!transaction||transaction.length>256||!validGeneration(result.sha256)||typeof result.version!=="string"||!result.version||result.version.length>128||!samePurchaseSession(token))throw new Error("The current purchase owner could not be qualified.");
  const digest=await purchaseSha256(new TextEncoder().encode(JSON.stringify([transaction,result.sha256,result.version])));
  if(!samePurchaseSession(token))throw new Error("The session changed.");
  return "csoai_purchase_pending_v1:"+owner+":"+digest;
}
function pendingId(key:string):string|null{
  let id:string|null;try{id=window.localStorage.getItem(key);}catch{throw new Error("Pending decision storage is unavailable; read saved decisions before continuing.");}
  if(id!==null&&!validGeneration(id))throw new Error("Pending decision state is unreadable; reconcile saved decisions before continuing.");
  return id;
}
export async function readPendingBuyerDecision(owner:string,transaction:string,result:{sha256:string;version:string},token:string):Promise<string|null>{
  const key=await pendingDecisionKey(owner,transaction,result,token),id=pendingId(key);
  if(!samePurchaseSession(token))throw new Error("The session changed.");
  return id;
}
/** Store only an opaque request ID before dispatch; never a token, output, receipt or decision reason. */
export async function markPendingBuyerDecision(owner:string,transaction:string,result:{sha256:string;version:string},id:string,token:string):Promise<string|null>{
  if(!validGeneration(id))throw new Error("Decision request identity is invalid.");
  const key=await pendingDecisionKey(owner,transaction,result,token),existing=pendingId(key);
  if(existing)return existing;
  if(!samePurchaseSession(token))throw new Error("The session changed.");
  try{window.localStorage.setItem(key,id);}catch{throw new Error("Pending decision state could not be retained; no decision was sent.");}
  if(pendingId(key)!==id||!samePurchaseSession(token))throw new Error("Pending decision state could not be qualified; no decision was sent.");
  return null;
}
export async function clearPendingBuyerDecision(owner:string,transaction:string,result:{sha256:string;version:string},id:string,token:string):Promise<void>{
  const key=await pendingDecisionKey(owner,transaction,result,token);
  if(pendingId(key)!==id)return;
  try{window.localStorage.removeItem(key);}catch{throw new Error("The saved decision is observed, but its local reminder could not be cleared.");}
  if(pendingId(key)!==null)throw new Error("The saved decision is observed, but its local reminder remains.");
}
