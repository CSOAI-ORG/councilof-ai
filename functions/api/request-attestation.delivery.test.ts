import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequestGet } from "./request-attestation";
import { verifyX402Payment } from "./_x402";
import { buildCommissionQueue } from "./commission-queue";
import { buildCommissions } from "./commissions";
import * as cardSign from "../_lib/cardSign";
vi.mock("./_x402", async (load) => ({ ...await load<typeof import("./_x402")>(), verifyX402Payment: vi.fn() }));
const origin = "https://councilof.ai";
const payment = vi.mocked(verifyX402Payment);
function store(mode = "ok") {
  const data = new Map<string, string>();
  const kv = { get: vi.fn(async (k: string) => mode === "stale" ? null : data.get(k) ?? null),
    put: vi.fn(async (k: string, v: string) => { if (mode === "fail") throw new Error("store offline"); data.set(k, v); }),
    list: vi.fn(async ({prefix}:{prefix:string}) => ({ keys: [...data.keys()].filter(k=>k.startsWith(prefix)).map(name=>({name})), list_complete: true })) };
  return { kv: kv as unknown as KVNamespace, data };
}
async function call(env: Record<string, unknown> = {}, query = "subject=qwen3:4b&axis=governance") {
  const r = await onRequestGet({request:new Request(`${origin}/api/request-attestation?${query}`,{headers:{"x-payment":"synthetic-not-a-real-payment"}}),env} as any);
  return { response:r, body:await r.json() as any };
}
beforeEach(() => { payment.mockResolvedValue({ok:true,settlement:{transaction:"0x"+"1".repeat(64),network:"eip155:8453",payer:"0x"+"2".repeat(40)}} as any);
  vi.stubGlobal("fetch",vi.fn(async () => Response.json({as_of:"2026-09-01T00:00:00Z",cells:[]}))); });
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe("actual request handler queue acceptance", () => {
  it("refuses settlement when no queue store is configured", async () => {
    const {response,body}=await call(); expect(response.status).toBe(503);
    expect(body.error).toBe("queue_unavailable"); expect(payment).not.toHaveBeenCalled();
  });
  it("does not report enqueued after storage failed", async () => {
    const {kv}=store("fail");const {response,body}=await call({REVENUE_KV:kv});
    expect(response.status).toBe(202);expect(body.state).toBe("SETTLED_QUEUE_UNCONFIRMED");
    expect(body.enqueued).not.toBe(true);expect(body.retry_payment).toBe(false);
  });
});
describe("request scope, recording and failure semantics",()=>{
  it("successful queue readback precedes the issued acknowledgement",async()=>{
    const {kv,data}=store();const {response,body}=await call({REVENUE_KV:kv});
    expect(response.status).toBe(200);expect(body.card.payload.enqueued).toBe(true);
    expect(body.queue_ack.state).toBe("QUEUE_READBACK_CONFIRMED");
    const key=body.queue_ack.queue_key;expect(JSON.parse(data.get(key)!)).toMatchObject({subject:"qwen3:4b",axis:"governance"});
    expect(body.card.payload.commission_id).toBe(body.queue_ack.commission_id);
    expect(body.signed).toBe(false);expect(body.execution).toBe("NOT_OBSERVED");expect(body.delivery).toBe("NOT_OBSERVED");
  });
  it("a successful put with no readable row stays unconfirmed",async()=>{
    const {kv}=store("stale");const {response,body}=await call({REVENUE_KV:kv});
    expect(response.status).toBe(202);expect(body.enqueued).toBeNull();expect(body.card).toBeUndefined();
    expect(body.queue_ack.state).toBe("QUEUE_READBACK_UNCONFIRMED");
  });
  it("payment resource identifies both subject and axis",async()=>{
    const {kv}=store();await call({REVENUE_KV:kv});
    const resource=new URL(payment.mock.calls[0][2]);expect(resource.searchParams.get("subject")).toBe("qwen3:4b");
    expect(resource.searchParams.get("axis")).toBe("governance");
  });
  it("does not overwrite another axis request for the same subject",async()=>{
    const {kv,data}=store();const a=await call({REVENUE_KV:kv});const b=await call({REVENUE_KV:kv},"subject=qwen3:4b&axis=safety");
    expect(a.body.queue_ack.commission_id).not.toBe(b.body.queue_ack.commission_id);
    expect([...data.keys()].filter(k=>k.startsWith("mill:commission:"))).toHaveLength(2);
  });
  it("reuses a matching recorded settlement without rewriting the queue row",async()=>{
    const {kv,data}=store();const a=await call({REVENUE_KV:kv});const before=data.get(a.body.queue_ack.queue_key);
    const b=await call({REVENUE_KV:kv});expect(b.body.queue_ack.reused).toBe(true);
    expect(data.get(a.body.queue_ack.queue_key)).toBe(before);
  });
});
describe("pre-settlement and receipt-index guards",()=>{
  it.each(["subject=qwen3:4b&subject=other:7b","subject=qwen3:4b&axis=care&axis=safety"])("rejects duplicate request selectors %s",async q=>{
    const {kv}=store();const {response}=await call({REVENUE_KV:kv},q);expect(response.status).toBe(400);expect(payment).not.toHaveBeenCalled();
  });
  it("rejects an unsupported axis before settling",async()=>{
    const {kv}=store();const {response,body}=await call({REVENUE_KV:kv},"subject=qwen3:4b&axis=not-a-real-axis");
    expect(response.status).toBe(400);expect(body.error).toBe("unknown_axis");expect(payment).not.toHaveBeenCalled();
  });
  it("does not present a declared research slot as executable",async()=>{
    const {kv}=store();const {response}=await call({REVENUE_KV:kv},"subject=qwen3:4b&axis=effect-binding");
    expect(response.status).toBe(400);expect(payment).not.toHaveBeenCalled();
  });
  it("receipt-index failure cannot erase confirmed queue acceptance",async()=>{
    const {kv,data}=store();vi.mocked(kv.put).mockImplementation(async(k,v)=>{if(k.startsWith("ras:"))throw Error("index failure");data.set(k,String(v));});
    const {response,body}=await call({REVENUE_KV:kv});expect(response.status).toBe(200);
    expect(body.receipt_indexed).toBe(false);expect(body.card.payload.enqueued).toBe(true);
  });
  it("never claims queued for a receipt-only SKU",async()=>{
    const {kv}=store();const {response,body}=await call({REVENUE_KV:kv},"subject=sku:example");
    expect(response.status).toBe(200);expect(body.card.payload.enqueued).toBe(false);
    expect(body.card.payload.status).toBe("RECEIPT_ONLY");expect(body.queue_ack.enqueued).toBe(false);
  });
  it("a missing settlement identity cannot create a queue job",async()=>{
    payment.mockResolvedValue({ok:true,settlement:{}} as any);const {kv,data}=store();const {response,body}=await call({REVENUE_KV:kv});
    expect(response.status).toBe(202);expect(body.queue_ack.state).toBe("SETTLEMENT_ID_MISSING");expect(data.size).toBe(0);
    expect(body.payment_settled).toBeNull();expect(body.settlement_state).toBe("UNCONFIRMED_MISSING_ID");
  });
});
describe("one request traverses the real handlers",()=>{
  it("retains the exact request id across receipt, mill queue and requester view",async()=>{
    const {kv}=store();const {response,body}=await call({REVENUE_KV:kv});expect(response.status).toBe(200);
    const fetcher=async()=>Response.json({schema:"csoai.pod-cards-index/0.1",cards:[
      {id:"e".repeat(64),url:origin+"/interop/mill-cards-signed/e.json",subject:"qwen3:4b",axis:"governance",n:237,status:"MEASURED",run_id:"older-run"}]});
    const queue=await buildCommissionQueue({REVENUE_KV:kv},origin,fetcher as typeof fetch) as any;
    const requests=await buildCommissions({REVENUE_KV:kv},origin,fetcher as typeof fetch) as any;
    expect(queue.rows).toHaveLength(1);expect(requests.commissions).toHaveLength(1);
    expect(queue.rows[0].commission_id).toBe(body.card.payload.commission_id);
    expect(requests.commissions[0].commission_id).toBe(body.card.payload.commission_id);
    expect(requests.commissions[0].request_scope_sha256).toBe(body.card.payload.request_scope_sha256);
    expect(queue.rows[0].axis).toBe("governance");expect(requests.commissions[0].fulfillment).toBe("QUEUED");
    expect(requests.commissions[0].delivery.state).toBe("CANDIDATE_CARDS_PUBLISHED");
    expect(requests.delivered).toBeNull();expect(requests.by_origin.UNCHECKABLE).toBe(1);
  });
  it("does not overwrite an existing job with conflicting scope",async()=>{
    const {kv,data}=store();const a=await call({REVENUE_KV:kv});const key=a.body.queue_ack.queue_key;
    const changed={...JSON.parse(data.get(key)!),axis:"different-axis"};data.set(key,JSON.stringify(changed));
    const {response,body}=await call({REVENUE_KV:kv});expect(response.status).toBe(202);
    expect(body.queue_ack.state).toBe("QUEUE_ID_CONFLICT");expect(JSON.parse(data.get(key)!).axis).toBe("different-axis");
  });
  it("read failures after a reported settlement return reconciliation state, never success",async()=>{
    const {kv}=store();vi.mocked(kv.get).mockRejectedValue(Error("unavailable"));
    const {response,body}=await call({REVENUE_KV:kv});expect(response.status).toBe(202);
    expect(body.queue_ack.state).toBe("QUEUE_READBACK_UNCONFIRMED");expect(body.retry_payment).toBe(false);
  });
});
describe("post-acceptance receipt failure",()=>{
  it("keeps queue identity and no-repay guidance when receipt assembly throws",async()=>{
    const {kv,data}=store();const spy=vi.spyOn(cardSign,"signPayload").mockRejectedValue(Error("payload too large"));
    try {
      const {response,body}=await call({REVENUE_KV:kv});expect(response.status).toBe(202);
      expect(body.state).toBe("QUEUE_ACCEPTED_RECEIPT_UNAVAILABLE");expect(body.enqueued).toBe(true);
      expect(body.retry_payment).toBe(false);expect(body.card).toBeUndefined();
      expect(data.has(body.queue_ack.queue_key)).toBe(true);
    } finally { spy.mockRestore(); }
  });
  it("preserves queue identity and original queue time when another receipt is requested",async()=>{
    const {kv}=store();const first=await call({REVENUE_KV:kv});const second=await call({REVENUE_KV:kv});
    expect(second.body.queue_ack.as_of).toBe(first.body.queue_ack.as_of);
    expect(second.body.card.sha256).toBe(first.body.card.sha256);
    expect(second.body.queue_ack.reused).toBe(true);
  });
});
it("the unpaid preview exposes the missing store without claiming execution readiness",async()=>{
  payment.mockResolvedValue({ok:false,reason:"no payment"} as any);
  const response=await onRequestGet({request:new Request(origin+"/api/request-attestation?subject=qwen3:4b"),env:{}} as any);
  expect(response.status).toBe(402);const body=await response.json() as any;
  expect(body.csoai.preview.commission_store).toBe("UNAVAILABLE");
  expect(body.csoai.preview.queue_binding_configured).toBe(false);
  expect(body.csoai.preview.execution_readiness).toBe("NOT_ESTABLISHED_BY_THIS_PREVIEW");
});
describe("non-authoritative issuance telemetry",()=>{
  it("counter failure never masks a successful queue readback",async()=>{
    const {kv,data}=store();vi.mocked(kv.put).mockImplementation(async(k,v)=>{
      if(k==="count:issuances")throw Error("counter failed");data.set(k,String(v));
    });
    const {response,body}=await call({REVENUE_KV:kv});expect(response.status).toBe(200);
    expect(body.card.payload.enqueued).toBe(true);expect(body.issuance_counter).toBe("UPDATE_UNCONFIRMED");
  });
  it("a reused observed intent does not increment the best-effort counter again",async()=>{
    const {kv,data}=store();await call({REVENUE_KV:kv});const b=await call({REVENUE_KV:kv});
    expect(data.get("count:issuances")).toBe("1");expect(b.body.issuance_counter).toBe("NOT_UPDATED_REUSED_INTENT");
  });
  it("malformed existing telemetry is not silently reset",async()=>{
    const {kv,data}=store();data.set("count:issuances","not-a-count");const {body}=await call({REVENUE_KV:kv});
    expect(body.issuance_counter).toBe("INVALID_EXISTING_COUNTER");expect(data.get("count:issuances")).toBe("not-a-count");
    expect(body.card.payload.enqueued).toBe(true);
  });
});
describe("real-sized references and refreshed receipts",()=>{
  it("fits full-length card references within the existing atom without hiding total matches",async()=>{
    const cells=Array.from({length:30},(_,i)=>({model:"qwen3:4b",axis:"governance",card:i.toString(16).padStart(64,"0"),card_url:`/signed/cards/${i}.json`,signed:true}));
    vi.stubGlobal("fetch",async()=>Response.json({as_of:"2026-09-18T00:00:00Z",cells}));
    const {kv}=store();const {response,body}=await call({REVENUE_KV:kv});
    expect(response.status).toBe(200);expect(body.bytes).toBeLessThanOrEqual(3072);
    expect(body.card.payload.reserve_count).toBe(30);
    expect(body.card.payload.reserve_returned).toBe(body.card.payload.reserve.length);
    expect(body.card.payload.reserve_returned).toBeGreaterThan(0);
    expect(body.card.payload.reserve_returned).toBeLessThan(24);
  });
  it("new reserve metadata cannot inflate one commission into two customer requests",async()=>{
    const {kv,data}=store();const a=await call({REVENUE_KV:kv});
    vi.stubGlobal("fetch",async()=>Response.json({as_of:"2026-09-18T00:00:00Z",cells:[
      {model:"qwen3:4b",axis:"governance",card:"e".repeat(64),card_url:"/signed/cards/e.json",signed:true}]}));
    const b=await call({REVENUE_KV:kv});expect(b.body.card.sha256).not.toBe(a.body.card.sha256);
    expect(b.body.card.payload.commission_id).toBe(a.body.card.payload.commission_id);
    expect([...data.keys()].filter(k=>k.startsWith("ras:"))).toHaveLength(2);
    const index=async()=>Response.json({schema:"csoai.pod-cards-index/0.1",cards:[]});
    const view=await buildCommissions({REVENUE_KV:kv},origin,index as typeof fetch) as any;
    expect(view.count).toBe(1);expect(view.commissions[0].commission_id).toBe(a.body.queue_ack.commission_id);
  });
});
