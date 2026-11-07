import { describe, expect, it } from "vitest";
import { buildCommissionQueue, listCommissionQueue } from "./commission-queue";
const record=(id:string,axis:string)=>({schema:"csoai.commission-intent/0.2",commission_id:id,
  request_scope_sha256:"c".repeat(64),subject:"qwen3:4b",model:"qwen3:4b",bank:null,axis,
  subject_kind:"ollama_model",fulfillment:"QUEUED",status:"QUEUED",as_of:"2026-09-18T00:00:00Z"});
function kv(rows:Map<string,string>):KVNamespace { return {async get(k:string){return rows.get(k)??null;},
  async list({prefix}:{prefix:string}){return {keys:[...rows.keys()].filter(k=>k.startsWith(prefix)).map(name=>({name})),list_complete:true};}} as any; }
describe("request-specific queue identity and delivery",()=>{
  it("keeps separate commissions for the same model",async()=>{
    const a="a".repeat(64),b="b".repeat(64);const data=new Map([
      [`mill:commission:v2:${a}`,JSON.stringify(record(a,"governance"))],
      [`mill:commission:v2:${b}`,JSON.stringify(record(b,"safety"))]]);
    const out=await listCommissionQueue(kv(data));expect(out.rows).toHaveLength(2);
  });
  it("does not silently complete a commission because an old model card exists",async()=>{
    const id="a".repeat(64);const data=new Map([[`mill:commission:v2:${id}`,JSON.stringify(record(id,"governance"))]]);
    const fetcher=async()=>Response.json({schema:"csoai.pod-cards-index/0.1",cards:[
      {id:"e".repeat(64),url:"https://councilof.ai/interop/mill-cards-signed/e.json",subject:"qwen3:4b",
       axis:"governance",n:237,status:"MEASURED",run_id:"old-run"}]});
    const out=await buildCommissionQueue({REVENUE_KV:kv(data)},"https://councilof.ai",fetcher as typeof fetch) as any;
    expect(out.rows).toHaveLength(1);expect(out.delivery_reconciliation.suppressed).toBe(0);
    expect(out.rows[0].delivery_state).toBe("EVIDENCE_PRESENT_NOT_REQUEST_BOUND");
  });
});
describe("queue failure and replay input controls",()=>{
  it("deduplicates only copies of the same commission id",async()=>{
    const id="a".repeat(64),row=record(id,"governance");const data=new Map([
      [`mill:commission:v2:${id}`,JSON.stringify(row)],
      ["ras:receipt",JSON.stringify({...row,enqueued:true,queue_ack:"QUEUE_READBACK_CONFIRMED"})]]);
    const r=await listCommissionQueue(kv(data));expect(r.rows).toHaveLength(1);expect(r.rows[0].source).toBe("mill:commission");
  });
  it("keeps separate legacy axes rather than merging the model",async()=>{
    const data=new Map([["ras:a",JSON.stringify({subject:"qwen3:4b",axis:"care"})],
      ["ras:b",JSON.stringify({subject:"qwen3:4b",axis:"safety"})]]);
    expect((await listCommissionQueue(kv(data))).rows).toHaveLength(2);
  });
  it("does not turn an unconfirmed modern receipt into queued work",async()=>{
    const row={...record("a".repeat(64),"care"),enqueued:null,queue_ack:"QUEUE_WRITE_UNCONFIRMED"};
    expect((await listCommissionQueue(kv(new Map([["ras:a",JSON.stringify(row)]])))).rows).toHaveLength(0);
  });
  it("rejects a v2 key whose identity disagrees with its payload",async()=>{
    const data=new Map([["mill:commission:v2:"+"b".repeat(64),JSON.stringify(record("a".repeat(64),"care"))]]);
    expect((await listCommissionQueue(kv(data))).rows).toHaveLength(0);
  });
  it("a repeated cursor cannot loop indefinitely",async()=>{
    let calls=0;const broken={get:async()=>null,list:async()=>{calls++;return {keys:[],list_complete:false,cursor:"same"};}};
    await expect(listCommissionQueue(broken as any)).rejects.toThrow("QUEUE_CURSOR_INVALID");expect(calls).toBe(2);
  });
  it("a missing queue remains unavailable rather than empty",async()=>{
    const r=await buildCommissionQueue({}) as any;expect(r.status).toBe("UNMEASURED");expect(r.rows).toBeNull();
  });
});
