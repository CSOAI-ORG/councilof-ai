import {describe,it,expect,vi,beforeEach} from "vitest";
import {issueToken} from "./_authCrypto";
import {privateProfile,requestedPrivateDesk} from "./_palOwnerProfile";
// This suite exercises the HTTP ownership boundary, not model execution.
vi.mock("./_palRuntime",()=>({talkToPal:vi.fn(async()=>{throw Error("unexpected chat execution")})}));
import {onRequestGet,onRequestPost} from "./pals";
const gen="a".repeat(64), otherGen="b".repeat(64);
let env:any, tokenA:string, tokenB:string, records:Map<string,string>, accounts:Map<string,string>;
const request=(path:string,token?:string,body?:unknown)=>new Request("https://councilof.ai"+path,{method:body===undefined?"GET":"POST",headers:{...(token?{authorization:"Bearer "+token}:{}),...(body===undefined?{}:{"content-type":"application/json"})},...(body===undefined?{}:{body:JSON.stringify(body)})});
beforeEach(async()=>{
 const pair=await crypto.subtle.generateKey("Ed25519",true,["sign","verify"]);
 const key=btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.exportKey("pkcs8",pair.privateKey))));
 records=new Map();accounts=new Map();
 const account=(email:string)=>JSON.stringify({email,name:"Test",salt:"fixture",pw:"c".repeat(64),created_at:"2026-01-01T00:00:00Z",account_generation:gen});
 for(const x of ["a@example.test","b@example.test"])accounts.set("auth:user:"+x,account(x));
 env={ASSESS_SIGNING_KEY_PKCS8_B64:key,SOV_ARENA_STATE:{get:vi.fn(async(k:string)=>accounts.get(k)??null)},PAL_MEMORY_KV:{get:vi.fn(async(k:string)=>records.get(k)??null),put:vi.fn(async(k:string,v:string)=>{records.set(k,v)}),list:vi.fn(async()=>({keys:[{name:"pal:record:legacy"}]}))}};
 tokenA=(await issueToken(env,{email:"a@example.test",name:"A",account_generation:gen}))!;
 tokenB=(await issueToken(env,{email:"b@example.test",name:"B",account_generation:gen}))!;
});
describe("private canonical desk configuration",()=>{
 it("rejects caller-supplied owner, custom instructions and unknown desk",()=>{
  for(const v of [{desk:"measure",owner:"csoai"},{desk:"measure",instructions:"anything"},{desk:"root"},{name:"Finance"},null])expect(requestedPrivateDesk(v)).toBeNull();
  expect(requestedPrivateDesk({desk:"measure"})).toBe("measure");
 });
 it("denies absent or forged token without touching profile store",async()=>{
  for(const token of [undefined,"invalid"]){const r=await privateProfile(env,request("/api/pals/provision",token,{desk:"measure"}),"measure","create");expect(r.status).toBe(401)}
  expect(env.PAL_MEMORY_KV.get).not.toHaveBeenCalled();expect(env.PAL_MEMORY_KV.put).not.toHaveBeenCalled();
 });
 it("saves and reads exact bytes, with no PII, authority, signing or chat claim",async()=>{
  const r=await privateProfile(env,request("/api/pals/provision",tokenA,{desk:"measure"}),"measure","create");
  expect(r.status).toBe(201);expect(r.body.readback_verified).toBe(true);expect(r.body.execution_authority).toBe(false);expect(r.body.chat_ready).toBe(false);
  expect(JSON.stringify([...records])).not.toContain("a@example.test");
  expect(JSON.stringify(r.body)).not.toContain("owner_scope");
  const q=await privateProfile(env,request("/api/pals/private-measure",tokenA),"measure","read");expect(q.status).toBe(200);
  const repeat=await privateProfile(env,request("/api/pals/provision",tokenA,{desk:"measure"}),"measure","create");expect(repeat.status).toBe(200);expect(repeat.body.created).toBe(false);expect(env.PAL_MEMORY_KV.put).toHaveBeenCalledTimes(1);
 });
 it("isolates accounts and account incarnations",async()=>{
  await privateProfile(env,request("/api/pals/provision",tokenA,{desk:"measure"}),"measure","create");
  expect((await privateProfile(env,request("/api/pals/private-measure",tokenB),"measure","read")).status).toBe(404);
  const k="auth:user:a@example.test";accounts.set(k,JSON.stringify({...JSON.parse(accounts.get(k)!),account_generation:otherGen}));
  expect((await privateProfile(env,request("/api/pals/private-measure",tokenA),"measure","read")).status).toBe(401);
  const fresh=(await issueToken(env,{email:"a@example.test",name:"A",account_generation:otherGen}))!;
  expect((await privateProfile(env,request("/api/pals/private-measure",fresh),"measure","read")).status).toBe(404);
 });
 it("holds an uncertain write without retry",async()=>{
  env.PAL_MEMORY_KV.put=vi.fn(async()=>{throw Error("fixture")});
  const r=await privateProfile(env,request("/api/pals/provision",tokenA,{desk:"measure"}),"measure","create");
  expect(r.status).toBe(503);expect(r.body.outcome).toBe("UNKNOWN");expect(env.PAL_MEMORY_KV.put).toHaveBeenCalledTimes(1);
 });
 it("holds when store readback differs and never overwrites an existing foreign record",async()=>{
  env.PAL_MEMORY_KV.put=vi.fn(async()=>{});
  const r=await privateProfile(env,request("/api/pals/provision",tokenA,{desk:"measure"}),"measure","create");
  expect(r.body.outcome).toBe("UNKNOWN");expect(env.PAL_MEMORY_KV.put).toHaveBeenCalledTimes(1);
  env.PAL_MEMORY_KV.get=vi.fn(async()=>"{\"legacy\":true}");
  const q=await privateProfile(env,request("/api/pals/provision",tokenA,{desk:"measure"}),"measure","create");
  expect(q.status).toBe(409);expect(env.PAL_MEMORY_KV.put).toHaveBeenCalledTimes(1);
 });
 it("refuses a missing profile store and deleted account",async()=>{
  expect((await privateProfile({...env,PAL_MEMORY_KV:undefined},request("/api/pals/provision",tokenA,{desk:"measure"}),"measure","create")).status).toBe(503);
  accounts.delete("auth:user:a@example.test");
  expect((await privateProfile(env,request("/api/pals/provision",tokenA,{desk:"measure"}),"measure","create")).status).toBe(401);
 });
 it("bounds streamed input and rejects owner injection at the HTTP route",async()=>{
  const huge=await onRequestPost({env,request:request("/api/pals/provision",tokenA,{desk:"measure",owner:"x".repeat(25000)})} as any);
  expect(huge.status).toBe(413);
  const injected=await onRequestPost({env,request:request("/api/pals/provision",tokenA,{desk:"measure",owner:"csoai"})} as any);
  expect(injected.status).toBe(400);expect(env.PAL_MEMORY_KV.put).not.toHaveBeenCalled();
 });
 it("round-trips the actual HTTP routes without exposing the account scope",async()=>{
  const created=await onRequestPost({env,request:request("/api/pals/provision",tokenA,{desk:"verify"})} as any);
  expect(created.status).toBe(201);expect(created.headers.get("cache-control")).toBe("no-store");
  const read=await onRequestGet({env,request:request("/api/pals/private-verify",tokenA)} as any);
  expect(read.status).toBe(200);expect((await read.json()).desk).toBe("verify");
  const foreign=await onRequestGet({env,request:request("/api/pals/private-verify",tokenB)} as any);
  expect(foreign.status).toBe(404);
 });
 it("keeps legacy records out of public discovery and rejects private chat",async()=>{
  records.set("pal:record:legacy",JSON.stringify({schema:"csoai.pal/0.1",owner:"private@example.test",slug:"legacy"}));
  const res=await onRequestGet({env,request:request("/api/pals")} as any);
  const data=await res.json();expect(data.count).toBe(6);expect(JSON.stringify(data)).not.toContain("private@example.test");expect(env.PAL_MEMORY_KV.list).not.toHaveBeenCalled();
  const chat=await onRequestPost({env,request:request("/api/pals/private-measure/chat",tokenA,{message:"hello"})} as any);
  expect(chat.status).toBe(409);
  const old=await onRequestGet({env,request:request("/api/pals/legacy")} as any);expect(old.status).toBe(404);
 });
});
