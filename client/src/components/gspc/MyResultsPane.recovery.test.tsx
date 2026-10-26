// @vitest-environment jsdom
// @vitest-environment-options {"url":"http://localhost/"}
/** Mounted actual Pane recovery tests. ResultCard is a presentation-only stub; all transport/storage/clipboard is controlled. */
import React, { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MyResultsPane from "./MyResultsPane";
import * as results from "@/lib/myResults";
import type { MyResult } from "@/lib/myResults";

vi.mock("@/components/talk/ResultCard", () => ({
  default: ({ title, label, children }: { title: string; label?: string; children?: ReactNode }) => (
    <article data-testid="queue-result"><h2>{title}</h2><span>{label}</span>{children}</article>
  ),
  StateChip: ({ label }: { label?: string }) => <span>{label}</span>,
}));
vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children?: ReactNode; className?: string; "data-testid"?: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

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
function deferred() {
  let resolve!: () => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const at = "2026-10-15T01:00:00Z";
const textA = JSON.stringify({ payload: { note: "A é\nexact retained text" }, sha256: "A", sig_ed25519: null }, null, 2);
const textB = JSON.stringify({ payload: { note: "B different body" }, sha256: "B", sig_ed25519: null }, null, 2);
const paidA: MyResult = { id: "row-A", kind: "paid", subject: "door-A", at, ref: "A", record: textA };
const paidB: MyResult = { id: "row-B", kind: "paid", subject: "door-B", at, ref: "B", record: textB };
const fullRow = {
  subject: "model-A", fulfillment: "RETRIEVABLE", tx: "0x123", receipt_sha: "receipt-A",
  as_of: at, origin: "OUTSIDE", delivery: { state: "DELIVERED", count: 2 },
  cards: [
    { id: "card-A", url: "/gspc/cards/card-A.json", axis: "safety", status: "MEASURED" },
    { id: "card-B", url: "/gspc/cards/card-B.json", axis: null, status: null },
  ],
};
let host: HTMLDivElement;
let root: Root | null;
let local: ReturnType<typeof storage>;
let session: ReturnType<typeof storage>;
let writeText: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>;
let fetchSpy: ReturnType<typeof vi.fn>;
let queue: unknown;
let mounted: number;
const descriptors = {
  local: Object.getOwnPropertyDescriptor(window, "localStorage"),
  session: Object.getOwnPropertyDescriptor(window, "sessionStorage"),
  clipboard: Object.getOwnPropertyDescriptor(navigator, "clipboard"),
};

beforeEach(() => {
  local = storage(); session = storage(); root = null; mounted = 0;
  queue = { commissions: [], as_of: at };
  host = document.createElement("div"); document.body.appendChild(host);
  Object.defineProperty(window, "localStorage", { configurable: true, value: local.api });
  Object.defineProperty(window, "sessionStorage", { configurable: true, value: session.api });
  writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url !== "/api/commissions" || (init?.method ?? "GET") !== "GET") throw new Error("Unexpected transport: no network permitted");
    return { ok: true, status: 200, json: async () => queue };
  });
  vi.stubGlobal("fetch", fetchSpy);
});
afterEach(async () => {
  if (root) await act(async () => { root!.unmount(); });
  host.remove();
  expect(fetchSpy).toHaveBeenCalledTimes(mounted);
  for (const [input, init] of fetchSpy.mock.calls as [RequestInfo | URL, RequestInit | undefined][]) {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    expect(url).toBe("/api/commissions");
    expect(init?.method ?? "GET").toBe("GET");
  }
  vi.restoreAllMocks(); vi.unstubAllGlobals();
  for (const [owner, key, descriptor] of [
    [window, "localStorage", descriptors.local],
    [window, "sessionStorage", descriptors.session],
    [navigator, "clipboard", descriptors.clipboard],
  ] as const) {
    if (descriptor) Object.defineProperty(owner, key, descriptor);
    else Reflect.deleteProperty(owner, key);
  }
});
async function mount() {
  mounted += 1; root = createRoot(host);
  await act(async () => { root!.render(<MyResultsPane />); });
}
async function unmount() {
  await act(async () => { root!.unmount(); }); root = null; host.replaceChildren();
}
function find(testId: string) { return host.querySelector('[data-testid="' + testId + '"]'); }
function button(label: string) {
  const el = Array.from(host.querySelectorAll("button")).find((b) => b.textContent?.trim() === label);
  if (!el) throw new Error("Missing button " + label);
  return el;
}
async function click(el: HTMLElement) { await act(async () => { el.click(); }); }
async function show(index = 0) {
  const el = host.querySelectorAll<HTMLButtonElement>('[data-testid="my-results-show-record"]')[index];
  if (!el) throw new Error("Missing paid record row");
  await click(el);
}
async function lookup(value: string) {
  const input = host.querySelector<HTMLInputElement>("#my-results-q")!;
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  await act(async () => { set.call(input, value); input.dispatchEvent(new Event("input", { bubbles: true })); });
  await act(async () => { input.closest("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
}
async function changed() {
  await act(async () => { window.dispatchEvent(new StorageEvent("storage", { key: results.MY_RESULTS_KEY })); });
}

describe("Mounted My Results recovery", () => {
  it("rejects missing malformed and non-list queue envelopes without saying no match", async () => {
    for (const value of [null, {}, [], { commissions: null }, { commissions: "bad", as_of: at }]) {
      queue = value; await mount(); await lookup("model-A");
      expect(host.textContent).toContain("The queue could not be read");
      expect(find("my-results-none")).toBeNull();
      await unmount();
    }
  });

  it("reports genuine validated empty queue separately from unreadable", async () => {
    await mount(); await lookup("missing");
    expect(find("my-results-none")?.textContent).toContain("Nothing in the public queue matches");
    expect(host.textContent).not.toContain("The queue could not be read");
  });

  it("keeps a valid empty queue readable when the optional top-level date is absent", async () => {
    queue = { commissions: [] };
    await mount(); await lookup("missing");
    expect(find("my-results-none")?.textContent).toContain("Nothing in the public queue matches");
    expect(host.textContent).not.toContain("The queue could not be read");
    const footer = Array.from(host.querySelectorAll("p")).find((p) => p.textContent?.includes("Queue read live from"));
    expect(footer).toBeDefined();
    expect(footer?.textContent).toContain("GET /api/commissions");
    expect(footer?.textContent).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(footer?.textContent).not.toContain("undefined");
    expect(footer?.textContent).not.toContain("Invalid Date");
  });

  it("matches a full declared row by subject receipt and transaction and renders nested card links", async () => {
    queue = { commissions: [fullRow], as_of: at };
    await mount();
    for (const term of ["MODEL-A", "sha256:receipt-A", "0X123"]) {
      await lookup(term);
      expect(find("queue-result")?.textContent).toContain("RETRIEVABLE");
      expect(find("queue-result")?.textContent).toContain("model-A");
      expect(host.querySelector('a[href="/gspc/cards/card-B.json"]')).not.toBeNull();
      expect(find("my-results-none")).toBeNull();
    }
  });

  it("rejects a malformed nested card or date in any row rather than silently dropping it", async () => {
    for (const bad of [
      { ...fullRow, subject: "bad", cards: [{ id: "c", url: 3, axis: null, status: null }] },
      { ...fullRow, subject: "bad", as_of: "not a date" },
      { ...fullRow, subject: "bad", delivery: { state: "DELIVERED", count: -1 } },
    ]) {
      queue = { commissions: [fullRow, bad], as_of: at };
      await mount(); await lookup("model-A");
      expect(host.textContent).toContain("The queue could not be read");
      expect(find("queue-result")).toBeNull();
      expect(find("my-results-none")).toBeNull();
      await unmount();
    }
  });

  it("accepts nullable cards and unknown server words without inventing measurement", async () => {
    queue = { commissions: [{ ...fullRow, fulfillment: "UNCHECKABLE", cards: null, as_of: null }], as_of: at };
    await mount(); await lookup("model-A");
    expect(find("queue-result")?.textContent).toContain("UNCHECKABLE");
    expect(host.textContent).not.toContain("The queue could not be read");
  });

  it("shows a supplied offset timestamp unchanged instead of appending a fabricated Z", async () => {
    const offset = "2026-10-15T09:00:00+05:30";
    queue = { commissions: [], as_of: offset };
    await mount();
    const footer = Array.from(host.querySelectorAll("p")).find((p) => p.textContent?.includes("Queue read live from"));
    expect(footer?.textContent).toContain(offset);
    expect(footer?.textContent).not.toContain("2026-10-15 09:00Z");
  });

  it("fresh mixed paid and malformed storage keeps Download View and exact bytes alongside unreadable", async () => {
    const raw = JSON.stringify([paidA, { kind: "wrong", subject: "bad", at }]);
    local.data.set(results.MY_RESULTS_KEY, raw);
    const download = vi.spyOn(results, "downloadText").mockImplementation(() => undefined);
    await mount();
    expect(find("my-results-unreadable")).not.toBeNull();
    expect(find("my-results-empty")).toBeNull();
    expect(find("my-results-check")).not.toBeNull();
    await click(button("Download"));
    expect(download).toHaveBeenCalledWith(textA, "csoai-A.json");
    await show();
    expect(find("my-results-record-text")?.textContent).toBe(textA);
    expect(local.data.get(results.MY_RESULTS_KEY)).toBe(raw);
    expect(local.api.setItem).not.toHaveBeenCalled();
  });

  it("fresh unreadable browser storage is not described as empty and is never written", async () => {
    vi.spyOn(local.api, "getItem").mockImplementation(() => { throw new Error("SecurityError"); });
    await mount();
    expect(find("my-results-unreadable")).not.toBeNull();
    expect(find("my-results-empty")).toBeNull();
    expect(local.api.setItem).not.toHaveBeenCalled();
  });

  it("failed seed readback prevents navigation and exposes the same paid record for manual recovery", async () => {
    local.data.set(results.MY_RESULTS_KEY, JSON.stringify([paidA]));
    session.data.set(results.VERIFY_SEED_KEY, "older different seed");
    vi.spyOn(session.api, "setItem").mockImplementation(() => undefined);
    await mount();
    const anchor = find("my-results-check") as HTMLAnchorElement;
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    const href = window.location.href;
    await act(async () => { anchor.dispatchEvent(event); });
    expect(event.defaultPrevented).toBe(true);
    expect(window.location.href).toBe(href);
    expect(anchor.getAttribute("href")).toBe(results.VERIFY_SEED_HREF);
    expect(find("my-results-handoff-failed")).not.toBeNull();
    expect(find("my-results-record-text")?.textContent).toBe(textA);
    expect(session.data.get(results.VERIFY_SEED_KEY)).toBe("older different seed");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("an earlier A clipboard completion cannot overwrite B in-flight status or enable its button", async () => {
    local.data.set(results.MY_RESULTS_KEY, JSON.stringify([paidA, paidB]));
    const a = deferred(), b = deferred();
    writeText.mockImplementationOnce(() => a.promise).mockImplementationOnce(() => b.promise);
    await mount(); await show(0); await click(button("Copy record"));
    await show(1); await click(button("Copy record"));
    expect(writeText.mock.calls.map((call) => call[0])).toEqual([textA, textB]);
    expect(button("Copy record").disabled).toBe(true);
    await act(async () => { a.resolve(); await a.promise; });
    expect(find("my-results-record-text")?.textContent).toBe(textB);
    expect(find("my-results-copy-status")?.textContent).toBe("Copying…");
    expect(button("Copy record").disabled).toBe(true);
    await act(async () => { b.resolve(); await b.promise; });
    expect(find("my-results-copy-status")?.textContent).toBe("The retained text was copied.");
    expect(button("Copy record").disabled).toBe(false);
  });

  it("close and reopen of identical A does not accept the earlier operation outcome", async () => {
    local.data.set(results.MY_RESULTS_KEY, JSON.stringify([paidA]));
    const old = deferred(); writeText.mockImplementationOnce(() => old.promise);
    await mount(); await show(); await click(button("Copy record"));
    await click(button("Close record")); await show();
    await act(async () => { old.resolve(); await old.promise; });
    expect(find("my-results-record-text")?.textContent).toBe(textA);
    expect(find("my-results-copy-status")).toBeNull();
    expect(button("Copy record").disabled).toBe(false);
  });

  it("A to B to A is a new selection and ignores the first A failure", async () => {
    local.data.set(results.MY_RESULTS_KEY, JSON.stringify([paidA, paidB]));
    const old = deferred(); writeText.mockImplementationOnce(() => old.promise);
    await mount(); await show(0); await click(button("Copy record"));
    await show(1); await show(0);
    await act(async () => { old.reject(new Error("denied")); await old.promise.catch(() => undefined); });
    expect(find("my-results-record-text")?.textContent).toBe(textA);
    expect(find("my-results-copy-status")).toBeNull();
  });

  it("source body change invalidates the selected recovery and its pending completion", async () => {
    local.data.set(results.MY_RESULTS_KEY, JSON.stringify([paidA]));
    const old = deferred(); writeText.mockImplementationOnce(() => old.promise);
    await mount(); await show(); await click(button("Copy record"));
    local.data.set(results.MY_RESULTS_KEY, JSON.stringify([{ ...paidA, record: textB }]));
    await changed();
    expect(find("my-results-record")).toBeNull();
    await act(async () => { old.resolve(); await old.promise; });
    expect(find("my-results-copy-status")).toBeNull();
    await show();
    expect(find("my-results-record-text")?.textContent).toBe(textB);
  });

  it("clipboard denial leaves the visible manual text and original Download available", async () => {
    local.data.set(results.MY_RESULTS_KEY, JSON.stringify([paidA]));
    writeText.mockRejectedValueOnce(new Error("denied"));
    const download = vi.spyOn(results, "downloadText").mockImplementation(() => undefined);
    await mount(); await show(); await click(button("Copy record"));
    expect(writeText).toHaveBeenCalledWith(textA);
    expect(find("my-results-copy-status")?.textContent).toContain("Copy could not be confirmed");
    expect(find("my-results-copy-status")?.textContent).not.toContain("was copied");
    expect(find("my-results-record-text")?.textContent).toBe(textA);
    await click(button("Download"));
    expect(download).toHaveBeenCalledWith(textA, "csoai-A.json");
  });

  it("failed clear preserves displayed paid recovery and does not claim success", async () => {
    const raw = JSON.stringify([paidA]); local.data.set(results.MY_RESULTS_KEY, raw);
    vi.spyOn(local.api, "removeItem").mockImplementation(() => undefined);
    await mount(); await show(); await click(button("Clear list"));
    expect(find("my-results-list-action")?.textContent).toContain("could not confirm the clear");
    expect(find("my-results-record-text")?.textContent).toBe(textA);
    expect(find("my-results-empty")).toBeNull();
    expect(local.data.get(results.MY_RESULTS_KEY)).toBe(raw);
  });

  it("confirmed clear removes recovery and displays a truthful readable empty list", async () => {
    local.data.set(results.MY_RESULTS_KEY, JSON.stringify([paidA]));
    await mount(); await show(); await click(button("Clear list"));
    expect(local.data.has(results.MY_RESULTS_KEY)).toBe(false);
    expect(find("my-results-record")).toBeNull();
    expect(find("my-results-empty")).not.toBeNull();
    expect(find("my-results-list-action")?.textContent).toContain("The list was cleared");
  });

  it("a later browser read failure retains previously readable paid bytes with an unreadable warning", async () => {
    const raw = JSON.stringify([paidA]); local.data.set(results.MY_RESULTS_KEY, raw);
    await mount(); await show();
    vi.spyOn(local.api, "getItem").mockImplementation(() => { throw new Error("SecurityError"); });
    await changed();
    expect(find("my-results-unreadable")).not.toBeNull();
    expect(find("my-results-record-text")?.textContent).toBe(textA);
    expect(find("my-results-empty")).toBeNull();
    expect(local.data.get(results.MY_RESULTS_KEY)).toBe(raw);
    expect(local.api.setItem).not.toHaveBeenCalled();
  });
});
