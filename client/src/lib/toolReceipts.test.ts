// @vitest-environment jsdom
/**
 * toolReceipts — the local run log's invariants (2026-11-02, plan item P5).
 *
 * The receipts are note-taking, not evidence: the tests hold the honesty shape
 * (not_signed_evidence on every record, args hashed and never stored) and the
 * mechanics (ring buffer cap, clear, export shape, stable argument hashing).
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
  subscribeToolReceipts,
} from "./toolReceipts";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

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

  it("clear removes everything", () => {
    recordToolReceipt({ tool: "get_root", argsHash: "x", outcome: "VALID" });
    expect(listToolReceipts()).toHaveLength(1);
    clearToolReceipts();
    expect(listToolReceipts()).toHaveLength(0);
    expect(localStorage.getItem(RECEIPTS_KEY)).toBeNull();
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
    localStorage.setItem(RECEIPTS_KEY, "{not json");
    expect(listToolReceipts()).toHaveLength(0);
    expect(recordToolReceipt({ tool: "t", argsHash: "x", outcome: "OK" })).not.toBeNull();
  });

  it("the fnv1a fallback is stable and marked as not-sha256", () => {
    expect(fnv1aHex("abc")).toBe(fnv1aHex("abc"));
    expect(fnv1aHex("abc").startsWith("fnv1a:")).toBe(true);
    expect(fnv1aHex("abc")).not.toBe(fnv1aHex("abd"));
  });
});

describe("tool receipt updates", () => {
  afterEach(() => vi.restoreAllMocks());

  it("notifies this tab after successful writes and clear, then unsubscribes", () => {
    const changed = vi.fn();
    const unsubscribe = subscribeToolReceipts(changed);
    try {
      recordToolReceipt({ tool: "get_root", argsHash: "x", outcome: "VALID" });
      expect(changed).toHaveBeenCalledTimes(1);
      clearToolReceipts();
      expect(changed).toHaveBeenCalledTimes(2);
      unsubscribe();
      recordToolReceipt({ tool: "get_root", argsHash: "x", outcome: "VALID" });
      expect(changed).toHaveBeenCalledTimes(2);
    } finally {
      unsubscribe();
    }
  });

  it("observes other-tab receipt writes and clear-all while ignoring unrelated stores", () => {
    const changed = vi.fn();
    const unsubscribe = subscribeToolReceipts(changed);
    try {
      window.dispatchEvent(new StorageEvent("storage", { key: "unrelated", storageArea: localStorage }));
      window.dispatchEvent(new StorageEvent("storage", { key: RECEIPTS_KEY, storageArea: sessionStorage }));
      expect(changed).not.toHaveBeenCalled();
      window.dispatchEvent(new StorageEvent("storage", { key: RECEIPTS_KEY, storageArea: localStorage }));
      window.dispatchEvent(new StorageEvent("storage", { key: null, storageArea: localStorage }));
      expect(changed).toHaveBeenCalledTimes(2);
    } finally {
      unsubscribe();
    }
  });

  it("does not announce persistence when the browser refuses the write", () => {
    const changed = vi.fn();
    const unsubscribe = subscribeToolReceipts(changed);
    try {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("Storage full", "QuotaExceededError");
      });
      expect(recordToolReceipt({ tool: "get_root", argsHash: "x", outcome: "VALID" })).toBeNull();
      expect(changed).not.toHaveBeenCalled();
    } finally {
      unsubscribe();
    }
  });

  it("ignores incomplete cached rows and exports only the receipt fields", () => {
    const receipt = recordToolReceipt({ tool: "get_root", argsHash: "x", outcome: "VALID" })!;
    localStorage.setItem(RECEIPTS_KEY, JSON.stringify([
      null, { tool: "missing fields" }, { ...receipt, at: null },
      { ...receipt, args_hash: null }, { ...receipt, not_signed_evidence: false },
      { ...receipt, door: "/unexpected" }, { ...receipt, outcome: [] },
      { ...receipt, raw_arguments: "PRIVATE CONTENT MUST NOT APPEAR" },
    ]));
    expect(listToolReceipts()).toEqual([receipt]);
    expect(exportToolReceipts()).not.toContain("PRIVATE");
  });
});
