import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";
import { stripTypeScriptTypes } from "node:module";
import { webcrypto } from "node:crypto";
const root=process.argv[2];
if(!root)throw new Error("exact source root required");
const cases=[];let financialCalls=[];let failNetwork=false;
const fixturePayer="0x"+"1".repeat(40),payTo="0x"+"2".repeat(40);
const fixtureFetch=async(input,init={})=>{
  const url=String(input);assert.ok(url.startsWith("https://fixture.invalid/"),"no external network");
  financialCalls.push({url,init});
  if(failNetwork)throw new Error("network forbidden in recovery");
  if(url.endsWith("/supported"))return Response.json({kinds:[{x402Version:1,scheme:"exact",network:"base"},{x402Version:2,scheme:"exact",network:"eip155:8453"}]});
  if(url.endsWith("/verify"))return Response.json({isValid:true});
  if(url.endsWith("/settle"))return Response.json({success:true,transaction:"fixture-transaction-1",network:"base",payer:fixturePayer});
  throw new Error("unexpected synthetic transport");
};
const context=vm.createContext({crypto:webcrypto,Request,Response,Headers,URL,URLSearchParams,TextEncoder,TextDecoder,
 Uint8Array,ArrayBuffer,atob,btoa,setTimeout,clearTimeout,DOMException,fetch:fixtureFetch,
 console:{log(){},warn(){},error(){}}});
const modules=new Map();
function synthetic(name,exports){
 const key="stub:"+name;if(modules.has(key))return modules.get(key);
 const m=new vm.SyntheticModule(Object.keys(exports),function(){for(const[k,v]of Object.entries(exports))this.setExport(k,v);},{context,identifier:key});
 modules.set(key,m);return m;
}
const config={ESTATE_PAY_TO:payTo,resolvePayTo:()=>payTo,facilitatorUrl:env=>env.X402_FACILITATOR_URL||null,
 USDC_BASE_EIP712:{name:"USD Coin",version:"2"},NETWORK_SLUG_BASE:"base",NETWORK_CAIP2_BASE:"eip155:8453",
 toCaip2Network:n=>n==="base"?"eip155:8453":n,toLegacyNetwork:n=>n==="eip155:8453"?"base":n};
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
  if(target==="functions/api/_x402_offer.ts")return synthetic("offers",{attachOffers:async value=>value});
  if(target==="functions/api/_x402_discovery.ts")return synthetic("discovery",{declareDiscoveryExtension:()=>({}),descriptionForPath:()=>"",onBeforeSettle:value=>value});
  if(target==="functions/api/_x402_receipt.ts")return synthetic("receipts",{buildReceiptRecord:()=>{throw Error("no fixture receipt signing");},receiptExtension:()=>({}),receiptPayload:()=>({}),signReceipt:()=>{throw Error("real receipt signing forbidden");},storeReceipt:()=>{throw Error("no fixture receipt signing");}});
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
async function test(name,fn){try{await fn();cases.push({name,passed:true});}catch(error){cases.push({name,passed:false,error:String(error?.stack||error)});}}
const auth=await ns("functions/api/_authCrypto.ts");
const pure=await ns("shared/buyerPurchase.ts");
const buyer=await ns("functions/api/_buyer_purchase.ts");
const delivery=await ns("functions/api/_x402_delivery_record.ts");
const api=await ns("functions/api/purchases/[[path]].ts");
const router=await ns("functions/api/auth/[[path]].ts");
const x402=await ns("functions/api/_x402.ts");
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
await test("login upgrades legacy generation only after password and exact observed store readback",async()=>{
 const email="legacy-login@example.test",salt="synthetic-salt",password="fixture-password";
 const pw=await auth.hashPassword(password,salt);
 accounts.values.set(auth.userKey(email),JSON.stringify({email,name:"Legacy",salt,pw,created_at:"2026-11-01T00:00:00Z",unknown_preserved:{x:1}}));
 const response=await router.onRequest({request:request("https://councilof.ai/api/auth/login",null,"POST",JSON.stringify({email,password})),env,params:{path:"login"}});
 assert.equal(response.status,200);const result=await response.json();const verified=await auth.verifyToken(env,result.token);
 assert.ok(pure.validGeneration(verified.account_generation));
 assert.equal(JSON.parse(accounts.values.get(auth.userKey(email))).unknown_preserved.x,1);
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

const passed=cases.filter(c=>c.passed).length;
console.log(JSON.stringify({schema:"codex.buyer-recovery-offline-controls/1",passed,failed:cases.length-passed,cases,
 real_network_calls:0,real_payment_signatures:0,real_customer_decisions:0,synthetic_financial_transport_calls:financialCalls.length,
 auth_fixture:"Ephemeral synthetic fixture key and tokens only in worker memory; no production credentials or sessions."}));
if(passed!==cases.length)process.exitCode=1;
