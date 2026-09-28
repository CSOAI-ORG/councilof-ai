import { describe, expect, it } from "vitest";
import { buildDoorSettles, foldDoorSettles, onRequestGet, DOOR_SETTLES_SCHEMA } from "./door-settles";
import { listSettlementRecords } from "./revenue";

/**
 * /api/door-settles reads the records /api/revenue reads, through the same enumerator, and
 * says null — never a guessed date — for a door with no record. Proven here so the guard can
 * fail: no store → UNMEASURED with no rows; a store with three records for one door and none
 * for another → one row carrying the LATEST settle, and nothing at all for the other.
 */

function kvFrom(entries: Record<string, string>, opts: { failGet?: boolean } = {}) {
  const store = new Map(Object.entries(entries));
  return {
    get: async (k: string) => {
      if (opts.failGet) throw new Error("kv get exploded");
      return store.get(k) ?? null;
    },
    put: async (k: string, v: string) => { store.set(k, v); },
    list: async ({ prefix }: { prefix: string }) => ({
      keys: [...store.keys()].filter((n) => n.startsWith(prefix)).map((name) => ({ name })),
      list_complete: true,
      cursor: "",
    }),
  } as unknown as KVNamespace;
}

const rec = (o: Record<string, unknown>) =>
  JSON.stringify({ schema: "csoai.x402.settlement/0.1", network: "eip155:8453", payer: "0xAAAA", self: false, amount_atomic: "10000", zero_value: false, ...o });

const DOOR = "https://councilof.ai/api/proof?bundle=1";
const POP = "https://councilof.ai/api/pop/stablecoins";

describe("/api/door-settles", () => {
  it("is UNMEASURED with no rows, never an empty finding, without a store", async () => {
    const r = await buildDoorSettles({});
    expect(r).toMatchObject({ schema: DOOR_SETTLES_SCHEMA, kind: "UNMEASURED", rows: [], records: null, records_unreadable: null });
    expect(r.reason).toMatch(/no REVENUE_KV bound/);
    expect(r.null_rule).toMatch(/null \(UNMEASURED\), never a date inferred/);
  });

  it("gives each recorded door its LATEST settle and tx; a door with no record is absent (null on the page)", async () => {
    const kv = kvFrom({
      "settled:tx:0x1": rec({ transaction: "0x1", resource: DOOR, settled_at: "2026-09-01T10:00:00.000Z" }),
      "settled:tx:0x3": rec({ transaction: "0x3", resource: DOOR, settled_at: "2026-09-20T09:30:00.000Z", self: true }),
      "settled:tx:0x2": rec({ transaction: "0x2", resource: DOOR, settled_at: "2026-09-10T10:00:00.000Z" }),
      "settled:tx:0x9": rec({ transaction: "0x9", resource: POP, settled_at: "2026-09-22T12:00:00.000Z", zero_value: true }),
      "settled:usdc_atomic": "20000",
    });
    const r = await buildDoorSettles({ REVENUE_KV: kv });
    expect(r.kind).toBe("MEASURED");
    expect(r.records).toBe(4);
    expect(r.records_unreadable).toBe(0);
    expect(r.rows.map((x) => x.resource)).toEqual([POP, DOOR]); // sorted by resource
    const door = r.rows.find((x) => x.resource === DOOR)!;
    expect(door).toMatchObject({ last_settle: "2026-09-20T09:30:00.000Z", tx: "0x3", self: true, zero_value: false, settles: 3, route_key: "https://councilof.ai/api/proof" });
    expect(r.rows.find((x) => x.resource === POP)).toMatchObject({ last_settle: "2026-09-22T12:00:00.000Z", tx: "0x9", zero_value: true, settles: 1 });
    expect(r.rows.find((x) => x.resource === "https://councilof.ai/api/free-door")).toBeUndefined();
    // no payer is exposed on this surface
    expect(JSON.stringify(r)).not.toContain("0xAAAA");
  });

  it("counts, never drops, a record it cannot time or place, and never invents a transaction", () => {
    const folded = foldDoorSettles([
      { resource: DOOR, settled_at: "not a date", transaction: "0x1" },
      { resource: "", settled_at: "2026-09-01T00:00:00Z", transaction: "0x2" },
      { settled_at: "2026-09-01T00:00:00Z", transaction: "0x3" },
      { resource: DOOR, settled_at: "2026-09-02T00:00:00Z" },
    ]);
    expect(folded.without_time).toBe(1);
    expect(folded.without_resource).toBe(2);
    expect(folded.rows).toEqual([
      { resource: DOOR, route_key: "https://councilof.ai/api/proof", last_settle: "2026-09-02T00:00:00Z", tx: null, network: null, self: null, zero_value: null, settles: 1 },
    ]);
  });

  it("reads through revenue's enumerator: an unreadable key is counted by both surfaces the same way", async () => {
    const kv = kvFrom({
      "settled:tx:ok": rec({ transaction: "ok", resource: DOOR, settled_at: "2026-09-02T00:00:00Z" }),
      "settled:tx:bad": "{not json",
      "settled:tx:empty": "",
    });
    const listed = await listSettlementRecords(kv);
    expect(listed.keys).toHaveLength(3);
    expect(listed.records).toHaveLength(1);
    expect(listed.unreadable).toBe(2);
    const r = await buildDoorSettles({ REVENUE_KV: kv });
    expect(r.records_unreadable).toBe(2);
    expect(r.rows).toHaveLength(1);
  });

  it("is UNMEASURED with the reason, not an empty MEASURED, when the store cannot be read", async () => {
    const r = await buildDoorSettles({ REVENUE_KV: kvFrom({ "settled:tx:x": "{}" }, { failGet: true }) });
    expect(r.kind).toBe("UNMEASURED");
    expect(r.rows).toEqual([]);
    expect(r.reason).toMatch(/kv get exploded/);
  });

  it("serves JSON, no-store, CORS open, so the page can read it", async () => {
    const res = await (onRequestGet as unknown as (c: unknown) => Promise<Response>)({ request: new Request("https://councilof.ai/api/door-settles"), env: {} });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(((await res.json()) as { schema: string }).schema).toBe(DOOR_SETTLES_SCHEMA);
  });
});
