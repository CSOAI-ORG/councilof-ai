import { describe, expect, it } from "vitest";
import { listCommissionQueue } from "./commission-queue";

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
});
