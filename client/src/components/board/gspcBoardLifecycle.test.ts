import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGspcBoardReader, type GspcPayload } from "./useGspcBoard";

const MINUTE = 60_000;
const MEASURED_AT = "2026-09-22T05:43:05Z";
const payload = (issuer: string): GspcPayload => ({
  schema: "csoai.gspc-axes/0.5",
  issuer,
  axes: [{
    axis: "effect-binding", kind: "deterministic-facts", status: "MEASURED",
    family: "gspc", n: 1, facts_as_of: MEASURED_AT,
  }],
  totals: {
    axes: 1, measured_axes: 1, unmeasured_axes: 0,
    comparison_axes: 0, fact_runs: 1,
    separated_leads: 0, ties: 0, untested_separations: 0,
    public_count: "1 axis · 1 measured",
  },
});
const response = (value: unknown) => new Response(JSON.stringify(value));
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
};
const flush = () => vi.advanceTimersByTimeAsync(0);
let win: EventTarget & { location: { hostname: string } };
let doc: EventTarget & { visibilityState: string };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  win = Object.assign(new EventTarget(), { location: { hostname: "councilof.ai" } });
  doc = Object.assign(new EventTarget(), { visibilityState: "visible" });
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", doc);
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("one visible subscribed board lifecycle", () => {
  it("starts once for subscribers, publishes atomically, and reads at the minute", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response(payload("first")))
      .mockResolvedValue(response(payload("second")));
    const reader = createGspcBoardReader({ fetch: fetcher });
    const a = vi.fn(), b = vi.fn();
    const stopA = reader.subscribe(() => a(reader.getSnapshot()));
    const stopB = reader.subscribe(() => b(reader.getSnapshot()));
    const pending = reader.load();
    expect(reader.load()).toBe(pending);
    const manual = reader.refresh();
    await flush();
    await Promise.all([pending, manual]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(a.mock.lastCall![0]).toBe(b.mock.lastCall![0]);
    expect(reader.getSnapshot()).toMatchObject({ readAt: new Date(0).toISOString(), error: null, refreshing: false });
    await vi.advanceTimersByTimeAsync(MINUTE - 1);
    expect(fetcher).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(reader.getSnapshot().data!.issuer).toBe("second");
    expect(reader.getSnapshot().data!.axes![0].facts_as_of).toBe(MEASURED_AT);
    expect(fetcher.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
    stopA(); expect(vi.getTimerCount()).toBe(1);
    stopB(); await flush(); expect(vi.getTimerCount()).toBe(0);
  });

  it("expires one-off loads without installing a viewing timer", async () => {
    const fetcher = vi.fn().mockImplementation(async () => response(payload("read")));
    const reader = createGspcBoardReader({ fetch: fetcher });
    await reader.load();
    await reader.load();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(MINUTE);
    expect(fetcher).toHaveBeenCalledTimes(1);
    await reader.load();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("uses start-time expiry when the first body takes five seconds", async () => {
    const body = deferred<string>();
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: true, text: () => body.promise } as Response)
      .mockResolvedValue(response(payload("next")));
    const reader = createGspcBoardReader({ fetch: fetcher });
    const stop = reader.subscribe(() => {});
    await flush();
    await vi.advanceTimersByTimeAsync(5_000);
    body.resolve(JSON.stringify(payload("slow")));
    await flush();
    expect(reader.getSnapshot().readAt).toBe(new Date(5_000).toISOString());
    await vi.advanceTimersByTimeAsync(MINUTE - 5_000);
    expect(fetcher).toHaveBeenCalledTimes(2);
    stop();
  });

  it("re-arms the deadline after a manual read instead of waiting almost two minutes", async () => {
    const fetcher = vi.fn().mockImplementation(async () => response(payload("read")));
    const reader = createGspcBoardReader({ fetch: fetcher });
    const stop = reader.subscribe(() => {});
    await flush();
    await vi.advanceTimersByTimeAsync(17_000);
    await reader.refresh();
    expect(fetcher).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(MINUTE - 17_000);
    expect(fetcher).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(17_000);
    expect(fetcher).toHaveBeenCalledTimes(3);
    stop();
  });

  it("pauses hidden reads and deduplicates overdue visibility and focus events", async () => {
    doc.visibilityState = "hidden";
    const reply = deferred<Response>();
    const fetcher = vi.fn().mockResolvedValueOnce(response(payload("first"))).mockReturnValueOnce(reply.promise);
    const reader = createGspcBoardReader({ fetch: fetcher });
    const stop = reader.subscribe(() => {});
    await flush();
    expect(fetcher).not.toHaveBeenCalled();
    doc.visibilityState = "visible";
    doc.dispatchEvent(new Event("visibilitychange"));
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(1);
    doc.visibilityState = "hidden";
    doc.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(MINUTE * 3);
    win.dispatchEvent(new Event("focus"));
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(1);
    doc.visibilityState = "visible";
    doc.dispatchEvent(new Event("visibilitychange"));
    win.dispatchEvent(new Event("focus"));
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(2);
    reply.resolve(response(payload("resumed")));
    await flush();
    expect(reader.getSnapshot().data!.issuer).toBe("resumed");
    stop(); await flush();
    win.dispatchEvent(new Event("focus"));
    doc.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(MINUTE);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("retains the snapshot on failure, throttles automatic retry, and permits immediate manual recovery", async () => {
    const reply = deferred<Response>();
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response(payload("old")))
      .mockRejectedValueOnce(new Error("offline"))
      .mockReturnValueOnce(reply.promise);
    const reader = createGspcBoardReader({ fetch: fetcher });
    const stop = reader.subscribe(() => {});
    await flush();
    const before = reader.getSnapshot();
    await vi.advanceTimersByTimeAsync(1);
    await reader.refresh();
    expect(reader.getSnapshot()).toMatchObject({ data: before.data, readAt: before.readAt, error: "offline", refreshing: false });
    for (let i = 0; i < 5; i++) win.dispatchEvent(new Event("focus"));
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    let done = false;
    const retried = reader.refresh().then(() => { done = true; });
    const joined = reader.load();
    expect(reader.getSnapshot()).toMatchObject({ data: before.data, readAt: before.readAt, refreshing: true });
    await flush();
    expect(done).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(3);
    reply.resolve(response(payload("recovered")));
    await Promise.all([retried, joined]);
    expect(done).toBe(true);
    expect(reader.getSnapshot()).toMatchObject({ error: null, refreshing: false, readAt: new Date(2).toISOString() });
    expect(reader.getSnapshot().data!.axes![0].facts_as_of).toBe(MEASURED_AT);
    stop();
  });

  it("does not spin or overlap when a pending generation outlives its minute deadline", async () => {
    const reply = deferred<Response>();
    const fetcher = vi.fn().mockReturnValueOnce(reply.promise).mockResolvedValue(response(payload("replacement")));
    const reader = createGspcBoardReader({ fetch: fetcher, timeoutMs: MINUTE * 3 });
    const stop = reader.subscribe(() => {});
    const pending = reader.load();
    await flush();
    await vi.advanceTimersByTimeAsync(MINUTE * 2);
    win.dispatchEvent(new Event("focus"));
    doc.dispatchEvent(new Event("visibilitychange"));
    expect(reader.load()).toBe(pending);
    const manual = reader.refresh();
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(1);
    reply.resolve(response(payload("slow")));
    await Promise.all([pending, manual]);
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(reader.getSnapshot().data!.issuer).toBe("replacement");
    expect(vi.getTimerCount()).toBe(1);
    stop();
  });

  it("preserves a pending generation across a StrictMode unsubscribe/resubscribe", async () => {
    const reply = deferred<Response>();
    let signal!: AbortSignal;
    const fetcher = vi.fn((_url, init) => { signal = init!.signal as AbortSignal; return reply.promise; });
    const reader = createGspcBoardReader({ fetch: fetcher });
    const stop = reader.subscribe(() => {});
    const pending = reader.load();
    await flush();
    stop();
    const stopAgain = reader.subscribe(() => {});
    await flush();
    expect(signal.aborted).toBe(false);
    expect(reader.load()).toBe(pending);
    expect(fetcher).toHaveBeenCalledTimes(1);
    reply.resolve(response(payload("kept")));
    await pending;
    stopAgain(); await flush();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("releases a cancelled attempt's TTL and isolates its late response and finalizer", async () => {
    const oldReply = deferred<Response>(), replacement = deferred<Response>();
    let oldSignal!: AbortSignal;
    const fetcher = vi.fn()
      .mockImplementationOnce((_url, init) => { oldSignal = init!.signal as AbortSignal; return oldReply.promise; })
      .mockReturnValueOnce(replacement.promise);
    const reader = createGspcBoardReader({ fetch: fetcher });
    const stop = reader.subscribe(() => {});
    const old = reader.load().catch((e: Error) => e.message);
    await flush();
    await vi.advanceTimersByTimeAsync(5_000);
    stop(); await flush();
    expect(oldSignal.aborted).toBe(true);
    expect(await old).toMatch(/cancelled/);
    const stopAgain = reader.subscribe(() => {});
    const pending = reader.load();
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(2);
    oldReply.resolve(response(payload("obsolete")));
    await flush();
    expect(reader.load()).toBe(pending);
    expect(reader.getSnapshot()).toMatchObject({ data: null, readAt: null, loading: true });
    expect(vi.getTimerCount()).toBe(2);
    replacement.resolve(response(payload("new")));
    await pending;
    expect(reader.getSnapshot().data!.issuer).toBe("new");
    stopAgain(); await flush();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("attaches lifecycle before a reentrant subscriber and installs only one listener pair", async () => {
    const addFocus = vi.spyOn(win, "addEventListener"), removeFocus = vi.spyOn(win, "removeEventListener");
    const addVisibility = vi.spyOn(doc, "addEventListener"), removeVisibility = vi.spyOn(doc, "removeEventListener");
    const fetcher = vi.fn().mockImplementation(async () => response(payload("read")));
    const reader = createGspcBoardReader({ fetch: fetcher });
    let stopB: (() => void) | undefined;
    let nested = false;
    const b = vi.fn();
    const stopA = reader.subscribe(() => {
      if (!nested) { nested = true; stopB = reader.subscribe(b); }
    });
    await flush();
    expect(addFocus).toHaveBeenCalledTimes(1);
    expect(addVisibility).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(MINUTE);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(b).toHaveBeenCalled();
    stopA(); stopB!(); await flush();
    expect(removeFocus).toHaveBeenCalledTimes(1);
    expect(removeVisibility).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("installs the operation before reentrant manual refresh and load notification", async () => {
    const reply = deferred<Response>(), fetcher = vi.fn(() => reply.promise);
    const reader = createGspcBoardReader({ fetch: fetcher });
    let nested = false;
    let joined: Promise<GspcPayload> | undefined, manual: Promise<void> | undefined;
    const stop = reader.subscribe(() => {
      if (!nested) { nested = true; joined = reader.load(); manual = reader.refresh(); }
    });
    const pending = reader.load();
    await flush();
    expect(joined).toBe(pending);
    expect(fetcher).toHaveBeenCalledTimes(1);
    reply.resolve(response(payload("shared")));
    await Promise.all([pending, manual]);
    stop(); await flush();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("bounded canonical transport during lifecycle integration", () => {
  it.each([["HTML", "<!doctype html>", 200], ["missing route", "", 404]] as const)(
    "does not fall back from production %s",
    async (_name, text, status) => {
      const fetcher = vi.fn().mockResolvedValue(new Response(text, { status }));
      const reader = createGspcBoardReader({ fetch: fetcher });
      await expect(reader.load()).rejects.toThrow();
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(reader.getSnapshot()).toMatchObject({ data: null, readAt: null, loading: false });
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it("uses one timeout budget and abort signal across localhost HTML fallback and a stalled body", async () => {
    win.location.hostname = "localhost";
    const firstBody = deferred<string>();
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: true, text: () => firstBody.promise } as Response)
      .mockResolvedValueOnce({ ok: true, text: () => new Promise<string>(() => {}) } as Response);
    const reader = createGspcBoardReader({ fetch: fetcher });
    const result = reader.load().catch((e: Error) => e.message);
    await flush();
    await vi.advanceTimersByTimeAsync(12_000);
    firstBody.resolve("<!doctype html>");
    await flush();
    expect(fetcher.mock.calls.map((call) => call[0])).toEqual(["/api/gspc", "https://councilof.ai/api/gspc"]);
    const signal = fetcher.mock.calls[0][1]!.signal as AbortSignal;
    expect(fetcher.mock.calls[1][1]!.signal).toBe(signal);
    expect(fetcher.mock.calls.every((call) => call[1]!.cache === "no-store")).toBe(true);
    await vi.advanceTimersByTimeAsync(3_000);
    expect(await result).toMatch(/timed out after 15000 ms/);
    expect(signal.aborted).toBe(true);
    expect(reader.getSnapshot()).toMatchObject({ data: null, readAt: null, loading: false, refreshing: false });
    expect(vi.getTimerCount()).toBe(0);
  });
});
