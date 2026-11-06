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
  RECEIPTS_EVENT,
  TOOL_RECEIPTS_STORAGE_KEYS,
  clearToolReceipts,
  clearToolReceiptsStatus,
  exportToolReceipts,
  fnv1aHex,
  hashArgs,
  listToolReceipts,
  parseToolReceipt,
  readToolReceiptsStatus,
  recordToolReceipt,
  stableArgsString,
  subscribeToolReceipts,
} from "./toolReceipts";

const HASH = "a".repeat(64);
const receipt = {
  at: "2026-11-06T05:00:00Z",
  tool: "get_root",
  door: "/mcp" as const,
  args_hash: HASH,
  outcome: "VALID",
  not_signed_evidence: true as const,
};
beforeEach(() => {
  localStorage.clear();
  clearToolReceipts();
});
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  clearToolReceipts();
});

describe("toolReceipts", () => {
  it("records a receipt with the honesty field and no raw arguments", async () => {
    const hash = await hashArgs({ framework: "dora" });
    const r = recordToolReceipt({
      tool: "framework_readiness",
      argsHash: hash,
      outcome: "OK",
    });
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
    expect(a).not.toBe(
      await hashArgs({ framework: "gdpr", sector: "healthcare" }),
    );
  });

  it("stableArgsString is canonical JSON with sorted keys", () => {
    expect(stableArgsString({ b: 1, a: [true, null] })).toBe(
      '{"a":[true,null],"b":1}',
    );
  });

  it("keeps at most the cap, dropping the oldest", () => {
    for (let i = 0; i < RECEIPTS_CAP + 5; i++) {
      recordToolReceipt({
        tool: `t${i}`,
        argsHash: HASH,
        outcome: "OK",
        at: `2026-01-01T00:${String(i % 60).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}Z`,
      });
    }
    const list = listToolReceipts();
    expect(list).toHaveLength(RECEIPTS_CAP);
    expect(list[0].tool).toBe(`t${RECEIPTS_CAP + 4}`); // newest first
    expect(list[list.length - 1].tool).toBe("t5"); // oldest five dropped
  });

  it("clear removes everything", () => {
    recordToolReceipt({ tool: "get_root", argsHash: HASH, outcome: "VALID" });
    expect(listToolReceipts()).toHaveLength(1);
    clearToolReceipts();
    expect(listToolReceipts()).toHaveLength(0);
    expect(localStorage.getItem(RECEIPTS_KEY)).toBeNull();
  });

  it("export carries the schema, the not-evidence note and every receipt", () => {
    recordToolReceipt({
      tool: "verify_card",
      argsHash: HASH,
      outcome: "VALID",
    });
    const json = exportToolReceipts();
    expect(json).toBeTruthy();
    const parsed = JSON.parse(json as string);
    expect(parsed.schema).toBe("csoai.tool-receipts/1");
    expect(parsed.note).toContain("Not signed evidence");
    expect(parsed.receipts).toHaveLength(1);
  });

  it("a corrupted store remains unreadable and is not overwritten by a new receipt", () => {
    localStorage.setItem(RECEIPTS_KEY, "{not json");
    expect(listToolReceipts()).toHaveLength(0);
    expect(readToolReceiptsStatus().state).toBe("unreadable");
    expect(
      recordToolReceipt({ tool: "t", argsHash: HASH, outcome: "OK" }),
    ).toBeNull();
    expect(localStorage.getItem(RECEIPTS_KEY)).toBe("{not json");
  });

  it("the fnv1a fallback is stable and marked as not-sha256", () => {
    expect(fnv1aHex("abc")).toBe(fnv1aHex("abc"));
    expect(fnv1aHex("abc").startsWith("fnv1a:")).toBe(true);
    expect(fnv1aHex("abc")).not.toBe(fnv1aHex("abd"));
  });
});

describe("receipt metadata validation and storage outcomes", () => {
  it.each([
    { at: "not a date" },
    { at: "2026-02-31T00:00:00Z" },
    { tool: "" },
    { tool: "bad\nname" },
    { door: "https://other.example/mcp" },
    { args_hash: "raw arguments" },
    { outcome: 42 },
    { not_signed_evidence: false },
    { arguments: { private: "raw input" } },
    { result: "raw output" },
  ])("rejects invalid or extra receipt fields %j", (fields) => {
    expect(parseToolReceipt({ ...receipt, ...fields })).toBeNull();
  });

  it("retains valid offset timestamps and marked fallback hashes exactly", () => {
    const value = {
      ...receipt,
      at: "2026-11-06T07:00:00+02:00",
      args_hash: "fnv1a:1234abcd",
    };
    expect(parseToolReceipt(value)).toEqual(value);
  });

  it("distinguishes a readable empty log from blocked browser storage", () => {
    expect(readToolReceiptsStatus()).toEqual({
      state: "ok",
      receipts: [],
      reason: null,
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readToolReceiptsStatus().state).toBe("unavailable");
    expect(exportToolReceipts()).toBeNull();
  });

  it("shows only validated metadata from a mixed store and refuses to replace it", () => {
    const raw = JSON.stringify([
      receipt,
      { ...receipt, args_hash: null, result: "private output" },
    ]);
    localStorage.setItem(RECEIPTS_KEY, raw);
    const read = readToolReceiptsStatus();
    expect(read.state).toBe("unreadable");
    expect(read.receipts).toEqual([receipt]);
    expect(exportToolReceipts()).toBeNull();
    expect(
      recordToolReceipt({ tool: "get_root", argsHash: HASH, outcome: "VALID" }),
    ).toBeNull();
    expect(localStorage.getItem(RECEIPTS_KEY)).toBe(raw);
    expect(JSON.stringify(read)).not.toContain("private output");
  });

  it("recognizes another tab's repair after refusing to overwrite an unreadable store", () => {
    localStorage.setItem(RECEIPTS_KEY, "{broken");
    expect(
      recordToolReceipt({ tool: "get_root", argsHash: HASH, outcome: "VALID" }),
    ).toBeNull();
    localStorage.removeItem(RECEIPTS_KEY);
    expect(readToolReceiptsStatus()).toEqual({
      state: "ok",
      receipts: [],
      reason: null,
    });
    localStorage.setItem(RECEIPTS_KEY, JSON.stringify([receipt]));
    expect(readToolReceiptsStatus()).toEqual({
      state: "ok",
      receipts: [receipt],
      reason: null,
    });
  });

  it("refuses oversized stores and retains their original bytes", () => {
    const raw = " ".repeat(512_001);
    localStorage.setItem(RECEIPTS_KEY, raw);
    expect(readToolReceiptsStatus().state).toBe("unreadable");
    expect(
      recordToolReceipt({ tool: "get_root", argsHash: HASH, outcome: "VALID" }),
    ).toBeNull();
    expect(localStorage.getItem(RECEIPTS_KEY)).toBe(raw);
  });

  it("requires save readback and reports a silent failed write without changing existing rows", () => {
    localStorage.setItem(RECEIPTS_KEY, JSON.stringify([receipt]));
    const before = localStorage.getItem(RECEIPTS_KEY);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => undefined);
    expect(
      recordToolReceipt({
        tool: "board_totals",
        argsHash: HASH,
        outcome: "LIVE",
      }),
    ).toBeNull();
    expect(localStorage.getItem(RECEIPTS_KEY)).toBe(before);
    expect(readToolReceiptsStatus()).toMatchObject({
      state: "unavailable",
      receipts: [receipt],
    });
  });

  it("claims a clear only after confirming that the key was removed", () => {
    localStorage.setItem(RECEIPTS_KEY, JSON.stringify([receipt]));
    const remove = vi
      .spyOn(Storage.prototype, "removeItem")
      .mockImplementation(() => undefined);
    expect(clearToolReceiptsStatus()).toEqual({ cleared: false });
    expect(readToolReceiptsStatus()).toMatchObject({
      state: "unavailable",
      receipts: [receipt],
    });
    remove.mockRestore();
    expect(clearToolReceiptsStatus()).toEqual({ cleared: true });
    expect(readToolReceiptsStatus()).toEqual({
      state: "ok",
      receipts: [],
      reason: null,
    });
  });

  it("signals same-tab changes, filters cross-tab events and removes subscriptions", () => {
    expect(RECEIPTS_EVENT).toBe("coai:receipts-changed");
    expect(TOOL_RECEIPTS_STORAGE_KEYS).toEqual([RECEIPTS_KEY]);
    const listener = vi.fn();
    const stop = subscribeToolReceipts(listener);
    recordToolReceipt({ tool: "get_root", argsHash: HASH, outcome: "VALID" });
    expect(listener).toHaveBeenCalledTimes(1);
    window.dispatchEvent(
      new StorageEvent("storage", { key: "some-other-key" }),
    );
    expect(listener).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new StorageEvent("storage", { key: RECEIPTS_KEY }));
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
    clearToolReceipts();
    expect(listener).toHaveBeenCalledTimes(4);
    stop();
    recordToolReceipt({ tool: "get_root", argsHash: HASH, outcome: "VALID" });
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it("exports a selected validated snapshot and refuses raw arguments or results", () => {
    const json = exportToolReceipts([receipt]);
    expect(JSON.parse(json!).receipts).toEqual([receipt]);
    expect(json).not.toMatch(/"arguments"|"result"/);
    expect(
      exportToolReceipts([{ ...receipt, result: "private" } as never]),
    ).toBeNull();
  });
});
