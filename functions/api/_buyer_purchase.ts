import { bookkeepingBudget, BookkeepingTimeout, type BookkeepingBudget } from "./_bookkeeping_budget";
import { verifyToken, userKey, currentAccountGeneration, type AuthEnv } from "./_authCrypto";
import { BUYER_BODY_MAX_BYTES, buyerOwnerHash, buyerNonce, purchaseSeed, purchaseSha256, checkedPurchaseUrl,
  validGeneration, isBuyerNonce, type PurchaseIdentity, type PurchasePreparation } from "../../shared/buyerPurchase";

export interface BuyerStore {
  get(key:string):Promise<string|null>;
  put(key:string,value:string):Promise<void>;
  list(options:{prefix:string;limit:number;cursor?:string}):Promise<{
    keys:{name:string}[];list_complete:boolean;cursor?:string;
  }>;
}
export type BuyerEnv = AuthEnv & { REVENUE_KV?: BuyerStore };
/** Only the web request operations used for ownership; excludes platform-specific Cf generics. */
export interface PurchaseBodySource {
  clone(): { readonly body: { getReader(): {
    read(): Promise<{done:true;value?:Uint8Array}|{done:false;value:Uint8Array}>;
    cancel(reason?:unknown): Promise<void>; releaseLock():void;
  } } | null };
}
export type BuyerRequest=PurchaseBodySource & { readonly url:string; readonly method:string;
  readonly headers:{ get(name:string):string|null;has(name:string):boolean } };

export type BuyerIdentity = Readonly<{ subject:string; generation:string; owner_hash:string }>;
export class BuyerHold extends Error {
  constructor(message:string,readonly status=401) { super(message); }
}
export async function buyerDeadline<T>(operation:() => Promise<T>,ms=250):Promise<T> {
  let timer:ReturnType<typeof setTimeout> | undefined;
  const work=Promise.resolve().then(operation);
  try { return await Promise.race([work,new Promise<never>((_,reject) => {
    timer=setTimeout(() => reject(new BuyerHold("purchase bookkeeping outcome unknown; reconcile by reading",503)),ms);
  })]); } finally { if(timer!==undefined)clearTimeout(timer); }
}
export async function currentBuyer(env:AuthEnv,request:Pick<BuyerRequest,"headers">):Promise<BuyerIdentity> {
  const header=request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ") || header.length>16384) throw new BuyerHold("a current Council session is required");
  let session:Awaited<ReturnType<typeof verifyToken>>;
  try { session=await verifyToken(env,header.slice(7)); } catch { throw new BuyerHold("invalid Council session"); }
  if (!session || !validGeneration(session.account_generation))
    throw new BuyerHold("sign in again to qualify this account lifecycle");
  if (!env.SOV_ARENA_STATE) throw new BuyerHold("account store unavailable",503);
  let raw:string|null;
  try { raw=await buyerDeadline(() => env.SOV_ARENA_STATE!.get(userKey(session!.sub))); }
  catch { throw new BuyerHold("account identity could not be qualified",503); }
  if (!raw) throw new BuyerHold("account unavailable");
  let account:Record<string,unknown>;
  try { account=JSON.parse(raw); } catch { throw new BuyerHold("account record invalid",503); }
  if (!account || Array.isArray(account) || typeof account.name!=="string" ||
      typeof account.salt!=="string" || !account.salt || typeof account.pw!=="string" || !/^[a-f0-9]{64}$/i.test(account.pw) ||
      typeof account.created_at!=="string" || !Number.isFinite(Date.parse(account.created_at)))
    throw new BuyerHold("account record invalid",503);
  if (account.email!==session.sub) throw new BuyerHold("account lifecycle changed; sign in again");
  const generation=await currentAccountGeneration(account,session.sub);
  if (!generation) throw new BuyerHold("account record invalid or lifecycle unavailable",503);
  if (generation!==session.account_generation)
    throw new BuyerHold("account lifecycle changed; sign in again");
  return Object.freeze({subject:session.sub,generation:session.account_generation,
    owner_hash:await buyerOwnerHash(session.sub,session.account_generation)});
}
/** Bounded clone; the actual handler still receives the original bytes. */
export async function purchaseBody(request:PurchaseBodySource):Promise<Uint8Array> {
  const reader=request.clone().body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks:Uint8Array[]=[];let size=0;
  try {
    await buyerDeadline(async () => {
      for (;;) {
        const row=await reader.read();if(row.done)break;
        size+=row.value.byteLength;
        if(size>BUYER_BODY_MAX_BYTES)throw new BuyerHold("purchase body exceeds retention limit",413);
        chunks.push(row.value);
      }
    },2000);
  } finally { void reader.cancel().catch(() => undefined);try{reader.releaseLock();}catch{} }
  const all=new Uint8Array(size);let offset=0;
  for(const part of chunks){all.set(part,offset);offset+=part.byteLength;}return all;
}
export async function prepareBuyerRequest(buyer:BuyerIdentity,request:BuyerRequest,resource:string):Promise<PurchasePreparation> {
  const origin=new URL(request.url).origin;
  const identity:PurchaseIdentity=Object.freeze({
    url:checkedPurchaseUrl(request.url,origin),resource:checkedPurchaseUrl(resource,origin),
    method:request.method.toUpperCase(),body_sha256:await purchaseSha256(await purchaseBody(request)),
  });
  const seed=purchaseSeed();
  return Object.freeze({schema:"csoai.purchase-preparation/1",seed,nonce:await buyerNonce(buyer.owner_hash,identity,seed),
    owner_hash:buyer.owner_hash,request:identity});
}
type PreparedBuyer = Readonly<{ owner_hash:string; request:PurchaseIdentity; nonce:string; payer:string }>;
const prepared=new WeakSet<object>();
const settled=new WeakSet<object>();
export type SettledBuyer = Readonly<PreparedBuyer & { transaction:string; resource:string }>;
export type BuyerCheck = {ok:true; buyer?:PreparedBuyer} | {ok:false; reason:string};
function object(value:unknown):value is Record<string,unknown>{return !!value && typeof value==="object" && !Array.isArray(value);}
function authorization(payload:Record<string,unknown>):Record<string,unknown>|null{
  return object(payload.payload) && object(payload.payload.authorization) ? payload.payload.authorization : null;
}
function decodeHeader(raw:string):Record<string,unknown>|null {
  if(raw.length>32768)return null;
  try { const value:unknown=JSON.parse(raw.trim().startsWith("{")?raw:atob(raw));
    return object(value)?value:null; } catch {return null;}
}
export function captureBuyerRequest<T,Clone>(request:T & {headers:BuyerRequest["headers"];clone():Clone}):T|Clone {
  const headers=[request.headers.get("x-payment"),request.headers.get("payment-signature")];
  const needs=request.headers.has("authorization") || headers.some(raw=>{
    const payload=raw?decodeHeader(raw):null;
    return !!payload && (isBuyerNonce(authorization(payload)?.nonce) || !!payload.csoaiPurchase);
  });
  return needs?request.clone():request;
}

/** Always called centrally before ANY facilitator discovery/verify/settle. */
export async function checkBuyerPayment(request:BuyerRequest,env:BuyerEnv,resource:string,payload:Record<string,unknown>):Promise<BuyerCheck> {
  try {
    const auth=authorization(payload);
    const other=request.headers.get("x-payment") && request.headers.get("payment-signature");
    const all=[request.headers.get("x-payment"),request.headers.get("payment-signature")].filter((v):v is string=>!!v);
    const tagged=all.some(h=>isBuyerNonce(authorization(decodeHeader(h)||{})?.nonce));
    const sidecar=payload.csoaiPurchase;
    const hasSession=request.headers.has("authorization");
    if(!tagged && !sidecar && !hasSession)return {ok:true};
    if(other && all[0]!==all[1])throw new BuyerHold("ambiguous payment headers cannot bind a purchase",400);
    if(!auth || !isBuyerNonce(auth.nonce) || typeof auth.nonce!=="string" || !/^0x[0-9a-fA-F]{64}$/.test(auth.nonce))
      throw new BuyerHold("authenticated purchases require a request-bound nonce; guest downgrade refused",400);
    if(!object(sidecar) || sidecar.version!==1 || !validGeneration(sidecar.seed))
      throw new BuyerHold("request-bound payment context missing or invalid",400);
    const owner=await currentBuyer(env,request);
    if(!env.REVENUE_KV)throw new BuyerHold("buyer recovery store is unavailable; no payment attempted",503);
    const origin=new URL(request.url).origin;
    const identity:PurchaseIdentity=Object.freeze({url:checkedPurchaseUrl(request.url,origin),
      resource:checkedPurchaseUrl(resource,origin),method:request.method.toUpperCase(),
      body_sha256:await purchaseSha256(await purchaseBody(request))});
    if((await buyerNonce(owner.owner_hash,identity,sidecar.seed))!==auth.nonce.toLowerCase())
      throw new BuyerHold("payment is bound to a different buyer, lifecycle or exact request",400);
    if(typeof auth.from!=="string" || !/^0x[0-9a-fA-F]{40}$/.test(auth.from))
      throw new BuyerHold("request-bound payer is invalid",400);
    const buyer=Object.freeze({owner_hash:owner.owner_hash,request:identity,nonce:auth.nonce.toLowerCase(),payer:auth.from.toLowerCase()});
    prepared.add(buyer);return {ok:true,buyer};
  }catch(error){return {ok:false,reason:error instanceof Error?error.message:"purchase identity unavailable"};}
}
export type PurchaseRecord = {
  schema:"csoai.owned-purchase/1"; owner_hash:string; transaction:string; payer:string;
  resource:string; request:PurchaseIdentity; nonce:string; created_at:string; payment_response:string;
};
type Store=Pick<BuyerStore,"get"|"put">;
const prefix="private:purchase:v1:";
export const purchaseOwnerPrefix=(owner:string):string=>prefix+"owner:"+owner+":";
export async function purchaseTxKey(transaction:string):Promise<string> {
  if(!transaction || transaction.length>256 || /\s/.test(transaction))throw new BuyerHold("invalid transaction",400);
  return prefix+"tx:"+await purchaseSha256(new TextEncoder().encode(transaction));
}
export function validPurchaseRecord(value:unknown):value is PurchaseRecord {
  if(!object(value) || value.schema!=="csoai.owned-purchase/1" || !validGeneration(value.owner_hash) ||
      typeof value.transaction!=="string" || typeof value.payer!=="string" ||
      !/^0x[a-f0-9]{40}$/.test(value.payer) || typeof value.resource!=="string" ||
      typeof value.nonce!=="string" || !/^0x[0-9a-f]{64}$/.test(value.nonce) || !isBuyerNonce(value.nonce) ||
      typeof value.created_at!=="string" || !Number.isFinite(Date.parse(value.created_at)) ||
      typeof value.payment_response!=="string" || value.payment_response.length>65536 || !object(value.request))return false;
  return typeof value.request.url==="string" && value.request.resource===value.resource &&
    typeof value.request.method==="string" && /^[A-Z]+$/.test(value.request.method) && validGeneration(value.request.body_sha256);
}
function samePurchase(a:PurchaseRecord,b:PurchaseRecord):boolean {
  return a.owner_hash===b.owner_hash && a.transaction===b.transaction && a.payer===b.payer &&
    a.resource===b.resource && a.nonce===b.nonce && JSON.stringify(a.request)===JSON.stringify(b.request);
}
export async function finishBuyerPayment(kv:Store|undefined,buyer:PreparedBuyer|undefined,
  transaction:unknown,payer:unknown,resource:string,paymentResponse:string,sharedBudget?:BookkeepingBudget):Promise<{buyer?:SettledBuyer;state:string}> {
  if(!buyer)return {state:"UNOWNED_LEGACY"};
  if(!prepared.has(buyer) || typeof transaction!=="string" || !transaction || transaction.length>256 || /\s/.test(transaction) || typeof payer!=="string" ||
      payer.toLowerCase()!==buyer.payer || resource!==buyer.request.resource)
    return {state:"UNBOUND_SETTLEMENT"};
  const context=Object.freeze({...buyer,transaction,resource});settled.add(context);
  if(!kv)return {buyer:context,state:"UNRECORDED_NO_STORE"};
  let attempted=false;const budget=sharedBudget??bookkeepingBudget();
  const run=<T>(operation:()=>Promise<T>,phase:"get"|"put")=>budget.run(operation,phase);
  try {
    return await (async()=>{
      const key=await purchaseTxKey(transaction);
      const candidate:PurchaseRecord={schema:"csoai.owned-purchase/1",owner_hash:buyer.owner_hash,transaction,
        payer:buyer.payer,resource,request:buyer.request,nonce:buyer.nonce,created_at:new Date().toISOString(),payment_response:paymentResponse};
      const existing=await run(()=>kv.get(key),"get");let record=candidate;
      if(existing!==null){
        let parsed:unknown;try{parsed=JSON.parse(existing);}catch{return {buyer:context,state:"CONFLICT"};}
        if(!validPurchaseRecord(parsed) || !samePurchase(parsed,candidate))return {buyer:context,state:"CONFLICT"};
        record=parsed;
      }else{attempted=true;await run(()=>kv.put(key,JSON.stringify(candidate)),"put");}
      const index=purchaseOwnerPrefix(buyer.owner_hash)+await purchaseSha256(new TextEncoder().encode(transaction));
      const oldIndex=await run(()=>kv.get(index),"get");
      if(oldIndex!==null){
        let parsed:unknown;try{parsed=JSON.parse(oldIndex);}catch{return {buyer:context,state:"CONFLICT"};}
        if(!validPurchaseRecord(parsed) || !samePurchase(parsed,record))return {buyer:context,state:"CONFLICT"};
      }else{attempted=true;await run(()=>kv.put(index,JSON.stringify(record)),"put");}
      return {buyer:context,state:"RECORDED"};
    })();
  }catch{return {buyer:context,state:attempted?"UNKNOWN":"UNRECORDED_UNKNOWN"};}
  finally{if(!sharedBudget)budget.clear();}
}
export function ownedOutputBinding(buyer:SettledBuyer|undefined,transaction:string,resource:string) {
  return buyer && settled.has(buyer) && buyer.transaction===transaction && buyer.resource===resource
    ? {schema:"csoai.owned-output-binding/1",owner_hash:buyer.owner_hash,request:buyer.request,nonce:buyer.nonce}:undefined;
}

/** One anchored budget; no operation starts after expiry. In-flight KV writes cannot be cancelled. */
export function purchaseStoreBudget(ms=250) {
  let expired=false;let timer:ReturnType<typeof setTimeout>|undefined;
  const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{expired=true;reject(new BuyerHold("store outcome unknown; reconcile by reading",503));},ms);});
  void timeout.catch(()=>undefined);
  return {async run<T>(operation:()=>Promise<T>):Promise<T>{
    if(expired)throw new BuyerHold("store deadline",503);
    return Promise.race([timeout,Promise.resolve().then(()=>{if(expired)throw new BuyerHold("store deadline",503);return operation();})]);
  },clear(){if(timer!==undefined)clearTimeout(timer);}};
}
