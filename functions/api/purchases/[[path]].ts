import { currentBuyer, BuyerHold, buyerDeadline, purchaseOwnerPrefix, purchaseTxKey, validPurchaseRecord,
  purchaseStoreBudget, type BuyerEnv, type BuyerIdentity, type PurchaseRecord } from "../_buyer_purchase";
import { readDeliveryByTransaction, RETAINED_OUTPUT_MAX_BYTES, RETAINED_OUTPUT_SCHEMA, retainedOutputTxKey,
  RETAINED_OUTPUT_HEADERS } from "../_x402_delivery_record";
import { buyerNonce, checkedPurchaseUrl, purchaseSeed, purchaseSha256, validGeneration } from "../../../shared/buyerPurchase";

const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{
  "cache-control":"private, no-store","vary":"Authorization","x-content-type-options":"nosniff"}});
const object=(value:unknown):value is Record<string,unknown>=>!!value && typeof value==="object" && !Array.isArray(value);
async function smallJson(request:Request):Promise<Record<string,unknown>>{
  const reader=request.body?.getReader();if(!reader)throw new BuyerHold("JSON body required",400);
  const chunks:Uint8Array[]=[];let size=0;
  try {
    await buyerDeadline(async()=>{for(;;){const part=await reader.read();if(part.done)break;
      size+=part.value.byteLength;if(size>8192)throw new BuyerHold("request body too large",413);chunks.push(part.value);}},2000);
  }finally{void reader.cancel().catch(()=>undefined);try{reader.releaseLock();}catch{}}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  let value:unknown;try{value=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));}catch{throw new BuyerHold("valid UTF-8 JSON required",400);}
  if(!object(value))throw new BuyerHold("JSON object required",400);return value;
}
async function owned(env:BuyerEnv,buyer:BuyerIdentity,tx:string):Promise<PurchaseRecord>{
  if(!env.REVENUE_KV)throw new BuyerHold("purchase store unavailable",503);
  const key=await purchaseTxKey(tx);
  const raw=await buyerDeadline(()=>env.REVENUE_KV!.get(key));
  if(!raw)throw new BuyerHold("owned purchase unavailable",404);
  let row:unknown;try{row=JSON.parse(raw);}catch{throw new BuyerHold("purchase record invalid",503);}
  if(!validPurchaseRecord(row) || row.transaction!==tx || row.owner_hash!==buyer.owner_hash)
    throw new BuyerHold("owned purchase unavailable",404);
  return row;
}
function intentIdentity(value:unknown):string|null {
  if(!object(value))return null;
  return JSON.stringify([value.url,value.resource,value.method,value.body_sha256]);
}
async function original(env:BuyerEnv,row:PurchaseRecord){
  const metadata=await readDeliveryByTransaction(env.REVENUE_KV,row.transaction);
  if(!metadata || metadata.resource!==row.resource)throw new BuyerHold("original delivery metadata unavailable",503);
  const raw=await buyerDeadline(()=>env.REVENUE_KV!.get(retainedOutputTxKey(row.transaction)));
  if(!raw || raw.length>2*1024*1024)throw new BuyerHold("original result was not retained or is unavailable",503);
  let body:unknown;try{body=JSON.parse(raw);}catch{throw new BuyerHold("original result envelope invalid",503);}
  if(!object(body) || body.schema!==RETAINED_OUTPUT_SCHEMA || body.signed!==false ||
      body.transaction!==row.transaction || body.resource!==row.resource ||
      body.response_sha256!==metadata.response_sha256 || body.response_bytes!==metadata.response_bytes ||
      body.delivered_at!==metadata.delivered_at || body.content_type!==metadata.content_type ||
      typeof body.body_base64!=="string" || body.body_base64.length>Math.ceil(RETAINED_OUTPUT_MAX_BYTES/3)*4 ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(body.body_base64) ||
      !Array.isArray(body.headers) || !Number.isInteger(body.status) || Number(body.status)<200 || Number(body.status)>299 ||
      typeof body.status_text!=="string" || !object(body.buyer_binding) ||
      body.buyer_binding.schema!=="csoai.owned-output-binding/1" ||
      body.buyer_binding.owner_hash!==row.owner_hash || body.buyer_binding.nonce!==row.nonce ||
      intentIdentity(body.buyer_binding.request)!==intentIdentity(row.request))
    throw new BuyerHold("original result binding mismatch",503);
  const allowed=new Set<string>(RETAINED_OUTPUT_HEADERS);const seen=new Set<string>();let headerBytes=0;
  const headers:[string,string][]=[];
  for(const pair of body.headers){
    if(!Array.isArray(pair)||pair.length!==2||typeof pair[0]!=="string"||typeof pair[1]!=="string"||
        !allowed.has(pair[0])||seen.has(pair[0])||/[\r\n]/.test(pair[1]))throw new BuyerHold("original headers invalid",503);
    seen.add(pair[0]);headerBytes+=new TextEncoder().encode(pair[0]+pair[1]).byteLength;
    if(headerBytes>8192)throw new BuyerHold("original headers exceed bound",503);headers.push([pair[0],pair[1]]);
  }
  const receiptEcho=headers.find(([name])=>name==="x-payment-response")?.[1] ||
    headers.find(([name])=>name==="payment-response")?.[1];
  let echo:Record<string,unknown>|null=null;
  try{const decoded=JSON.parse(atob(receiptEcho||""));if(object(decoded))echo=decoded;}catch{}
  if(!receiptEcho||!echo||echo.success!==true||(echo.transaction??echo.txHash)!==row.transaction||
      typeof echo.payer!=="string"||echo.payer.toLowerCase()!==row.payer)
    throw new BuyerHold("original receipt echo mismatch",503);
  const binary=atob(body.body_base64);const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  if(bytes.byteLength!==metadata.response_bytes || bytes.byteLength>RETAINED_OUTPUT_MAX_BYTES ||
      await purchaseSha256(bytes)!==metadata.response_sha256)throw new BuyerHold("original result digest mismatch",503);
  return {metadata,bytes,headers,payment_response:receiptEcho,status:body.status,status_text:body.status_text,body_base64:body.body_base64};
}
const decisionPrefix=async(buyer:BuyerIdentity,tx:string)=>"private:purchase-decision:v1:"+buyer.owner_hash+":"+
  await purchaseSha256(new TextEncoder().encode(tx))+":";
async function decisionRows(env:BuyerEnv,buyer:BuyerIdentity,tx:string,query=new URLSearchParams()){
  const prefix=await decisionPrefix(buyer,tx);
  const cursor=query.get("cursor")||undefined,requestId=query.get("request_id");
  if(cursor&&cursor.length>2048)throw new BuyerHold("invalid cursor",400);
  if(requestId!==null&&!validGeneration(requestId))throw new BuyerHold("invalid decision request id",400);
  if(cursor&&requestId)throw new BuyerHold("use either a cursor or exact decision request id",400);
  const read=async(key:string)=>{
    if(!key.startsWith(prefix))throw new BuyerHold("decision listing scope mismatch",503);
    const raw=await buyerDeadline(()=>env.REVENUE_KV!.get(key));
    if(raw===null)return null;
    let row:unknown;try{row=JSON.parse(raw);}catch{throw new BuyerHold("decision record unreadable",503);}
    if(!object(row)||row.schema!=="csoai.buyer-result-decision/1"||row.owner_hash!==buyer.owner_hash||row.transaction!==tx||
        !validGeneration(row.request_id)||typeof row.action!=="string"||!["accept","reject","request_correction"].includes(row.action)||
        !validGeneration(row.result_sha256)||typeof row.result_version!=="string"||typeof row.reason!=="string"||
        !validGeneration(row.intent_sha256)||key!==prefix+row.request_id)
      throw new BuyerHold("decision record scope mismatch",503);
    return row;
  };
  if(requestId){
    const row=await read(prefix+requestId);
    return {rows:row?[row]:[],request_id:requestId,list_complete:true,cursor:null,
      state:row?"EXACT_REQUEST_OBSERVED":"REQUEST_NOT_OBSERVED",
      claim_boundary:"A missing read is not proof that an unknown write did not commit. Do not automatically retry the decision."};
  }
  const listed=await buyerDeadline(()=>env.REVENUE_KV!.list({prefix,limit:25,...(cursor?{cursor}:{})}));
  const rows:unknown[]=[];
  for(const key of listed.keys){const row=await read(key.name);if(!row)throw new BuyerHold("listed decision unavailable",503);rows.push(row);}
  return {rows,list_complete:listed.list_complete,cursor:listed.cursor||null,
    state:"BUYER_DECLARATIONS_OBSERVED",claim_boundary:"Explicit buyer decisions are not inferred from download. KV is eventually consistent; no exclusive current-state or merchant acceptance is inferred."};
}
export async function handlePurchases(request:Request,env:BuyerEnv):Promise<Response>{
  try{
    const buyer=await currentBuyer(env,request);
    if(!env.REVENUE_KV)throw new BuyerHold("purchase store unavailable",503);
    const u=new URL(request.url);
    const parts=u.pathname.replace(/^\/api\/purchases\/?/,"").split("/").filter(Boolean).map(decodeURIComponent);
    if(parts.length===1 && parts[0]==="prepare" && request.method==="POST"){
      const b=await smallJson(request);
      if(typeof b.url!=="string"||typeof b.resource!=="string"||typeof b.method!=="string"||
          !/^(GET|POST)$/.test(b.method)||!validGeneration(b.body_sha256))
        throw new BuyerHold("exact URL, resource, method and body SHA-256 required",400);
      const identity={url:checkedPurchaseUrl(b.url,u.origin),resource:checkedPurchaseUrl(b.resource,u.origin),
        method:b.method,body_sha256:b.body_sha256};
      const seed=purchaseSeed();
      return json({schema:"csoai.purchase-preparation/1",owner_hash:buyer.owner_hash,request:identity,seed,
        nonce:await buyerNonce(buyer.owner_hash,identity,seed),claim_boundary:"Request commitment only. No payment, result, receipt or acceptance was created."});
    }
    if(!env.REVENUE_KV)throw new BuyerHold("purchase store unavailable",503);
    if(parts.length===0 && request.method==="GET"){
      const cursor=u.searchParams.get("cursor")||undefined;if(cursor && cursor.length>2048)throw new BuyerHold("invalid cursor",400);
      const prefix=purchaseOwnerPrefix(buyer.owner_hash);
      const page=await buyerDeadline(()=>env.REVENUE_KV!.list({prefix,limit:25,...(cursor?{cursor}:{})}));
      const rows=[];
      for(const key of page.keys){
        if(!key.name.startsWith(prefix))throw new BuyerHold("purchase listing scope mismatch",503);
        const raw=await buyerDeadline(()=>env.REVENUE_KV!.get(key.name));let row:unknown;
        try{row=raw?JSON.parse(raw):null;}catch{throw new BuyerHold("purchase history record unreadable",503);}
        if(!validPurchaseRecord(row)||row.owner_hash!==buyer.owner_hash)throw new BuyerHold("purchase history scope mismatch",503);
        rows.push({transaction:row.transaction,resource:row.resource,created_at:row.created_at,
          result_url:"/api/purchases/"+encodeURIComponent(row.transaction),receipt_state:"ROUTE_REPORTED_UNVERIFIED"});
      }
      return json({schema:"csoai.owned-purchase-history/1",owner_hash:buyer.owner_hash,rows,list_complete:page.list_complete,cursor:page.cursor||null,
        claim_boundary:"Known lifecycle-bound purchases only. Legacy guest purchases are unowned. Missing index writes are possible; an empty page is not proof that no payment occurred."});
    }
    if(parts.length<1||parts.length>2)throw new BuyerHold("not found",404);
    const tx=parts[0];const row=await owned(env,buyer,tx);
    if(parts.length===2 && parts[1]==="decisions" && request.method==="POST"){
      const b=await smallJson(request);
      if(typeof b.action!=="string" || !["accept","reject","request_correction"].includes(b.action)||!validGeneration(b.request_id)||
          !validGeneration(b.result_sha256)||typeof b.result_version!=="string"||
          (b.reason!==undefined && (typeof b.reason!=="string"||b.reason.length>2000)))
        throw new BuyerHold("decision action, request id and original result identity required",400);
      const artifact=await original(env,row);
      if(b.result_sha256!==artifact.metadata.response_sha256||b.result_version!==artifact.metadata.delivered_at)
        throw new BuyerHold("decision targets a different original result or version",409);
      const reason=typeof b.reason==="string"?b.reason:"";
      const intent=await purchaseSha256(new TextEncoder().encode(JSON.stringify([
        buyer.owner_hash,tx,b.request_id,b.action,b.result_sha256,b.result_version,reason])));
      const key=await decisionPrefix(buyer,tx)+b.request_id;
      const record={schema:"csoai.buyer-result-decision/1",owner_hash:buyer.owner_hash,transaction:tx,
        request_id:b.request_id,action:b.action,result_sha256:b.result_sha256,result_version:b.result_version,
        reason,intent_sha256:intent,recorded_at:new Date().toISOString(),actor:"AUTHENTICATED_BUYER",
        claim_boundary:"An explicit buyer declaration against these original bytes; not inferred from recovery, payment, download or merchant action."};
      const budget=purchaseStoreBudget();let attempted=false;
      try{
        const existing=await budget.run(()=>env.REVENUE_KV!.get(key));
        if(existing!==null){
          let old:unknown;try{old=JSON.parse(existing);}catch{throw new BuyerHold("decision record invalid",503);}
          if(!object(old)||old.intent_sha256!==intent||old.owner_hash!==buyer.owner_hash||old.transaction!==tx)
            throw new BuyerHold("decision request id already binds different input",409);
          return json({state:"ALREADY_RECORDED",decision:old,acceptance_inferred:false});
        }
        attempted=true;await budget.run(()=>env.REVENUE_KV!.put(key,JSON.stringify(record)));
        const observed=await budget.run(()=>env.REVENUE_KV!.get(key));
        if(observed!==JSON.stringify(record))throw new BuyerHold("decision write unconfirmed; read decisions before retrying",503);
        return json({state:"RECORDED_OBSERVED",decision:record,acceptance_inferred:false,
          limitation:"One observed KV write/readback, not atomic uniqueness or an exclusive current-state guarantee."},201);
      }catch(error){
        if(attempted)return json({state:"UNKNOWN",error:"decision outcome unconfirmed; read decisions before retrying",request_id:b.request_id,acceptance_inferred:false},503);
        throw error;
      }finally{budget.clear();}
    }
    if(request.method!=="GET")throw new BuyerHold("method not allowed",405);
    const artifact=await original(env,row);
    if(parts[1]==="body"){
      const headers=new Headers(artifact.headers);
      headers.delete("content-encoding");
      headers.set("content-disposition",'attachment; filename="csoai-original-result.bin"');
      headers.set("cache-control","private, no-store");headers.set("vary","Authorization");
      headers.set("content-security-policy","sandbox; default-src 'none'");
      headers.set("x-content-type-options","nosniff");
      headers.set("x-csoai-original-sha256",artifact.metadata.response_sha256);
      return new Response(artifact.bytes,{status:200,headers});
    }
    if(parts[1] && parts[1]!=="decisions")throw new BuyerHold("not found",404);
    const decisions=await decisionRows(env,buyer,tx,u.searchParams);
    if(parts[1]==="decisions")return json(decisions);
    return json({schema:"csoai.owned-purchase-result/1",owner_hash:buyer.owner_hash,transaction:tx,resource:row.resource,
      result:{sha256:artifact.metadata.response_sha256,bytes:artifact.bytes.byteLength,version:artifact.metadata.delivered_at,
        original_status:artifact.status,original_status_text:artifact.status_text,headers:artifact.headers,
        download_url:"/api/purchases/"+encodeURIComponent(tx)+"/body",
        ...(u.searchParams.get("include_body")==="1"?{body_base64:artifact.body_base64}:{})},
      receipt:{payment_response:artifact.payment_response,state:"ROUTE_REPORTED_UNVERIFIED"},decisions,
      acceptance_inferred:false,claim_boundary:"Original prepared body and stored route receipt only. No regeneration, settlement, provider/model call, new signature or inferred acceptance."});
  }catch(error){
    return json({error:error instanceof BuyerHold?error.message:"purchase state could not be qualified",
      state:"UNAVAILABLE",acceptance_inferred:false},error instanceof BuyerHold?error.status:503);
  }
}
export const onRequest=async({request,env}:{request:Request;env:BuyerEnv}):Promise<Response>=>handlePurchases(request,env);
