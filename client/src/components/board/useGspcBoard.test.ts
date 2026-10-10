import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGspcBoardFeed, GSPC_REFRESH_MS, type GspcBoardState, type GspcPayload } from "./useGspcBoard";

const snapshot = (revision: string): GspcPayload => ({ schema: revision, axes: [], totals: {} });
const flush = async () => { await vi.advanceTimersByTimeAsync(0); };
let win: EventTarget;
let doc: EventTarget & { visibilityState: string };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  win = new EventTarget();
  doc = Object.assign(new EventTarget(), { visibilityState: "visible" });
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", doc);
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("shared minute board read", () => {
  it("replaces an open page's first result after one minute for every subscriber", async () => {
    const request = vi.fn().mockResolvedValueOnce(snapshot("first")).mockResolvedValue(snapshot("second"));
    const feed = createGspcBoardFeed(request);
    const a = vi.fn(); const b = vi.fn();
    const stopA = feed.subscribe(a); const stopB = feed.subscribe(b);
    const first = feed.load();
    expect(feed.load()).toBe(first);
    await flush();
    expect(request).toHaveBeenCalledTimes(1);
    expect(a.mock.lastCall?.[0]).toMatchObject({ data: { schema: "first" }, error: null });
    await vi.advanceTimersByTimeAsync(GSPC_REFRESH_MS - 1);
    expect(request).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(request).toHaveBeenCalledTimes(2);
    expect(a.mock.lastCall?.[0]).toMatchObject({ data: { schema: "second" }, error: null });
    expect(b.mock.lastCall?.[0]).toMatchObject({ data: { schema: "second" }, error: null });
    stopA(); expect(vi.getTimerCount()).toBe(1);
    stopB(); expect(vi.getTimerCount()).toBe(0);
  });

  it("shares a pending request across minute ticks, focus and new subscribers", async () => {
    let resolve!: (data: GspcPayload) => void;
    const request = vi.fn(() => new Promise<GspcPayload>(done => { resolve = done; }));
    const feed = createGspcBoardFeed(request);
    const stopA = feed.subscribe(vi.fn()); await flush();
    await vi.advanceTimersByTimeAsync(GSPC_REFRESH_MS * 2);
    const stopB = feed.subscribe(vi.fn());
    win.dispatchEvent(new Event("focus")); await flush();
    expect(request).toHaveBeenCalledTimes(1);
    resolve(snapshot("slow")); await feed.load();
    stopA(); stopB();
  });

  it("does not miss the first minute when the initial response takes five seconds", async () => {
    let resolve!: (data: GspcPayload) => void;
    const request = vi.fn(() => new Promise<GspcPayload>(done => { resolve = done; }));
    const feed = createGspcBoardFeed(request);
    const stop = feed.subscribe(vi.fn()); await flush();
    await vi.advanceTimersByTimeAsync(5_000);
    resolve(snapshot("delayed")); await feed.load();
    await vi.advanceTimersByTimeAsync(GSPC_REFRESH_MS - 5_000);
    expect(request).toHaveBeenCalledTimes(2);
    resolve(snapshot("next")); await feed.load(); stop();
  });

  it("retains the last good board with an explicit refresh error, then recovers", async () => {
    const request = vi.fn().mockResolvedValueOnce(snapshot("old")).mockRejectedValueOnce(new Error("offline")).mockResolvedValue(snapshot("new"));
    let state!: GspcBoardState;
    const feed = createGspcBoardFeed(request);
    const stop = feed.subscribe(value => { state = value; }); await flush();
    await vi.advanceTimersByTimeAsync(GSPC_REFRESH_MS);
    expect(state).toEqual({ data: snapshot("old"), error: "Refresh failed; previous board retained: offline", loading: false });
    for (let i = 0; i < 5; i++) win.dispatchEvent(new Event("focus"));
    await flush(); expect(request).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(GSPC_REFRESH_MS);
    expect(state).toEqual({ data: snapshot("new"), error: null, loading: false });
    stop();
  });

  it("leaves initial failure empty and retries it automatically without fabricating a board", async () => {
    const request = vi.fn().mockRejectedValueOnce(new Error("unreachable")).mockResolvedValue(snapshot("recovered"));
    const feed = createGspcBoardFeed(request);
    const stop = feed.subscribe(vi.fn()); await flush();
    expect(feed.getState()).toEqual({ data: null, error: "unreachable", loading: false });
    await vi.advanceTimersByTimeAsync(GSPC_REFRESH_MS);
    expect(feed.getState()).toEqual({ data: snapshot("recovered"), error: null, loading: false });
    stop();
  });

  it("pauses hidden-page reads and resumes one expired read on visibility or focus", async () => {
    const request = vi.fn(async () => snapshot("read"));
    const feed = createGspcBoardFeed(request);
    const stop = feed.subscribe(vi.fn()); await flush();
    doc.visibilityState = "hidden";
    await vi.advanceTimersByTimeAsync(GSPC_REFRESH_MS * 3);
    expect(request).toHaveBeenCalledTimes(1);
    doc.visibilityState = "visible";
    doc.dispatchEvent(new Event("visibilitychange"));
    win.dispatchEvent(new Event("focus")); await flush();
    expect(request).toHaveBeenCalledTimes(2);
    stop();
  });

  it("removes listeners and the timer after the final reader, including during a pending read", async () => {
    let resolve!: (data: GspcPayload) => void;
    const feed = createGspcBoardFeed(() => new Promise(done => { resolve = done; }));
    const listener = vi.fn(); const stop = feed.subscribe(listener); await flush();
    stop(); const calls = listener.mock.calls.length;
    resolve(snapshot("late")); await flush();
    expect(listener).toHaveBeenCalledTimes(calls);
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(GSPC_REFRESH_MS);
    win.dispatchEvent(new Event("focus")); doc.dispatchEvent(new Event("visibilitychange")); await flush();
    expect(listener).toHaveBeenCalledTimes(calls);
    const next = vi.fn(); const stopNext = feed.subscribe(next); await flush();
    expect(next.mock.calls[0][0]).toMatchObject({ data: { schema: "late" }, loading: false });
    resolve(snapshot("remounted")); await feed.load(); stopNext();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("canonical board transport", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.assign(win, { location: { hostname: "councilof.ai" } });
  });

  it("does not keep the first successful public-loader promise forever", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify(snapshot("first")) })
      .mockResolvedValue({ ok: true, text: async () => JSON.stringify(snapshot("second")) });
    vi.stubGlobal("fetch", fetchMock);
    const { loadGspcBoard } = await import("./useGspcBoard");
    expect((await loadGspcBoard()).schema).toBe("first");
    expect((await loadGspcBoard()).schema).toBe("first");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(GSPC_REFRESH_MS);
    expect((await loadGspcBoard()).schema).toBe("second");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: "no-store", headers: { accept: "application/json" } });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("retains the existing canonical fallback when the relative route returns HTML", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, text: async () => "<!doctype html><title>Preview</title>" })
      .mockResolvedValue({ ok: true, text: async () => JSON.stringify(snapshot("canonical")) });
    vi.stubGlobal("fetch", fetchMock);
    const { loadGspcBoard } = await import("./useGspcBoard");
    expect((await loadGspcBoard()).schema).toBe("canonical");
    expect(fetchMock.mock.calls.map(call => call[0])).toEqual(["/api/gspc", "https://councilof.ai/api/gspc"]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects valid JSON that is not a board instead of caching it as a result", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, text: async () => '{"status":"OK"}' })));
    const { loadGspcBoard } = await import("./useGspcBoard");
    await expect(loadGspcBoard()).rejects.toThrow("not a GSPC payload");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("times out a hung source so later minute reads can recover", async () => {
    const fetchMock = vi.fn((_url: unknown, options?: RequestInit) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    }));
    vi.stubGlobal("fetch", fetchMock);
    const { loadGspcBoard } = await import("./useGspcBoard");
    const result = loadGspcBoard().catch(error => error.message);
    await flush();
    await vi.advanceTimersByTimeAsync(20_000);
    expect(await result).toBe("/api/gspc timed out");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
