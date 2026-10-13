import { describe, expect, it } from "vitest";
import {
  DELIVERY_BYTES_PREFIX,
  DELIVERY_RECORD_PREFIX,
  bindDeliveredJson,
  deliveryOrderId,
} from "./_delivery_binding";

function fakeKv() {
  const map = new Map<string, string>();
  return {
    map,
    async get(key: string) {
      return map.get(key) ?? null;
    },
    async put(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe("exact order-to-delivery binding", () => {
  it("binds the full resource including query to exact delivered bytes", async () => {
    const kv = fakeKv();
    const resource = "https://councilof.ai/api/eunomia-data?feed=1";
    const body = { schema: "test/1", rows: [1, 2, 3] };
    const out = await bindDeliveredJson({
      body,
      resourceUrl: resource,
      transaction: "0xabc",
      payer: "0x123",
      kv,
      deliveredAt: 1_700_000_000,
    });
    expect(out.record.payload.resource_url).toBe(resource);
    expect(out.record.payload.bytes_sha256).toBe(out.bodySha256);
    expect(out.record.payload.bytes_length).toBe(new TextEncoder().encode(out.bodyText).byteLength);
    expect(out.record.payload.transaction).toBe("0xabc");
    expect(out.record.payload.payer).toBe("0x123");
    expect(out.record.retained_bytes).toBe(true);
    expect(out.record.retained_artifact_ref).toBe("kv:" + DELIVERY_BYTES_PREFIX + out.orderId);
    expect(kv.map.get(DELIVERY_BYTES_PREFIX + out.orderId)).toBe(out.bodyText);
    expect(kv.map.has(DELIVERY_RECORD_PREFIX + out.orderId)).toBe(true);
    expect(out.record.signed_delivery_receipt).toBeNull();
    expect(out.record.signing_gap).toMatch(/absent/);
  });

  it("changes order identity when the query or delivered bytes change", async () => {
    const a = await deliveryOrderId({
      resourceUrl: "https://councilof.ai/api/eunomia-data?feed=1",
      bodySha256: "a".repeat(64),
      transaction: "0xabc",
    });
    const b = await deliveryOrderId({
      resourceUrl: "https://councilof.ai/api/eunomia-data?feed=2",
      bodySha256: "a".repeat(64),
      transaction: "0xabc",
    });
    const c = await deliveryOrderId({
      resourceUrl: "https://councilof.ai/api/eunomia-data?feed=1",
      bodySha256: "b".repeat(64),
      transaction: "0xabc",
    });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });
  it("never claims retention when no store is bound", async () => {
    const out = await bindDeliveredJson({
      body: { ok: true },
      resourceUrl: "https://councilof.ai/api/eunomia-data?feed=1",
      transaction: "0xabc",
    });
    expect(out.stored).toBe(false);
    expect(out.record.retained_bytes).toBe(false);
    expect(out.record.retained_artifact_ref).toBeNull();
  });
});
