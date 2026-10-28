import { describe, expect, it } from "vitest";
import { buildDeliveryRecord, deliveryTxKey, markPaidUndeliveredResponse, readDeliveryByTransaction, storeDeliveryRecord } from "./_x402_delivery_record";

class KV {
  rows = new Map<string,string>();
  puts = 0;
  async get(k:string){ return this.rows.get(k) ?? null; }
  async put(k:string,v:string){ this.puts++; this.rows.set(k,v); }
}
const base = () => buildDeliveryRecord({transaction:"0xabc",resource:"https://councilof.ai/api/signed-data-feed?feed=1",response_sha256:"a".repeat(64),response_bytes:123,delivered_at:"2026-10-01T07:00:00Z"});

describe("append-only x402 delivery record",()=>{
  it("writes once and reads by settlement transaction",async()=>{const kv=new KV();const r=base();expect((await storeDeliveryRecord(kv,r)).stored).toBe(true);expect(kv.puts).toBe(1);expect((await readDeliveryByTransaction(kv,"0xabc"))?.response_sha256).toBe("a".repeat(64));expect([...kv.rows.keys()]).toEqual([deliveryTxKey("0xabc")]);});
  it("identical replay is idempotent and does not overwrite",async()=>{const kv=new KV();const r=base();await storeDeliveryRecord(kv,r);const first=kv.rows.get(deliveryTxKey("0xabc"));const out=await storeDeliveryRecord(kv,{...r,delivered_at:"2026-10-01T08:00:00Z"});expect(out).toMatchObject({stored:false,existing:true,conflict:false});expect(kv.puts).toBe(1);expect(kv.rows.get(deliveryTxKey("0xabc"))).toBe(first);});
  it("conflicting bytes fail closed and never overwrite",async()=>{const kv=new KV();const r=base();await storeDeliveryRecord(kv,r);const first=kv.rows.get(deliveryTxKey("0xabc"));const out=await storeDeliveryRecord(kv,{...r,response_sha256:"b".repeat(64)});expect(out).toMatchObject({stored:false,existing:true,conflict:true});expect(kv.puts).toBe(1);expect(kv.rows.get(deliveryTxKey("0xabc"))).toBe(first);});
  it("missing KV is explicit",async()=>expect(await storeDeliveryRecord(undefined,base())).toMatchObject({stored:false,existing:false,conflict:false,reason:"no REVENUE_KV bound"}));
  it("rejects malformed digest, byte count and transaction",()=>{expect(()=>buildDeliveryRecord({...base(),response_sha256:"ABC"} as any)).toThrow(/response_sha256/);expect(()=>buildDeliveryRecord({...base(),response_bytes:-1} as any)).toThrow(/response_bytes/);expect(()=>buildDeliveryRecord({...base(),transaction:"bad tx"} as any)).toThrow(/transaction/);});
  it("does not treat unreadable existing bytes as safe to replace",async()=>{const kv=new KV();kv.rows.set(deliveryTxKey("0xabc"),"not-json");const out=await storeDeliveryRecord(kv,base());expect(out).toMatchObject({stored:false,existing:true,conflict:true});expect(kv.puts).toBe(0);});
});

describe("paid-undelivered response header exposure", () => {
  it.each([
    {
      name: "adds the failure-state header to existing exposure",
      status: 200,
      expose: "X-Artifact",
      echo: "reported-settlement",
    },
    {
      name: "keeps one existing mixed-case failure-state exposure",
      status: 503,
      expose: "X-Artifact, X-CSOAI-DELIVERY-STATE",
      echo: undefined,
    },
  ])("$name", async ({ status, expose, echo }) => {
    const input = new Response("unchanged failure café 雪", {
      status,
      statusText: "Fixture response",
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
        "access-control-expose-headers": expose,
        "x-artifact": "unchanged",
      },
    });

    const out = markPaidUndeliveredResponse(input, true, echo);

    expect(out.status).toBe(status);
    expect(out.statusText).toBe("Fixture response");
    expect(await out.text()).toBe("unchanged failure café 雪");
    expect(out.headers.get("x-csoai-delivery-record-state")).toBe("NOT_DELIVERED");
    expect(out.headers.get("x-csoai-delivery-state")).toBe("PAID_NOT_DELIVERED");
    expect(out.headers.get("x-payment-response")).toBe(echo ?? null);
    expect(out.headers.get("x-artifact")).toBe("unchanged");
    expect(out.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(out.headers.get("cache-control")).toBe("no-store");
    expect(out.headers.get("access-control-allow-origin")).toBe("*");

    const exposed = (out.headers.get("access-control-expose-headers") || "")
      .split(",")
      .map(name => name.trim().toLowerCase());

    for (const name of [
      "x-artifact",
      "x-csoai-delivery-record-state",
      "x-csoai-delivery-state",
    ]) {
      expect(exposed.filter(value => value === name)).toHaveLength(1);
    }
    expect(exposed.filter(value => value === "x-payment-response"))
      .toHaveLength(echo ? 1 : 0);
  });

  it("preserves an unpaid response object and every original header", async () => {
    const input = new Response("unchanged unpaid failure", {
      status: 503,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-expose-headers": "X-Artifact",
        "x-artifact": "unchanged",
      },
    });
    const before = [...input.headers];

    const out = markPaidUndeliveredResponse(input, false, "must-not-be-added");

    expect(out).toBe(input);
    expect([...out.headers]).toEqual(before);
    expect(await out.text()).toBe("unchanged unpaid failure");
    expect(out.headers.get("x-csoai-delivery-record-state")).toBeNull();
    expect(out.headers.get("x-csoai-delivery-state")).toBeNull();
    expect(out.headers.get("x-payment-response")).toBeNull();
  });
});
