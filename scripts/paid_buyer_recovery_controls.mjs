import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";
import { stripTypeScriptTypes } from "node:module";
import { webcrypto } from "node:crypto";
const root=process.argv[2];
if(!root)throw new Error("exact source root required");
const cases=[];let financialCalls=[];let failNetwork=false;let fixtureTransaction="fixture-transaction-1";
const fixturePayer="0x"+"1".repeat(40),payTo="0x"+"2".repeat(40);
const fixtureFetch=async(input,init={})=>{
  const url=String(input);assert.ok(url.startsWith("https://fixture.invalid/"),"no external network");
  financialCalls.push({url,init});
  if(failNetwork)throw new Error("network forbidden in recovery");
  if(url.endsWith("/supported"))return Response.json({kinds:[{x402Version:1,scheme:"exact",network:"base"},{x402Version:2,scheme:"exact",network:"eip155:8453"}]});
  if(url.endsWith("/verify"))return Response.json({isValid:true});
  if(url.endsWith("/settle"))return Response.json({success:true,transaction:fixtureTransaction,network:"base",payer:fixturePayer});
  throw new Error("unexpected synthetic transport");
};
const context=vm.createContext({crypto:webcrypto,Request,Response,Headers,URL,URLSearchParams,TextEncoder,TextDecoder,
 Uint8Array,ArrayBuffer,atob,btoa,setTimeout,clearTimeout,DOMException,AbortController,fetch:fixtureFetch,
 console:{log(){},warn(){},error(){}}});
const modules=new Map();
function synthetic(name,exports){
 const key="stub:"+name;if(modules.has(key))return modules.get(key);
 const m=new vm.SyntheticModule(Object.keys(exports),function(){for(const[k,v]of Object.entries(exports))this.setExport(k,v);},{context,identifier:key});
 modules.set(key,m);return m;
}
const config={ESTATE_PAY_TO:payTo,resolvePayTo:()=>payTo,facilitatorUrl:env=>env.X402_FACILITATOR_URL||null,
 USDC_BASE_EIP712:{name:"USD Coin",version:"2"},NETWORK_SLUG_BASE:"base",NETWORK_CAIP2_BASE:"eip155:8453",
 railMode:()=>({mode:"fixture"}),toCaip2Network:n=>n==="base"?"eip155:8453":n,toLegacyNetwork:n=>n==="eip155:8453"?"base":n};
async function load(relative){
 relative=relative.replaceAll("\\","/");if(modules.has(relative))return modules.get(relative);
 const source=await fs.readFile(path.join(root,relative),"utf8");
 if(relative.endsWith(".json"))return synthetic(relative,{default:JSON.parse(source)});
 const m=new vm.SourceTextModule(stripTypeScriptTypes(source,{mode:"transform",sourceUrl:relative}),{context,identifier:relative});
 modules.set(relative,m);
 await m.link(async(spec,parent)=>{
  const parentDir=path.posix.dirname(parent.identifier);
  let target=path.posix.normalize(path.posix.join(parentDir,spec));if(!/\.(ts|json)$/.test(target))target+=".ts";
  if(target==="functions/api/_x402_config.ts")return synthetic("config",config);
  if(target==="functions/api/_skus.ts")return synthetic("skus",{SKUS:{},USDC_BASE:{network:"base",asset:"0x"+"3".repeat(40)},usdToAtomic:()=> "10000",resolvePriceUsd:()=> "0.01"});
  if(target==="functions/api/_cdp_jwt.ts")return synthetic("cdp",{maybeMintCdpJwt:async()=>null});
  if(target==="functions/api/gspc.ts")return synthetic("board",{currentBoardLid:()=> "fixture"});
  if(target==="functions/api/_x402_offer.ts")return synthetic("offers",{attachOffers:async value=>value,X402_SIGNER_KID:"did:fixture#synthetic",OFFER_RECEIPT_EXTENSION:"offer-receipt"});
  if(target==="functions/api/_x402_discovery.ts")return synthetic("discovery",{declareDiscoveryExtension:()=>({}),descriptionForPath:()=>"",onBeforeSettle:value=>value});
  if(target==="functions/mcp/_handlers.ts")return synthetic("mcp-rpc",{rpc:(id,result)=>Response.json({jsonrpc:"2.0",id,result})});
  if(target==="functions/api/_x402_jws.ts")return synthetic("jws",{parseJws:()=>null,signJws:async(_payload,key)=>{assert.equal(key,"synthetic-receipt-fixture-only");return "synthetic.unverified.receipt";},verifyJwsSignature:async()=>false,JWS_ALG:"EdDSA"});
  if(target==="functions/_lib/cardSign.ts")return synthetic("card-sign",{signPayload:async()=>({sha256:"f".repeat(64),sig_ed25519:null,unsigned_reason:"synthetic unsigned fixture; key absent"}),canonicalBytes:value=>new TextEncoder().encode(JSON.stringify(value)),PAYLOAD_CAP_BYTES:3072});
  if(parent.identifier==="functions/api/_ras_door.ts" && target==="functions/api/rwa/evidence.ts")return synthetic("verdict",{VERDICT_RE:/never-match-synthetic-fixture-a4b4/});
  if(target==="functions/api/_x402_descriptions.ts"){
   const imported=source.match(/import\s*\{([^}]+)\}\s*from\s*["']\.\/_x402_descriptions["']/);
   if(!imported)throw Error("description imports required");
   const out={};for(const item of imported[1].split(",").map(x=>x.trim()).filter(Boolean))out[item]=item==="wrapperAssetDescription"?()=> "fixture":"fixture";
   return synthetic("descriptions",out);
  }
  return load(target);
 });
 return m;
}
async function ns(file){const m=await load(file);if(m.status!=="evaluated")await m.evaluate();return m.namespace;}
async function test(name,fn){if(process.env.CODEX_CONTROL_PATTERN&&!name.includes(process.env.CODEX_CONTROL_PATTERN))return;try{await fn();cases.push({name,passed:true});}catch(error){cases.push({name,passed:false,error:String(error?.stack||error)});}}
const auth=await ns("functions/api/_authCrypto.ts");
const pure=await ns("shared/buyerPurchase.ts");
const buyer=await ns("functions/api/_buyer_purchase.ts");
const delivery=await ns("functions/api/_x402_delivery_record.ts");
const api=await ns("functions/api/purchases/[[path]].ts");
const router=await ns("functions/api/auth/[[path]].ts");
const x402=await ns("functions/api/_x402.ts");
const receiptStore=await ns("functions/api/_x402_receipt.ts");
const budgets=await ns("functions/api/_bookkeeping_budget.ts");
const ras=await ns("functions/api/_ras_door.ts");
// Ephemeral synthetic auth fixture only, held in worker memory; never printed or saved.
const key=await webcrypto.subtle.generateKey({name:"Ed25519"},true,["sign","verify"]);
const fixtureKey=Buffer.from(await webcrypto.subtle.exportKey("pkcs8",key.privateKey)).toString("base64");
function store(){
 const values=new Map(),calls=[];
 return {values,calls,
  async get(key){calls.push(["get",key]);return values.get(key)??null;},
  async put(key,value){calls.push(["put",key]);values.set(key,value);},
  async list({prefix,cursor,limit=25}){calls.push(["list",prefix]);const names=[...values.keys()].filter(k=>k.startsWith(prefix)).sort();const start=cursor?Number(cursor):0;return {keys:names.slice(start,start+limit).map(name=>({name})),list_complete:start+limit>=names.length,cursor:start+limit<names.length?String(start+limit):undefined};}
 };
}
const kv=store(),accounts=store();
const genA="a".repeat(64),genB="b".repeat(64);
const subjectA="buyer-a@example.test",subjectB="buyer-b@example.test";
const account=(email,generation)=>({email,name:"Fixture buyer",salt:"fixture-salt",pw:"c".repeat(64),created_at:"2026-11-01T00:00:00Z",account_generation:generation});
accounts.values.set(auth.userKey(subjectA),JSON.stringify(account(subjectA,genA)));
accounts.values.set(auth.userKey(subjectB),JSON.stringify(account(subjectB,genB)));
const env={ASSESS_SIGNING_KEY_PKCS8_B64:fixtureKey,SOV_ARENA_STATE:accounts,REVENUE_KV:kv,X402_FACILITATOR_URL:"https://fixture.invalid",X402_AMOUNT:"10000",X402_PAY_TO:payTo};
const tokenA=await auth.issueToken(env,{email:subjectA,name:"Fixture buyer",account_generation:genA});
const tokenB=await auth.issueToken(env,{email:subjectB,name:"Fixture buyer",account_generation:genB});
const authorization=token=>"Bearer "+token;
const target="https://councilof.ai/api/proof?bundle=1";
const request=(url=target,token=tokenA,method="GET",body,extra={})=>new Request(url,{method,headers:{...(token?{authorization:authorization(token)}:{}),...extra},...(body!==undefined?{body}:{} )});
const identity=await buyer.currentBuyer(env,request());
const prep=await buyer.prepareBuyerRequest(identity,request(),target);
const envelope=(nonce=prep.nonce,version=1,seed=prep.seed)=>({x402Version:version,scheme:"exact",network:"base",
 payload:{signature:"fixture-financial-signature",authorization:{from:fixturePayer,to:payTo,value:"10000",validAfter:"0",validBefore:"9999999999",nonce}},
 csoaiPurchase:{version:1,seed}});
const encoded=p=>Buffer.from(JSON.stringify(p)).toString("base64");
const paidReq=(payload=envelope(),token=tokenA,url=target,method="GET",body,header="x-payment")=>request(url,token,method,body,{[header]:encoded(payload)});
let checked,confirmed,preparedResponse,originalBytes=new Uint8Array([0,255,1,2,128]),resultVersion,resultSha;
await test("signed auth envelope preserves lifecycle claim and legacy verification remains distinct",async()=>{
 const verified=await auth.verifyToken(env,tokenA);assert.equal(verified.account_generation,genA);
 const legacy=await auth.issueToken(env,{email:subjectA,name:"Legacy fixture"});
 assert.ok(await auth.verifyToken(env,legacy));
 await assert.rejects(()=>buyer.currentBuyer(env,request(target,legacy)),/sign in again/);
});
await test("account recreation changes owner identity and rejects the former lifecycle",async()=>{
 const prior=accounts.values.get(auth.userKey(subjectA));
 accounts.values.set(auth.userKey(subjectA),JSON.stringify(account(subjectA,"d".repeat(64))));
 await assert.rejects(()=>buyer.currentBuyer(env,request()),/lifecycle changed/);
 accounts.values.set(auth.userKey(subjectA),prior);
 assert.notEqual(await pure.buyerOwnerHash(subjectA,genA),await pure.buyerOwnerHash(subjectA,"d".repeat(64)));
});
await test("corrupt current account is unavailable rather than an ownership grant",async()=>{
 const prior=accounts.values.get(auth.userKey(subjectA));accounts.values.set(auth.userKey(subjectA),JSON.stringify({...account(subjectA,genA),pw:null}));
 await assert.rejects(()=>buyer.currentBuyer(env,request()),/record invalid/);accounts.values.set(auth.userKey(subjectA),prior);
});
await test("auth-free legacy payment remains unowned compatibility",async()=>{
 const legacy=envelope("0x"+"9".repeat(64));delete legacy.csoaiPurchase;
 const r=await buyer.checkBuyerPayment(paidReq(legacy,null),env,target,legacy);assert.equal(r.ok,true);assert.equal(r.buyer,undefined);
});
await test("tagged v1 and v2 payment headers bind to the verified account",async()=>{
 for(const [version,header]of [[1,"x-payment"],[2,"payment-signature"]]){
  const p=envelope(prep.nonce,version);const r=await buyer.checkBuyerPayment(paidReq(p,tokenA,target,"GET",undefined,header),env,target,p);assert.equal(r.ok,true);assert.ok(r.buyer);checked=r;
 }
});
await test("stripped auth, stripped seed, another buyer and stripped tag cannot downgrade",async()=>{
 const missingSeed=envelope();delete missingSeed.csoaiPurchase;
 const untagged=envelope("0x"+"8".repeat(64));delete untagged.csoaiPurchase;
 for(const [p,token]of [[envelope(),null],[missingSeed,tokenA],[envelope(),tokenB],[untagged,tokenA]])
  assert.equal((await buyer.checkBuyerPayment(paidReq(p,token),env,target,p)).ok,false);
});
await test("ambiguous dual headers reject a bound payment before a financial effect",async()=>{
 const r=paidReq();r.headers.set("payment-signature",encoded(envelope("0x"+"7".repeat(64))));
 const before=financialCalls.length;const result=await x402.verifyX402Payment(r,env,target);
 assert.equal(result.ok,false);assert.equal(financialCalls.length,before);
});
await test("exact URL query, resource, method and body digest are bound",async()=>{
 for(const [url,resource,method,body]of [
  [target+"&other=1",target,"GET",undefined],[target,target+"&resource=1","GET",undefined],
  [target,target,"POST",""],[target,target,"POST",'{"x":1}']
 ])assert.equal((await buyer.checkBuyerPayment(paidReq(envelope(),tokenA,url,method,body),env,resource,envelope())).ok,false);
});
await test("binary POST can prepare before parsing and survive later handler body consumption",async()=>{
 const post=request(target,tokenA,"POST",new Uint8Array([0,250,4]));
 const snapshot=buyer.captureBuyerRequest(post);const p=await buyer.prepareBuyerRequest(identity,snapshot,target);
 await post.arrayBuffer();
 const payload=envelope(p.nonce,2,p.seed);snapshot.headers.set("payment-signature",encoded(payload));
 assert.equal((await buyer.checkBuyerPayment(snapshot,env,target,payload)).ok,true);
});
await test("unbranded or mismatched-payer settlement does not bind an output",async()=>{
 assert.equal((await buyer.finishBuyerPayment(kv,{}, "bad",fixturePayer,target,"echo")).state,"UNBOUND_SETTLEMENT");
 assert.equal((await buyer.finishBuyerPayment(kv,checked.buyer,"bad","0x"+"4".repeat(40),target,"echo")).state,"UNBOUND_SETTLEMENT");
 assert.equal(buyer.ownedOutputBinding({}, "bad",target),undefined);
});
await test("actual central settlement passes no Council authorization or private seed to facilitator",async()=>{
 const before=financialCalls.length;
 confirmed=await x402.verifyX402Payment(paidReq(),env,target,{scheme:"exact",network:"base",maxAmountRequired:"10000",amount:"10000",asset:"0x"+"3".repeat(40),payTo,resource:target,mimeType:"application/json",maxTimeoutSeconds:300,extra:{name:"USD Coin",version:"2"}});
 assert.equal(confirmed.ok,true);assert.ok(confirmed.buyer);assert.equal(confirmed.purchaseState,"RECORDED");
 const calls=financialCalls.slice(before);assert.equal(calls.filter(c=>c.url.endsWith("/settle")).length,1);
 for(const c of calls){assert.ok(!JSON.stringify(c.init).includes(tokenA));assert.ok(!String(c.init.body||"").includes("csoaiPurchase"));assert.ok(!String(c.init.body||"").includes(prep.seed));}
 assert.ok(!JSON.stringify(confirmed).includes("owner_hash"));assert.ok(!JSON.stringify(confirmed).includes("purchaseState"));
});
await test("actual paid response retains original bytes with private owner binding",async()=>{
 const response=await delivery.recordPaidResponse(new Response(originalBytes,{status:201,headers:{"content-type":"application/octet-stream"}}),
  {kv,transaction:confirmed.settlement.transaction,resource:target,confirmedPaid:true,successfulOutput:true,paymentResponse:confirmed.paymentResponse,buyer:confirmed.buyer,buyerState:confirmed.purchaseState});
 assert.deepEqual(new Uint8Array(await response.arrayBuffer()),originalBytes);
 assert.equal(response.headers.get("x-csoai-output-retention-state"),"RETAINED");
 const raw=JSON.parse(kv.values.get(delivery.retainedOutputTxKey(confirmed.settlement.transaction)));
 assert.equal(raw.buyer_binding.owner_hash,identity.owner_hash);resultVersion=raw.delivered_at;resultSha=raw.response_sha256;
});
const tx="fixture-transaction-1",resultUrl="https://councilof.ai/api/purchases/"+tx;
const apiRequest=(suffix="",token=tokenA,method="GET",body)=>request(resultUrl+suffix,token,method,body===undefined?undefined:JSON.stringify(body),body===undefined?{}:{"content-type":"application/json"});
await test("history and fresh recovery return exact stored bytes and receipt with zero new provider effects",async()=>{
 const before=financialCalls.length;failNetwork=true;
 const history=await api.handlePurchases(request("https://councilof.ai/api/purchases"),env);
 assert.equal(history.status,200);assert.equal((await history.json()).rows.length,1);
 const metadata=await api.handlePurchases(apiRequest("?include_body=1"),env);assert.equal(metadata.status,200);
 const data=await metadata.json();assert.equal(data.acceptance_inferred,false);assert.equal(data.receipt.payment_response,confirmed.paymentResponse);
 assert.equal(data.result.body_base64,Buffer.from(originalBytes).toString("base64"));assert.equal(data.decisions.rows.length,0);
 const download=await api.handlePurchases(apiRequest("/body"),env);assert.equal(download.status,200);
 assert.deepEqual(new Uint8Array(await download.arrayBuffer()),originalBytes);assert.match(download.headers.get("content-disposition"),/attachment/);
 assert.equal(download.headers.get("cache-control"),"private, no-store");assert.equal(financialCalls.length,before);
});
await test("wrong account and anonymous callers receive no private result or receipt",async()=>{
 const wrong=await api.handlePurchases(apiRequest("",tokenB),env);assert.equal(wrong.status,404);
 const anonymous=await api.handlePurchases(apiRequest("",null),env);assert.equal(anonymous.status,401);
 assert.ok(!(await wrong.text()).includes(confirmed.paymentResponse));
});
await test("tampered body or private binding cannot be recovered",async()=>{
 const key=delivery.retainedOutputTxKey(tx),original=kv.values.get(key),value=JSON.parse(original);
 value.body_base64=Buffer.from("tampered").toString("base64");kv.values.set(key,JSON.stringify(value));
 assert.equal((await api.handlePurchases(apiRequest("/body"),env)).status,503);
 value.body_base64=JSON.parse(original).body_base64;delete value.buyer_binding;kv.values.set(key,JSON.stringify(value));
 assert.equal((await api.handlePurchases(apiRequest("/body"),env)).status,503);kv.values.set(key,original);
});
const decision=(action="accept",id="1".repeat(64),digest=resultSha,version=resultVersion)=>({action,request_id:id,result_sha256:digest,result_version:version,reason:"Synthetic buyer fixture declaration"});
await test("decision refuses wrong digest, version and owner without a write",async()=>{
 const before=kv.calls.filter(c=>c[0]==="put").length;
 assert.equal((await api.handlePurchases(apiRequest("/decisions",tokenA,"POST",decision("accept","2".repeat(64),"0".repeat(64))),env)).status,409);
 assert.equal((await api.handlePurchases(apiRequest("/decisions",tokenA,"POST",decision("accept","2".repeat(64),resultSha,"wrong")),env)).status,409);
 assert.equal((await api.handlePurchases(apiRequest("/decisions",tokenB,"POST",decision()),env)).status,404);
 assert.equal(kv.calls.filter(c=>c[0]==="put").length,before);
});
await test("explicit buyer action persists once; exact replay reads and changed replay conflicts",async()=>{
 const before=financialCalls.length;
 const first=await api.handlePurchases(apiRequest("/decisions",tokenA,"POST",decision()),env);assert.equal(first.status,201);
 const declared=await first.json();assert.equal(declared.decision.actor,"AUTHENTICATED_BUYER");assert.equal(declared.acceptance_inferred,false);
 const puts=kv.calls.filter(c=>c[0]==="put").length;
 const repeated=await api.handlePurchases(apiRequest("/decisions",tokenA,"POST",decision()),env);assert.equal(repeated.status,200);
 assert.equal((await repeated.json()).state,"ALREADY_RECORDED");assert.equal(kv.calls.filter(c=>c[0]==="put").length,puts);
 assert.equal((await api.handlePurchases(apiRequest("/decisions",tokenA,"POST",decision("reject")),env)).status,409);
 assert.equal(financialCalls.length,before);
});
await test("reject and correction request are separate explicit decisions against the same original",async()=>{
 for(const[action,id]of [["reject","3".repeat(64)],["request_correction","4".repeat(64)]]){
  const response=await api.handlePurchases(apiRequest("/decisions",tokenA,"POST",decision(action,id)),env);assert.equal(response.status,201);
  assert.equal((await response.json()).decision.action,action);
 }
 const fresh=await api.handlePurchases(apiRequest(),env);const data=await fresh.json();
 assert.equal(data.decisions.rows.length,3);assert.equal(data.acceptance_inferred,false);
});
await test("prepare validates current lifecycle and binds target without payment or storage write",async()=>{
 const before=kv.calls.filter(c=>c[0]==="put").length,n=financialCalls.length;
 const response=await api.handlePurchases(request("https://councilof.ai/api/purchases/prepare",tokenA,"POST",JSON.stringify(prep.request)),env);
 assert.equal(response.status,200);const p=await response.json();assert.match(p.nonce,/^0x43534f31[0-9a-f]{56}$/);
 assert.equal(kv.calls.filter(c=>c[0]==="put").length,before);assert.equal(financialCalls.length,n);
});
await test("password login qualifies a stable legacy incarnation without a KV upgrade write",async()=>{
 const email="legacy-login@example.test",salt="synthetic-salt",password="fixture-password";
 const pw=await auth.hashPassword(password,salt);
 const original=JSON.stringify({email,name:"Legacy",salt,pw,created_at:"2026-11-01T00:00:00Z",unknown_preserved:{x:1}});
 accounts.values.set(auth.userKey(email),original);
 const writes=accounts.calls.filter(c=>c[0]==="put").length;
 const response=await router.onRequest({request:request("https://councilof.ai/api/auth/login",null,"POST",JSON.stringify({email,password})),env,params:{path:"login"}});
 assert.equal(response.status,200);const result=await response.json();const verified=await auth.verifyToken(env,result.token);
 assert.ok(pure.validGeneration(verified.account_generation));
 assert.equal((await buyer.currentBuyer(env,request(target,result.token))).generation,verified.account_generation);
 assert.equal(accounts.calls.filter(c=>c[0]==="put").length,writes);
 assert.equal(accounts.values.get(auth.userKey(email)),original);
});

await test("owner ledger timeout never starts a late write after a delayed get",async()=>{
 let release;const get=new Promise(resolve=>{release=resolve;});let puts=0;
 const held={get:()=>get,put:async()=>{puts++;}};
 const result=await buyer.finishBuyerPayment(held,checked.buyer,"late-get-fixture",fixturePayer,target,"echo");
 assert.equal(result.state,"UNRECORDED_UNKNOWN");release(null);
 await new Promise(resolve=>setTimeout(resolve,30));assert.equal(puts,0);
});
await test("in-flight owner put is UNKNOWN and cannot start a later history write",async()=>{
 const values=new Map();let puts=0;let release;
 const held={get:async key=>values.get(key)??null,put:async(key,value)=>{puts++;await new Promise(resolve=>{release=()=>{values.set(key,value);resolve();};});}};
 const result=await buyer.finishBuyerPayment(held,checked.buyer,"late-put-fixture",fixturePayer,target,"echo");
 assert.equal(result.state,"UNKNOWN");assert.equal(puts,1);release();
 await new Promise(resolve=>setTimeout(resolve,30));assert.equal(puts,1);assert.equal(values.size,1);
});
await test("unknown explicit decision write is reconciled by reading without repeating payment or write",async()=>{
 const id="5".repeat(64);let putCalls=0;let release;
 const held={...kv,put:async(key,value)=>{
  if(key.endsWith(":"+id)){putCalls++;kv.values.set(key,value);await new Promise(resolve=>{release=resolve;});}
  else return kv.put(key,value);
 }};
 const before=financialCalls.length;
 const response=await api.handlePurchases(apiRequest("/decisions",tokenA,"POST",decision("request_correction",id)),{...env,REVENUE_KV:held});
 assert.equal(response.status,503);assert.equal((await response.json()).state,"UNKNOWN");assert.equal(putCalls,1);
 release();await new Promise(resolve=>setTimeout(resolve,20));
 const observed=await api.handlePurchases(apiRequest("/decisions"),env);
 assert.ok((await observed.json()).rows.some(row=>row.request_id===id));assert.equal(putCalls,1);assert.equal(financialCalls.length,before);
});
await test("new account generation is confirmed before a registration session is returned",async()=>{
 const email="new-fixture@example.test";
 const response=await router.onRequest({request:request("https://councilof.ai/api/auth/register",null,"POST",JSON.stringify({email,password:"fixture-password",name:"New fixture"})),env,params:{path:"register"}});
 assert.equal(response.status,200);const data=await response.json(),verified=await auth.verifyToken(env,data.token);
 assert.ok(pure.validGeneration(verified.account_generation));
 assert.equal(JSON.parse(accounts.values.get(auth.userKey(email))).account_generation,verified.account_generation);
});


await test("bound payment with missing required purchase store refuses before financial calls",async()=>{
 const before=financialCalls.length;
 const result=await x402.verifyX402Payment(paidReq(),{...env,REVENUE_KV:undefined},target);
 assert.equal(result.ok,false);assert.equal(financialCalls.length,before);
});
await test("decision action must be a string rather than coercible input",async()=>{
 const puts=kv.calls.filter(c=>c[0]==="put").length,before=financialCalls.length;
 for(const action of [["accept"],{toString:"accept"},1,null]){
  const response=await api.handlePurchases(apiRequest("/decisions",tokenA,"POST",decision(action,"6".repeat(64))),env);
  assert.equal(response.status,400);
 }
 assert.equal(kv.calls.filter(c=>c[0]==="put").length,puts);assert.equal(financialCalls.length,before);
});
await test("decision 26 is available by bounded cursor and exact read after refresh without writes",async()=>{
 const initial=await api.handlePurchases(apiRequest("/decisions"),env);const first=(await initial.json()).rows[0];
 const prefix=kv.calls.filter(c=>c[0]==="list").at(-1)[1];
 for(let i=10;i<40;i++){const request_id=i.toString(16).padStart(64,"0");kv.values.set(prefix+request_id,JSON.stringify({...first,request_id}));}
 const puts=kv.calls.filter(c=>c[0]==="put").length,before=financialCalls.length;
 const page=await api.handlePurchases(apiRequest("/decisions"),env);const p=await page.json();
 assert.equal(p.rows.length,25);assert.equal(p.list_complete,false);assert.ok(p.cursor);
 const next=await api.handlePurchases(apiRequest("/decisions?cursor="+encodeURIComponent(p.cursor)),env);const n=await next.json();
 assert.ok(n.rows.length>0);assert.equal(n.list_complete,true);
 const id=n.rows[0].request_id;
 const fresh=await api.handlePurchases(apiRequest("/decisions?request_id="+id),env);const exact=await fresh.json();
 assert.equal(exact.rows.length,1);assert.equal(exact.rows[0].request_id,id);assert.equal(exact.state,"EXACT_REQUEST_OBSERVED");
 const missing=await api.handlePurchases(apiRequest("/decisions?request_id="+"f".repeat(64)),env);
 assert.equal((await missing.json()).state,"REQUEST_NOT_OBSERVED");
 assert.equal((await api.handlePurchases(apiRequest("/decisions?cursor=25&request_id="+id),env)).status,400);
 assert.equal(kv.calls.filter(c=>c[0]==="put").length,puts);assert.equal(financialCalls.length,before);
});
await test("download removes content encoding and preserves the original stored octets",async()=>{
 const key=delivery.retainedOutputTxKey(tx),saved=kv.values.get(key),row=JSON.parse(saved);
 assert.ok(Array.isArray(row.headers));row.headers.push(["content-encoding","gzip"]);kv.values.set(key,JSON.stringify(row));
 assert.equal(new Headers(JSON.parse(kv.values.get(key)).headers).get("content-encoding"),"gzip");
 const result=await api.handlePurchases(apiRequest("/body"),env);assert.equal(result.status,200);
 assert.equal(result.headers.get("content-encoding"),null);assert.deepEqual(new Uint8Array(await result.arrayBuffer()),originalBytes);
 kv.values.set(key,saved);
});
function stalledStore(prefix,phase){
 const base=store();let release,started=0;
 const held=new Promise(resolve=>{release=resolve;});
 const wrapped={...base,
  async get(key){if(phase==="get"&&key.startsWith(prefix)){base.calls.push(["get",key]);started++;await held;return base.values.get(key)??null;}return base.get(key);},
  async put(key,value){if(phase==="put"&&key.startsWith(prefix)){base.calls.push(["put",key]);started++;await held;base.values.set(key,value);return;}return base.put(key,value);}
 };
 return {wrapped,release:()=>release(),started:()=>started};
}
for(const phase of ["get","put"]){
 await test("central "+phase+" stall preserves settlement, original output and no late follow-on writes",async()=>{
  failNetwork=false;fixtureTransaction="central-stall-"+phase;
  const h=stalledStore("settled:tx:",phase),before=financialCalls.length,start=Date.now();
  const paid=await x402.verifyX402Payment(paidReq(),{...env,REVENUE_KV:h.wrapped},target);
  assert.equal(paid.ok,true);assert.equal(paid.purchaseState,"RECORDED");assert.equal(h.started(),1);
  assert.equal(financialCalls.slice(before).filter(c=>c.url.endsWith("/settle")).length,1);
  assert.ok(Date.now()-start<1600,"post-settlement stall must be bounded");
  const result=await delivery.recordPaidResponse(new Response(originalBytes),{kv:h.wrapped,transaction:fixtureTransaction,resource:target,
   confirmedPaid:true,successfulOutput:true,paymentResponse:paid.paymentResponse,buyer:paid.buyer,buyerState:paid.purchaseState,observationState:budgets.postObservationState(paid)});
  assert.equal(result.status,200);assert.deepEqual(new Uint8Array(await result.arrayBuffer()),originalBytes);
  assert.equal(result.headers.get("x-csoai-output-retention-state"),"RETAINED");
  assert.match(result.headers.get("x-csoai-bookkeeping-state"),phase==="put"?/UNKNOWN/:/DEADLINE/);
  const puts=h.wrapped.calls.filter(c=>c[0]==="put").length;
  h.release();await new Promise(resolve=>setTimeout(resolve,35));
  assert.equal(h.wrapped.calls.filter(c=>c[0]==="put").length,puts);
  const recovered=await api.handlePurchases(request("https://councilof.ai/api/purchases/"+fixtureTransaction+"/body"),{...env,REVENUE_KV:h.wrapped});
  assert.equal(recovered.status,200);assert.deepEqual(new Uint8Array(await recovered.arrayBuffer()),originalBytes);
 });
 await test("receipt "+phase+" stall is bounded and never starts the payer index after deadline",async()=>{
  const h=stalledStore("receipt:tx:",phase),start=Date.now();
  const record=receiptStore.buildReceiptRecord({receipt:{format:"jws",signature:"synthetic-not-signed"},payload:{version:1,network:"eip155:8453",resourceUrl:target,payer:fixturePayer,issuedAt:1,transaction:"receipt-stall-"+phase},
    resource:target,amount_atomic:"10000",asset:"fixture",self:false,settlement_recorded:true});
  const result=await receiptStore.storeReceipt(h.wrapped,record);
  assert.equal(result.stored,false);assert.equal(h.started(),1);assert.ok(Date.now()-start<1600);
  assert.match(result.reason,phase==="put"?/UNKNOWN/:/DEADLINE/);
  const puts=h.wrapped.calls.filter(c=>c[0]==="put").length;
  h.release();await new Promise(resolve=>setTimeout(resolve,35));
  assert.equal(h.wrapped.calls.filter(c=>c[0]==="put").length,puts);
  assert.ok(!h.wrapped.calls.some(c=>c[1].startsWith("receipt:payer:")));
 });
 await test("central receipt "+phase+" stall still recovers its exact final echoed reference",async()=>{
  failNetwork=false;fixtureTransaction="central-receipt-stall-"+phase;
  const h=stalledStore("receipt:tx:",phase),before=financialCalls.length;
  const paid=await x402.verifyX402Payment(paidReq(),{...env,REVENUE_KV:h.wrapped,BOARD_SIGN_KEY_PKCS8_B64:"synthetic-receipt-fixture-only"},target);
  assert.equal(paid.ok,true);assert.equal(h.started(),1);assert.ok(paid.receipt);assert.match(paid.receiptGap,/not stored/);
  assert.equal(JSON.parse(Buffer.from(paid.paymentResponse,"base64").toString()).extensions["offer-receipt"].info.receipt.signature,"synthetic.unverified.receipt");
  const response=await delivery.recordPaidResponse(new Response(originalBytes),{kv:h.wrapped,transaction:fixtureTransaction,resource:target,
   confirmedPaid:true,successfulOutput:true,paymentResponse:paid.paymentResponse,buyer:paid.buyer,buyerState:paid.purchaseState,observationState:budgets.postObservationState(paid)});
  assert.equal(response.headers.get("x-csoai-output-retention-state"),"RETAINED");
  const puts=h.wrapped.calls.filter(c=>c[0]==="put").length;h.release();await new Promise(resolve=>setTimeout(resolve,35));
  assert.equal(h.wrapped.calls.filter(c=>c[0]==="put").length,puts);
  const recovered=await api.handlePurchases(request("https://councilof.ai/api/purchases/"+fixtureTransaction+"?include_body=1"),{...env,REVENUE_KV:h.wrapped});
  assert.equal(recovered.status,200);assert.equal((await recovered.json()).receipt.payment_response,paid.paymentResponse);
  assert.equal(financialCalls.slice(before).filter(c=>c.url.endsWith("/settle")).length,1);
 });
 await test("actual RAS "+phase+" counter stall still delivers retained output and explicit counter gap",async()=>{
  failNetwork=false;fixtureTransaction="ras-counter-stall-"+phase;
  const h=stalledStore("ras:fixture:counter",phase),before=financialCalls.length,start=Date.now();
  const result=await ras.rasDoor({request:paidReq(),env:{...env,REVENUE_KV:h.wrapped},resourceUrl:target,
   accepts:[{scheme:"exact",network:"base",amount:"10000",maxAmountRequired:"10000",asset:"fixture",payTo,resource:target,mimeType:"application/json",maxTimeoutSeconds:300,extra:{name:"USD Coin",version:"2"}}],
   bazaar:{info:{},schema:{}},schema:"synthetic.ras/1",surface:"synthetic",description:"Offline fixture",serviceName:"fixture",tags:[],deliverable:"fixture",freePreviewPath:"/fixture",never:[],
   inputError:()=>null,compute:async()=>({delivered:true,payload:{target:"fixture.invalid",fetched_at:"2026-11-01T00:00:00Z",result:"OBSERVED"},subject:"fixture.invalid",source_urls:[]}),
   counter:"ras:fixture:counter"});
  assert.equal(result.status,200,result.status===200?"":JSON.stringify((await result.clone().json()).csoai?.not_paid_reason));assert.ok(Date.now()-start<1600);assert.equal(h.started(),1);
  assert.match(result.headers.get("x-csoai-counter-state"),phase==="put"?/UNKNOWN/:/DEADLINE/);
  assert.equal(result.headers.get("x-csoai-output-retention-state"),"RETAINED");
  const bytes=new Uint8Array(await result.arrayBuffer());assert.ok(bytes.length>0);
  const puts=h.wrapped.calls.filter(c=>c[0]==="put").length;
  h.release();await new Promise(resolve=>setTimeout(resolve,35));assert.equal(h.wrapped.calls.filter(c=>c[0]==="put").length,puts);
  const recovered=await api.handlePurchases(request("https://councilof.ai/api/purchases/"+fixtureTransaction+"/body"),{...env,REVENUE_KV:h.wrapped});
  assert.equal(recovered.status,200);assert.deepEqual(new Uint8Array(await recovered.arrayBuffer()),bytes);
  assert.equal(financialCalls.slice(before).filter(c=>c.url.endsWith("/settle")).length,1);
 });
}
await test("one shared budget prevents later store operations after expiry",async()=>{
 const budget=budgets.bookkeepingBudget(20);let calls=0;
 await assert.rejects(()=>budget.run(()=>new Promise(()=>{}),"get"));
 const payment={observationBudget:budget};
 await assert.rejects(()=>budgets.postSettlementStore({get:async()=>null,put:async()=>{calls++;}},payment).put("late","value"));
 assert.equal(calls,0);assert.equal(budgets.postObservationState(payment),"DEADLINE");budget.clear();
});


const sessions=await ns("client/src/lib/councilSession.ts");
function sessionFixture(storage,overrides={}){
 const emitted=[],calls=[];const token="synthetic-session-not-an-actual-credential";
 const fetcher=async(url,init)=>{calls.push({url,init});
  return Response.json(url.endsWith("/me")?{user:{email:"fixture@example.test",name:"Fixture"}}:{token,user:{email:"fixture@example.test",name:"Fixture"}});
 };
 const controller=sessions.createCouncilSessionController({storage,fetcher,publish:value=>emitted.push(value),...overrides});
 return {controller,emitted,calls,token};
}
for(const storage of [null,{getItem:()=>{throw Error("synthetic storage unavailable");},setItem(){},removeItem(){}}]){
 await test("unavailable sign-in persistence has a visible error class before any login dispatch "+(storage?"denied":"absent"),async()=>{
  const f=sessionFixture(storage);
  await assert.rejects(()=>f.controller.login("fixture@example.test","synthetic-password"),error=>error.name==="CouncilSessionPersistenceError"&&error.name!=="AbortError");
  assert.equal(f.calls.length,0);assert.ok(f.emitted.every(value=>!value.user&&!value.token));f.controller.dispose();
 });
}
for(const mode of ["throw","silent"]){
 await test("verified candidate is never presented as signed in when storage "+mode+" fails",async()=>{
  const storage={getItem:()=>null,setItem(){if(mode==="throw")throw Error("synthetic quota");},removeItem(){}};
  const f=sessionFixture(storage);
  await assert.rejects(()=>f.controller.login("fixture@example.test","synthetic-password"),error=>error.name==="CouncilSessionPersistenceError");
  assert.equal(f.calls.length,2);assert.ok(f.emitted.every(value=>!value.user&&!value.token));f.controller.dispose();
 });
}
await test("persisted verified session survives a fresh controller restore without another password POST",async()=>{
 const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
 const first=sessionFixture(storage);await first.controller.login("fixture@example.test","synthetic-password");
 assert.equal(first.emitted.at(-1).user.email,"fixture@example.test");assert.equal(values.get(sessions.COUNCIL_TOKEN_KEY),first.token);
 first.controller.dispose();
 const fresh=sessionFixture(storage);await fresh.controller.restore();
 assert.equal(fresh.emitted.at(-1).user.email,"fixture@example.test");assert.equal(fresh.calls.length,1);assert.equal(fresh.calls[0].url,"/api/auth/me");assert.equal(fresh.calls[0].init.method,"GET");fresh.controller.dispose();
});
await test("another subject returned by same-origin verification never becomes a cached session",async()=>{
 const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
 const f=sessionFixture(storage,{fetcher:async url=>Response.json(url.endsWith("/me")?{user:{email:"other@example.test",name:"Other"}}:{token:"synthetic-candidate",user:{email:"fixture@example.test",name:"Fixture"}})});
 await assert.rejects(()=>f.controller.login("fixture@example.test","synthetic-password"),/could not be verified/);
 assert.equal(values.size,0);assert.ok(f.emitted.every(value=>!value.user&&!value.token));f.controller.dispose();
});
await test("identity replacement during verification still cancels without overwriting the newer session",async()=>{
 const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
 const f=sessionFixture(storage,{fetcher:async url=>{
  if(url.endsWith("/me"))values.set(sessions.COUNCIL_TOKEN_KEY,"synthetic-newer-session");
  return Response.json(url.endsWith("/me")?{user:{email:"fixture@example.test",name:"Fixture"}}:{token:"synthetic-old-candidate",user:{email:"fixture@example.test",name:"Fixture"}});
 }});
 await assert.rejects(()=>f.controller.login("fixture@example.test","synthetic-password"),error=>error.name==="AbortError");
 assert.equal(values.get(sessions.COUNCIL_TOKEN_KEY),"synthetic-newer-session");assert.ok(f.emitted.every(value=>!value.user&&!value.token));f.controller.dispose();
});


const paidMcp=await ns("functions/mcp/_paid.ts");
const toolCatalogue=JSON.parse(await fs.readFile(path.join(root,"functions/mcp/paid-tools.json"),"utf8"));
const mcpCaller={authorization:authorization(tokenA),env};
const mcpTool=toolCatalogue.tools[0].name;
await test("all five existing paid MCP names read owned history without a financial or provider request",async()=>{
 const before=financialCalls.length,puts=kv.calls.filter(c=>c[0]==="put").length;
 assert.equal(toolCatalogue.tools.length,5);
 for(const tool of toolCatalogue.tools){
  const result=await paidMcp.paidToolResult(tool.name,{purchase_action:"history"},"https://councilof.ai",mcpCaller);
  assert.equal(result.structuredContent.status,"PURCHASE_HISTORY");
  assert.equal(result.structuredContent.no_new_payment_or_provider_call,true);
  assert.ok(result.structuredContent.purchase.rows.some(row=>row.transaction===tx));
  assert.ok(!JSON.stringify(result).includes(tokenA));
 }
 assert.equal(financialCalls.length,before);assert.equal(kv.calls.filter(c=>c[0]==="put").length,puts);
});
await test("MCP recovery reads exact original bytes and final receipt under the existing bearer transport",async()=>{
 const before=financialCalls.length;
 const result=await paidMcp.paidToolResult(mcpTool,{purchase_action:"recover",purchase_transaction:tx},"https://councilof.ai",mcpCaller);
 assert.equal(result.structuredContent.status,"ORIGINAL_RECOVERED");
 assert.equal(result.structuredContent.purchase.result.body_base64,Buffer.from(originalBytes).toString("base64"));
 assert.equal(result.structuredContent.purchase.receipt.payment_response,confirmed.paymentResponse);
 assert.equal(result.structuredContent.settlement_state,"NOT_REQUESTED");assert.equal(financialCalls.length,before);
});
await test("MCP private recovery rejects anonymous and another subject without exposing output",async()=>{
 const before=financialCalls.length;
 for(const caller of [{env},{env,authorization:authorization(tokenB)}]){
  const result=await paidMcp.paidToolResult(mcpTool,{purchase_action:"recover",purchase_transaction:tx},"https://councilof.ai",caller);
  assert.equal(result.isError,true);assert.equal(result.structuredContent.status,"PURCHASE_UNAVAILABLE");
  assert.ok(!JSON.stringify(result).includes(confirmed.paymentResponse));
 }
 assert.equal(financialCalls.length,before);
});
await test("MCP explicit decision uses the same result identity and exact readback without financial effects",async()=>{
 const before=financialCalls.length,id="e".repeat(64);
 const result=await paidMcp.paidToolResult(mcpTool,{purchase_action:"request_correction",purchase_transaction:tx,purchase_request_id:id,
  purchase_result_sha256:resultSha,purchase_result_version:resultVersion,purchase_reason:"Synthetic MCP fixture decision"},"https://councilof.ai",mcpCaller);
 assert.equal(result.structuredContent.status,"BUYER_DECISION_RECORDED");
 const puts=kv.calls.filter(c=>c[0]==="put").length;
 const observed=await paidMcp.paidToolResult(mcpTool,{purchase_action:"decisions",purchase_transaction:tx,purchase_request_id:id},"https://councilof.ai",mcpCaller);
 assert.equal(observed.structuredContent.status,"BUYER_DECISIONS");assert.equal(observed.structuredContent.purchase.rows.length,1);
 assert.equal(observed.structuredContent.purchase.rows[0].request_id,id);assert.equal(kv.calls.filter(c=>c[0]==="put").length,puts);
 assert.equal(financialCalls.length,before);
});
await test("MCP recovery refuses a supplied payment authorization rather than treating it as a fresh purchase",async()=>{
 const before=financialCalls.length,puts=kv.calls.filter(c=>c[0]==="put").length;
 const result=await paidMcp.paidToolResult(mcpTool,{purchase_action:"recover",purchase_transaction:tx,x_payment:"synthetic-financial-authorization-not-dispatched"},"https://councilof.ai",mcpCaller);
 assert.equal(result.structuredContent.status,"BAD_ARGUMENTS");
 assert.equal(financialCalls.length,before);assert.equal(kv.calls.filter(c=>c[0]==="put").length,puts);
});


await test("overlapping legacy logins preserve recovery of an original paid output retained between them",async()=>{
 const email="legacy-overlap-purchase@example.test",password="synthetic-password",salt="synthetic-overlap-salt";
 const original=JSON.stringify({email,name:"Legacy overlap",salt,pw:await auth.hashPassword(password,salt),created_at:"2026-11-01T00:00:00Z"});
 const accountStore=store();accountStore.values.set(auth.userKey(email),original);
 const normalGet=accountStore.get.bind(accountStore);let reads=0,ready,release;
 const captured=new Promise(resolve=>{ready=resolve;});
 accountStore.get=async key=>{
  if(++reads===2){ready();return new Promise(resolve=>{release=resolve;});}
  return normalGet(key);
 };
 const localEnv={...env,SOV_ARENA_STATE:accountStore};
 const login=()=>router.onRequest({request:request("https://councilof.ai/api/auth/login",null,"POST",JSON.stringify({email,password})),
  env:localEnv,params:{path:"login"}});
 const first=login(),second=login();await captured;
 const oldNetwork=failNetwork,oldTransaction=fixtureTransaction;
 try{
  const firstResponse=await first;assert.equal(firstResponse.status,200);
  const firstToken=(await firstResponse.json()).token;
  const owner=await buyer.currentBuyer(localEnv,request(target,firstToken));
  const prepared=await buyer.prepareBuyerRequest(owner,request(target,firstToken),target);
  const payload=envelope(prepared.nonce,1,prepared.seed);
  failNetwork=false;fixtureTransaction="fixture-legacy-overlap-transaction";
  const settledPayment=await x402.verifyX402Payment(paidReq(payload,firstToken),localEnv,target,{
   scheme:"exact",network:"base",maxAmountRequired:"10000",amount:"10000",asset:"0x"+"3".repeat(40),
   payTo,resource:target,mimeType:"application/json",maxTimeoutSeconds:300,extra:{name:"USD Coin",version:"2"}});
  assert.equal(settledPayment.ok,true);assert.ok(settledPayment.buyer);
  const bytes=new TextEncoder().encode("synthetic original output before the second login");
  const paid=await delivery.recordPaidResponse(new Response(bytes,{headers:{"content-type":"application/octet-stream"}}),{
   kv,transaction:settledPayment.settlement.transaction,resource:target,confirmedPaid:true,successfulOutput:true,
   paymentResponse:settledPayment.paymentResponse,buyer:settledPayment.buyer,buyerState:settledPayment.purchaseState});
  assert.equal(paid.headers.get("x-csoai-output-retention-state"),"RETAINED");
  release(original);
  const secondResponse=await second;assert.equal(secondResponse.status,200);
  const secondToken=(await secondResponse.json()).token;
  assert.equal((await buyer.currentBuyer(localEnv,request(target,secondToken))).owner_hash,owner.owner_hash);
  const before=financialCalls.length;failNetwork=true;
  const base="https://councilof.ai/api/purchases/"+settledPayment.settlement.transaction;
  const metadata=await api.handlePurchases(request(base+"?include_body=1",secondToken),localEnv);
  assert.equal(metadata.status,200);const recovered=await metadata.json();
  assert.equal(recovered.receipt.payment_response,settledPayment.paymentResponse);
  assert.equal(recovered.result.body_base64,Buffer.from(bytes).toString("base64"));
  const body=await api.handlePurchases(request(base+"/body",secondToken),localEnv);
  assert.equal(body.status,200);assert.deepEqual(new Uint8Array(await body.arrayBuffer()),bytes);
  assert.equal(financialCalls.length,before);
  assert.equal(accountStore.calls.filter(c=>c[0]==="put").length,0);
  assert.equal(accountStore.values.get(auth.userKey(email)),original);
 }finally{
  release?.(original);failNetwork=oldNetwork;fixtureTransaction=oldTransaction;
 }
});

const passed=cases.filter(c=>c.passed).length;
console.log(JSON.stringify({schema:"codex.buyer-recovery-offline-controls/1",passed,failed:cases.length-passed,cases,
 real_network_calls:0,real_payment_signatures:0,real_customer_decisions:0,synthetic_financial_transport_calls:financialCalls.length,
 auth_fixture:"Ephemeral synthetic fixture key and tokens only in worker memory; no production credentials or sessions."}));
if(passed!==cases.length)process.exitCode=1;
