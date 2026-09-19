import { describe, expect, it } from "vitest";
import { buildCommissionQueue, listCommissionQueue } from "./commission-queue";

type Store = Map<string, string>;

function fakeKv(store: Store): KVNamespace {
  return {
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async list({ prefix, cursor, limit }: { prefix: string; cursor?: string; limit?: number }) {
      const keys = [...store.keys()]
        .filter((k) => k.startsWith(prefix))
        .sort()
        .map((name) => ({ name }));
      const start = cursor ? Number(cursor) : 0;
      const slice = keys.slice(start, start + (limit ?? 1000));
      const next = start + slice.length;
      return {
        keys: slice,
        list_complete: next >= keys.length,
        cursor: next >= keys.length ? undefined : String(next),
      };
    },
  } as unknown as KVNamespace;
}

describe("listCommissionQueue", () => {
  it("surfaces QUEUED ras:* with non-null model when mill:commission:* is empty", async () => {
    const store = new Map<string, string>([
      [
        "ras:abc",
        JSON.stringify({
          subject: "llama3.2:3b",
          as_of: "2026-09-14T00:00:00Z",
          tx: "0xtx",
        }),
      ],
      [
        "ras:sku",
        JSON.stringify({
          subject: "payai-wrapper-0.01-2026-09-14",
          as_of: "2026-09-14T00:00:01Z",
        }),
      ],
    ]);
    const { rows } = await listCommissionQueue(fakeKv(store));
    expect(rows.map((r) => r.subject)).toEqual(["llama3.2:3b"]);
    expect(rows[0].fulfillment).toBe("QUEUED");
    expect(rows[0].model).toBe("llama3.2:3b");
    expect(rows[0].source).toBe("ras");
  });

  it("prefers mill:commission:* over ras:* for the same subject", async () => {
    const store = new Map<string, string>([
      [
        "ras:old",
        JSON.stringify({
          subject: "llama3.2:3b",
          as_of: "2026-09-01T00:00:00Z",
        }),
      ],
      [
        "mill:commission:llama3.2:3b",
        JSON.stringify({
          subject: "llama3.2:3b",
          model: "llama3.2:3b",
          subject_kind: "ollama_model",
          fulfillment: "QUEUED",
          as_of: "2026-09-14T12:00:00Z",
          receipt_sha: "new",
        }),
      ],
    ]);
    const { rows } = await listCommissionQueue(fakeKv(store));
    expect(rows).toHaveLength(1);
    expect(rows[0].source).toBe("mill:commission");
    expect(rows[0].receipt_sha).toBe("new");
  });

  it("excludes RETRIEVABLE mill and ras rows from mill-visible queue", async () => {
    const store = new Map<string, string>([
      [
        "ras:done",
        JSON.stringify({
          subject: "llama3.2:3b",
          model: "llama3.2:3b",
          fulfillment: "RETRIEVABLE",
          as_of: "2026-09-14T00:00:00Z",
        }),
      ],
      [
        "mill:commission:llama3.2:3b",
        JSON.stringify({
          subject: "llama3.2:3b",
          model: "llama3.2:3b",
          subject_kind: "ollama_model",
          fulfillment: "RETRIEVABLE",
          as_of: "2026-09-14T12:00:00Z",
          receipt_sha: "done",
        }),
      ],
      [
        "ras:still",
        JSON.stringify({
          subject: "qwen3:4b",
          model: "qwen3:4b",
          fulfillment: "QUEUED",
          as_of: "2026-09-14T01:00:00Z",
        }),
      ],
    ]);
    const { rows } = await listCommissionQueue(fakeKv(store));
    expect(rows.map((r) => r.subject)).toEqual(["qwen3:4b"]);
    expect(rows[0].fulfillment).toBe("QUEUED");
  });

});

describe("buildCommissionQueue delivery reconciliation", () => {
  const queued = JSON.stringify({
    subject: "llama3.2:3b",
    subject_kind: "ollama_model",
    model: "llama3.2:3b",
    fulfillment: "QUEUED",
    axis: "governance",
    receipt_sha: "d".repeat(64),
  });
  const response = (cards: unknown[], status = 200) =>
    (async () => new Response(JSON.stringify({ schema: "csoai.pod-cards-index/0.1", cards }), { status })) as typeof fetch;

  it("retains work when a model/axis card is not bound to the commission", async () => {
    const kv = fakeKv(new Map([["mill:commission:llama3.2:3b", queued]]));
    const body = await buildCommissionQueue({ REVENUE_KV: kv }, "https://councilof.ai", response([
      { id: "e".repeat(64), url: "https://councilof.ai/interop/mill-cards-signed/e.json",
        subject: "llama3.2:3b", axis: "governance", n: 235, status: "MEASURED", run_id: "r" },
    ])) as any;
    expect(body.rows).toHaveLength(1);
    expect(body.rows[0].delivery_state).toBe("EVIDENCE_PRESENT_NOT_REQUEST_BOUND");
    expect(body.delivery_reconciliation).toMatchObject({ state: "READ", suppressed: 0, candidate_matches: 1 });
  });

  it("keeps work visible and reports UNCHECKABLE when the signed-card index cannot be read", async () => {
    const kv = fakeKv(new Map([["mill:commission:llama3.2:3b", queued]]));
    const body = await buildCommissionQueue({ REVENUE_KV: kv }, "https://councilof.ai", response([], 404)) as any;
    expect(body.rows).toHaveLength(1);
    expect(body.delivery_reconciliation).toMatchObject({ state: "UNCHECKABLE", suppressed: 0 });
  });
});
