import { afterEach, describe, expect, it, vi } from "vitest";
import { readWatchdogJson, WATCHDOG_READ_TIMEOUT_MS } from "./watchdogRead";

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

function stalledBody() {
  return vi.fn((_url: string, init: RequestInit) => Promise.resolve({
    ok: true, status: 200,
    text: () => new Promise<string>((_resolve, reject) => {
      init.signal!.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    }),
  }));
}

describe("Watchdog public reads", () => {
  it("hashes the exact returned text", async () => {
    const body = '{ "claims": [] }\n';
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body)));
    const r = await readWatchdogJson("/claims/test.json");
    expect(r.state).toBe("OK");
    if (r.state !== "OK") throw new Error("Expected readable JSON");
    expect(r.value.text).toBe(body);
    expect(r.value.json).toEqual({ claims: [] });
    expect(r.sha256).toMatch(/^[a-f0-9]{64}$/);
  });
  it.each([403, 404, 429, 500])("keeps HTTP %s uncheckable", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unavailable", { status })));
    expect(await readWatchdogJson("/claims/test.json")).toMatchObject({ state: "UNCHECKABLE", reason: "HTTP " + status, status });
  });
  it("does not treat HTML as an empty registry", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>Unavailable</html>")));
    expect(await readWatchdogJson("/claims/test.json")).toMatchObject({ state: "UNCHECKABLE", reason: "The response was not JSON" });
  });
  it("times out a stalled body and releases its timer", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", stalledBody());
    const pending = readWatchdogJson("/claims/test.json");
    await vi.advanceTimersByTimeAsync(WATCHDOG_READ_TIMEOUT_MS);
    expect(await pending).toMatchObject({ state: "UNCHECKABLE", reason: "Read timed out; please retry" });
    expect(vi.getTimerCount()).toBe(0);
  });
  it("cancels a body read when the visitor leaves", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", stalledBody());
    const controller = new AbortController();
    const pending = readWatchdogJson("/claims/test.json", controller.signal);
    await Promise.resolve();
    controller.abort();
    expect(await pending).toMatchObject({ state: "UNCHECKABLE", reason: "Read cancelled" });
    expect(vi.getTimerCount()).toBe(0);
  });
});
