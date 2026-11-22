// @vitest-environment jsdom
/**
 * toolReceipts — the local run log's invariants (2026-11-02, plan item P5).
 *
 * The receipts are note-taking, not evidence: the tests hold the honesty shape
 * (not_signed_evidence on every record, args hashed and never stored) and the
 * mechanics (ring buffer cap, clear, export shape, stable argument hashing).
 *
 * THE STORE IS SUPPLIED, NOT INHERITED (2026-11-06). Node 22 ships a Web Storage global of its own
 * and Node 24+ enables it by default. Vitest's jsdom environment only fills in globals the runtime
 * does not already own, and in that environment `window` IS the global object - so on a newer Node
 * `localStorage` was the Node runtime's, and it was undefined. This suite then read an empty store
 * and wrote nowhere, and it went red on a developer's desk while CI, pinned to Node 20, stayed
 * green: the desk and the gate were running different programs.
 *
 * So the suite now SUPPLIES the store it asserts against, and asserts against that store rather
 * than against whatever the runtime happened to provide. Every assertion here is then about the
 * module and this test sharing ONE store, on every runtime - and the defect becomes visible to a
 * gate that cannot run the developer's Node.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  RECEIPTS_CAP,
  RECEIPTS_KEY,
  clearToolReceipts,
  exportToolReceipts,
  fnv1aHex,
  hashArgs,
  listToolReceipts,
  recordToolReceipt,
  stableArgsString,
} from "./toolReceipts";

/** The slice of the Storage interface the module uses, backed by a Map. */
type TestStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function makeStore(): TestStore {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? (map.get(key) as string) : null),
    setItem: (key, value) => {
      map.set(key, String(value));
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

let store: TestStore;

beforeEach(() => {
  store = makeStore();
  // The suite owns the store. See the header for why it may not inherit one.
  vi.stubGlobal("localStorage", store);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("toolReceipts", () => {
  it("records a receipt with the honesty field and no raw arguments", async () => {
    const hash = await hashArgs({ framework: "dora" });
    const r = recordToolReceipt({ tool: "framework_readiness", argsHash: hash, outcome: "OK" });
    expect(r?.not_signed_evidence).toBe(true);
    const list = listToolReceipts();
    expect(list).toHaveLength(1);
    expect(list[0].tool).toBe("framework_readiness");
    expect(list[0].args_hash).toBe(hash);
    expect(JSON.stringify(list)).not.toContain("dora"); // args hashed, never stored
  });

  it("hashes the same arguments identically regardless of key order", async () => {
    const a = await hashArgs({ framework: "gdpr", sector: "finance" });
    const b = await hashArgs({ sector: "finance", framework: "gdpr" });
    expect(a).toBe(b);
    expect(a).not.toBe(await hashArgs({ framework: "gdpr", sector: "healthcare" }));
  });

  it("stableArgsString is canonical JSON with sorted keys", () => {
    expect(stableArgsString({ b: 1, a: [true, null] })).toBe('{"a":[true,null],"b":1}');
  });

  it("keeps at most the cap, dropping the oldest", () => {
    for (let i = 0; i < RECEIPTS_CAP + 5; i++) {
      recordToolReceipt({ tool: `t${i}`, argsHash: "x", outcome: "OK", at: `2026-01-01T00:${String(i % 60).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}Z` });
    }
    const list = listToolReceipts();
    expect(list).toHaveLength(RECEIPTS_CAP);
    expect(list[0].tool).toBe(`t${RECEIPTS_CAP + 4}`); // newest first
    expect(list[list.length - 1].tool).toBe("t5"); // oldest five dropped
  });

  it("signals coai:receipts-changed after a record so mounted panes refresh", () => {
    let fired = 0;
    const listener = () => { fired += 1; };
    window.addEventListener("coai:receipts-changed", listener);
    try {
      recordToolReceipt({ tool: "get_root", argsHash: "x", outcome: "VALID" });
      expect(fired).toBe(1);
      clearToolReceipts();
      expect(fired).toBe(2);
    } finally {
      window.removeEventListener("coai:receipts-changed", listener);
    }
  });

  it("clear removes everything", () => {
    recordToolReceipt({ tool: "get_root", argsHash: "x", outcome: "VALID" });
    expect(listToolReceipts()).toHaveLength(1);
    clearToolReceipts();
    expect(listToolReceipts()).toHaveLength(0);
    expect(store.getItem(RECEIPTS_KEY)).toBeNull();
  });

  it("export carries the schema, the not-evidence note and every receipt", () => {
    recordToolReceipt({ tool: "verify_card", argsHash: "x", outcome: "VALID" });
    const json = exportToolReceipts();
    expect(json).toBeTruthy();
    const parsed = JSON.parse(json as string);
    expect(parsed.schema).toBe("csoai.tool-receipts/1");
    expect(parsed.note).toContain("Not signed evidence");
    expect(parsed.receipts).toHaveLength(1);
  });

  it("a corrupted store reads as empty rather than throwing", () => {
    store.setItem(RECEIPTS_KEY, "{not json");
    expect(listToolReceipts()).toHaveLength(0);
    expect(recordToolReceipt({ tool: "t", argsHash: "x", outcome: "OK" })).not.toBeNull();
  });

  it("the fnv1a fallback is stable and marked as not-sha256", () => {
    expect(fnv1aHex("abc")).toBe(fnv1aHex("abc"));
    expect(fnv1aHex("abc").startsWith("fnv1a:")).toBe(true);
    expect(fnv1aHex("abc")).not.toBe(fnv1aHex("abd"));
  });

  it("writes into the store this suite supplied, not into one the runtime owns", () => {
    // THE PIN. The module and this test must share ONE store, on every runtime. If the module
    // reached a store this test cannot see - the Node runtime's own, on a newer Node - the
    // receipt would be written somewhere else and this assertion would fail HERE, on Node 20 in
    // CI, where the runtime happens not to own the name and the defect was invisible.
    expect(store.getItem(RECEIPTS_KEY)).toBeNull();
    const receipt = recordToolReceipt({ tool: "shared", argsHash: "h", outcome: "OK" });
    expect(receipt?.not_signed_evidence).toBe(true);
    expect(store.getItem(RECEIPTS_KEY)).toContain("shared");
    expect(listToolReceipts().map((r) => r.tool)).toEqual(["shared"]);
  });
});
