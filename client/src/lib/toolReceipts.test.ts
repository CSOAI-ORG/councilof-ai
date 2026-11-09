// @vitest-environment jsdom
/**
 * toolReceipts — the local run log's invariants (2026-11-02, plan item P5).
 *
 * The receipts are note-taking, not evidence: the tests hold the honesty shape
 * (not_signed_evidence on every record, args hashed and never stored) and the
 * mechanics (ring buffer cap, clear, export shape, stable argument hashing).
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
