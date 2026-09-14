import { describe, expect, it } from "vitest";
import { onRequestGet } from "./commissions";

function kvFrom(entries: Record<string, string>) {
  const store = new Map(Object.entries(entries));
  return {
    get: async (k: string) => store.get(k) ?? null,
    put: async (k: string, v: string) => { store.set(k, v); },
    list: async ({ prefix }: { prefix: string }) => ({
      keys: [...store.keys()].filter((n) => n.startsWith(prefix)).map((name) => ({ name })),
      list_complete: true,
      cursor: "",
    }),
  } as unknown as KVNamespace;
}

const call = async (env: Record<string, unknown>) => {
  const res = await onRequestGet({ request: new Request("https://councilof.ai/api/commissions"), env } as never);
  return (await res.json()) as { status: string; subjects: string[] | null; commissions: Array<Record<string, unknown>> | null; count?: number; records_unreadable?: number };
};

describe("/api/commissions — the bridge from a paid request to the mill", () => {
  it("is null, never an empty list, without a store", async () => {
    const body = await call({});
    expect(body).toMatchObject({ status: "UNMEASURED", subjects: null, commissions: null });
  });

  it("lists ras:* records oldest first, dedupes subjects, exposes no payer or amount, and counts junk as unreadable", async () => {
    const kv = kvFrom({
      "ras:aaa": JSON.stringify({ subject: "org/model-a", axis: "governance", tx: "0x1", as_of: "2026-09-10T00:00:00Z" }),
      "ras:bbb": JSON.stringify({ subject: "org/model-a", axis: null, tx: "0x2", as_of: "2026-09-12T00:00:00Z" }),
      "ras:ccc": JSON.stringify({ subject: "org/model-b", tx: "0x3", as_of: "2026-09-11T00:00:00Z", payer: "0xSECRET", amount_atomic: "10000" }),
      "ras:junk": "{not json",
      "settled:tx:0x1": JSON.stringify({ payer: "0xPAYER" }),
    });
    const body = await call({ REVENUE_KV: kv });
    expect(body.status).toBe("MEASURED");
    expect(body.count).toBe(3);
    expect(body.subjects).toEqual(["org/model-a", "org/model-b"]);
    expect(body.commissions!.map((c) => c.as_of)).toEqual(["2026-09-10T00:00:00Z", "2026-09-11T00:00:00Z", "2026-09-12T00:00:00Z"]);
    expect(JSON.stringify(body)).not.toMatch(/0xSECRET|0xPAYER|amount_atomic|10000/);
    expect(body.records_unreadable).toBe(1);
  });
});
