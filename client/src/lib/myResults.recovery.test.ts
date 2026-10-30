/** Additive recovery controls; original myResults.test.ts stays untouched. All storage/fetch is controlled. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearMyResults, clearMyResultsStatus, MY_RESULTS_EVENT, MY_RESULTS_KEY,
  readMyResultsStatus, saveMyResult, seedChecker, takeCheckerSeed,
  VERIFY_SEED_HREF, VERIFY_SEED_KEY, type MyResult,
} from "./myResults";

function storage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const api: Storage = {
    get length() { return data.size; },
    clear: vi.fn(() => data.clear()),
    key: vi.fn((n: number) => Array.from(data.keys())[n] ?? null),
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { data.set(key, value); }),
    removeItem: vi.fn((key: string) => { data.delete(key); }),
  };
  return { data, api };
}
const record = JSON.stringify({ payload: { note: "é\noriginal bytes" }, sha256: "record-A", sig_ed25519: null }, null, 2);
const paid: MyResult = { id: "paid-A", kind: "paid", subject: "door-A", at: "2026-10-15T01:00:00Z", ref: "record-A", record };
let local: ReturnType<typeof storage>;
let session: ReturnType<typeof storage>;
let dispatch: ReturnType<typeof vi.fn<(event: Event) => boolean>>;
let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  local = storage();
  session = storage();
  dispatch = vi.fn<(event: Event) => boolean>(() => true);
  fetchSpy = vi.fn(() => { throw new Error("No network permitted by recovery test"); });
  vi.stubGlobal("window", { localStorage: local.api, sessionStorage: session.api, dispatchEvent: dispatch });
  vi.stubGlobal("fetch", fetchSpy);
});
afterEach(() => {
  expect(fetchSpy).not.toHaveBeenCalled();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("My Results additive recovery outcomes", () => {
  it("distinguishes absent and readable empty storage without a write", () => {
    expect(readMyResultsStatus()).toEqual({ state: "ok", rows: [] });
    local.data.set(MY_RESULTS_KEY, "[]");
    expect(readMyResultsStatus()).toEqual({ state: "ok", rows: [] });
    expect(local.api.setItem).not.toHaveBeenCalled();
    expect(local.api.removeItem).not.toHaveBeenCalled();
  });

  it("reports a storage read exception as unreadable without overwriting", () => {
    local.data.set(MY_RESULTS_KEY, "KEEP");
    vi.spyOn(local.api, "getItem").mockImplementation(() => { throw new Error("SecurityError"); });
    expect(readMyResultsStatus()).toEqual({ state: "error", rows: [] });
    expect(local.data.get(MY_RESULTS_KEY)).toBe("KEEP");
    expect(local.api.setItem).not.toHaveBeenCalled();
  });

  it("rejects empty text malformed JSON and non-list snapshots without rewriting", () => {
    for (const raw of ["", "[", "null", "42", "{}"]) {
      local.data.set(MY_RESULTS_KEY, raw);
      expect(readMyResultsStatus()).toEqual({ state: "error", rows: [] });
      expect(local.data.get(MY_RESULTS_KEY)).toBe(raw);
    }
    expect(local.api.setItem).not.toHaveBeenCalled();
  });

  it("keeps the exact readable paid copy alongside a malformed unrelated row and unreadable status", () => {
    const raw = JSON.stringify([paid, { kind: "not-a-kind", subject: "broken", at: paid.at }]);
    local.data.set(MY_RESULTS_KEY, raw);
    const read = readMyResultsStatus();
    expect(read.state).toBe("error");
    expect(read.rows).toEqual([paid]);
    expect(read.rows[0].record).toBe(record);
    expect(local.data.get(MY_RESULTS_KEY)).toBe(raw);
    expect(local.api.setItem).not.toHaveBeenCalled();
    expect(local.api.removeItem).not.toHaveBeenCalled();
  });

  it("does not call an invalid-date row a complete readable list or hide a different valid paid row", () => {
    local.data.set(MY_RESULTS_KEY, JSON.stringify([paid, { id: "bad", kind: "watch", subject: "w", at: "not a date" }]));
    expect(readMyResultsStatus()).toEqual({ state: "error", rows: [paid] });
  });

  it("preserves compatible missing-id normalization and duplicate-id handling", () => {
    local.data.set(MY_RESULTS_KEY, JSON.stringify([
      { kind: "lookup", subject: "model", at: paid.at },
      { ...paid, id: "same" }, { ...paid, id: "same", subject: "door-B" },
    ]));
    const read = readMyResultsStatus();
    expect(read.state).toBe("ok");
    expect(read.rows).toHaveLength(3);
    expect(new Set(read.rows.map((row) => row.id)).size).toBe(3);
    expect(read.rows.filter((row) => row.kind === "paid").map((row) => row.record)).toEqual([record, record]);
  });

  it("hands exact seed text to the unchanged single-use receiver only after readback", () => {
    expect(VERIFY_SEED_KEY).toBe("coai:verify-seed");
    expect(VERIFY_SEED_HREF).toBe("/gspc-verify?seed=mine");
    expect(seedChecker(record)).toBe(true);
    expect(session.api.setItem).toHaveBeenCalledWith(VERIFY_SEED_KEY, record);
    expect(session.api.getItem).toHaveBeenCalledWith(VERIFY_SEED_KEY);
    expect(takeCheckerSeed()).toBe(record);
    expect(takeCheckerSeed()).toBeNull();
  });

  it("refuses a seed write exception rather than claiming handoff", () => {
    session.data.set(VERIFY_SEED_KEY, "older seed");
    vi.spyOn(session.api, "setItem").mockImplementation(() => { throw new Error("QuotaExceededError"); });
    expect(seedChecker(record)).toBe(false);
    expect(session.data.get(VERIFY_SEED_KEY)).toBe("older seed");
  });

  it("refuses a seed readback exception rather than claiming handoff", () => {
    vi.spyOn(session.api, "getItem").mockImplementation(() => { throw new Error("SecurityError"); });
    expect(seedChecker(record)).toBe(false);
    expect(session.data.get(VERIFY_SEED_KEY)).toBe(record);
  });

  it("refuses missing or mismatched seed readback", () => {
    for (const back of [null, "another record"]) {
      vi.spyOn(session.api, "getItem").mockReturnValue(back);
      expect(seedChecker(record)).toBe(false);
      vi.restoreAllMocks();
    }
  });

  it("confirms clear only after exact absence and then emits one change event", () => {
    local.data.set(MY_RESULTS_KEY, JSON.stringify([paid]));
    expect(clearMyResultsStatus()).toEqual({ cleared: true });
    expect(local.data.has(MY_RESULTS_KEY)).toBe(false);
    expect(local.api.getItem).toHaveBeenCalledWith(MY_RESULTS_KEY);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0].type).toBe(MY_RESULTS_EVENT);
  });

  it("refuses clear when remove throws and preserves stored bytes without a change event", () => {
    const raw = JSON.stringify([paid]);
    local.data.set(MY_RESULTS_KEY, raw);
    vi.spyOn(local.api, "removeItem").mockImplementation(() => { throw new Error("SecurityError"); });
    expect(clearMyResultsStatus()).toEqual({ cleared: false });
    expect(local.data.get(MY_RESULTS_KEY)).toBe(raw);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("does not emit a success event when clear readback throws", () => {
    local.data.set(MY_RESULTS_KEY, JSON.stringify([paid]));
    vi.spyOn(local.api, "getItem").mockImplementation(() => { throw new Error("SecurityError"); });
    expect(clearMyResultsStatus()).toEqual({ cleared: false });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("refuses a no-op clear whose readback still contains the original bytes", () => {
    const raw = JSON.stringify([paid]);
    local.data.set(MY_RESULTS_KEY, raw);
    vi.spyOn(local.api, "removeItem").mockImplementation(() => undefined);
    expect(clearMyResultsStatus()).toEqual({ cleared: false });
    expect(local.data.get(MY_RESULTS_KEY)).toBe(raw);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("keeps the original void clear API compatible", () => {
    local.data.set(MY_RESULTS_KEY, JSON.stringify([paid]));
    expect(clearMyResults()).toBeUndefined();
    expect(local.data.has(MY_RESULTS_KEY)).toBe(false);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it("can expose a readable paid copy while the unchanged strict save refuses to rewrite its malformed snapshot", () => {
    const raw = JSON.stringify([paid, { id: "bad", kind: "watch", subject: "w", at: paid.at, state: null }]);
    local.data.set(MY_RESULTS_KEY, raw);
    expect(readMyResultsStatus()).toEqual({ state: "error", rows: [paid] });
    expect(saveMyResult({ kind: "watch", subject: "new" }).saved).toBe(false);
    expect(local.data.get(MY_RESULTS_KEY)).toBe(raw);
    expect(readMyResultsStatus().rows[0].record).toBe(record);
    expect(local.api.setItem).not.toHaveBeenCalled();
  });
});
