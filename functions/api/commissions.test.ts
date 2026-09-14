import { describe, expect, it } from "vitest";
import { buildCommissions, onRequestGet, POD_CARDS_INDEX } from "./commissions";

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

describe("/api/commissions — requester retrieval (join to the signed pod-cards index)", () => {

  const index = {
    schema: "csoai.pod-cards-index/0.1",
    cards: [
      { id: "c".repeat(64), url: "https://councilof.ai/interop/mill-cards-signed/signed-swarm-c.json", subject: "llama3.2:3b", axis: "swarm", n: 37, status: "MEASURED", run_id: "20260914T032410.595977Z-a7bb0359af" },
      { id: "e".repeat(64), url: "https://councilof.ai/interop/mill-cards-signed/signed-governan-e.json", subject: "llama3.2:3b", axis: "governance", n: 235, status: "MEASURED", run_id: null },
      { id: "q".repeat(64), url: "https://councilof.ai/interop/mill-cards-signed/signed-swarm-q.json", subject: "qwen3:4b", axis: "swarm", n: 37, status: "MEASURED", run_id: null },
    ],
  };
  const fetcherWith = (status: number, body: unknown) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
  const kv = () => kvFrom({
    "ras:dd27": JSON.stringify({ subject: "llama3.2:3b", model: "llama3.2:3b", fulfillment: "QUEUED", axis: null, tx: "0x6", as_of: "2026-09-11T13:30:53Z" }),
    "ras:397f": JSON.stringify({ subject: "llama3.2:3b", model: "llama3.2:3b", fulfillment: "QUEUED", axis: "governance", tx: "0xe", as_of: "2026-09-12T06:15:53Z" }),
    "ras:wrap": JSON.stringify({ subject: "payai-wrapper-x", fulfillment: "UNFULFILLABLE", tx: "0xw", as_of: "2026-09-13T00:00:00Z" }),
  });

  it("joins each QUEUED commission to the signed cards for its subject (axis-scoped when the receipt names one)", async () => {
    const body = await buildCommissions({ REVENUE_KV: kv() }, "https://councilof.ai", fetcherWith(200, index)) as { commissions: Array<Record<string, any>>; delivered: number | null; retrieval: Record<string, string> };
    const [subj, gov, wrap] = body.commissions;
    expect(subj.cards.map((c: any) => c.axis).sort()).toEqual(["governance", "swarm"]);
    expect(subj.delivery).toEqual({ state: "CARDS_PUBLISHED", count: 2 });
    expect(gov.cards.map((c: any) => c.id)).toEqual(["e".repeat(64)]);
    expect(gov.cards[0].url).toContain("/interop/mill-cards-signed/");
    expect(wrap.cards).toBeNull();
    expect(wrap.delivery.state).toBe("NONE");
    expect(body.delivered).toBe(2);
    expect(body.retrieval.state).toBe("READ");
    expect(body.retrieval.index).toBe(POD_CARDS_INDEX);
    // publication never rewrites the typed fulfillment field
    expect(subj.fulfillment).toBe("QUEUED");
  });

  it("is UNCHECKABLE with null cards when the index cannot be read — never an empty delivery", async () => {
    for (const f of [fetcherWith(404, {}), fetcherWith(200, { schema: "other", cards: [] }), (async () => { throw new TypeError("fetch failed"); }) as unknown as typeof fetch]) {
      const body = await buildCommissions({ REVENUE_KV: kv() }, "https://councilof.ai", f) as { commissions: Array<Record<string, any>>; delivered: number | null; retrieval: Record<string, string> };
      expect(body.commissions[0].cards).toBeNull();
      expect(body.commissions[0].delivery.state).toBe("UNCHECKABLE");
      expect(body.delivered).toBeNull();
      expect(body.retrieval.state).toBe("UNCHECKABLE");
    }
  });

  it("prefers the ASSETS binding when present", async () => {
    const ASSETS = { fetch: async (r: Request) => { expect(new URL(r.url).pathname).toBe(POD_CARDS_INDEX); return new Response(JSON.stringify(index), { status: 200 }); } };
    const body = await buildCommissions({ REVENUE_KV: kv(), ASSETS }, "https://councilof.ai") as { delivered: number | null };
    expect(body.delivered).toBe(2);
  });
});
