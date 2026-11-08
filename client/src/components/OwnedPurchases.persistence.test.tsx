// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OwnedPurchases from "./OwnedPurchases";
import { prepareOwnedChallenge } from "@/lib/buyerPurchases";
import type { X402Challenge } from "@/lib/x402Wallet";

let host: HTMLDivElement, root: Root;
const network = vi.fn<typeof fetch>(), download = vi.fn(), createUrl = vi.fn(() => "blob:synthetic-private-receipt");
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); vi.stubGlobal("crypto", webcrypto);
  localStorage.clear(); localStorage.setItem("csoai_token", "synthetic-owner-a");
  network.mockReset(); download.mockReset(); createUrl.mockClear();
  vi.stubGlobal("fetch", network);
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(download);
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createUrl });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); });
function button(text: string) { const b = [...host.querySelectorAll("button")].find(x => x.textContent === text); if (!b) throw new Error("Button missing: " + text); return b; }
async function settle(check:()=>boolean){for(let i=0;i<60;i++){if(check())return;await act(async()=>{await new Promise(r=>setTimeout(r,5));});}throw new Error("Expected UI state did not settle");}
async function loaded() {
  network.mockImplementation(async (input, init) => {
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer synthetic-owner-a");
    expect(init?.method ?? "GET").toBe("GET");
    if (String(input) === "/api/purchases") return Response.json({ rows: [{ transaction: "synthetic-tx", resource: "https://councilof.ai/api/proof", result_url: "/api/purchases/synthetic-tx" }], list_complete: true });
    return Response.json({ owner_hash: "b".repeat(64), transaction: "synthetic-tx", resource: "https://councilof.ai/api/proof",
      result: { sha256: "a".repeat(64), bytes: 3, version: "2026-11-07", download_url: "/api/purchases/synthetic-tx/body" },
      receipt: { state: "ROUTE_REPORTED_UNVERIFIED", payment_response: "synthetic-private-owner-a-receipt" }, decisions: { rows: [], list_complete: true } });
  });
  await act(async () => root.render(<OwnedPurchases />));
  await act(async () => button("Load saved purchases").click());
  await act(async () => button("Open original result and receipt").click());
  await settle(()=>!!host.querySelector("[data-testid=owned-result-detail]"));
}
describe("owned purchase action-time session and preparation bounds", () => {
  it("downloads the stored receipt for the current owner without recording acceptance", async () => {
    await loaded(); await act(async () => button("Download stored receipt").click());
    expect(createUrl).toHaveBeenCalledOnce(); expect(download).toHaveBeenCalledOnce();
    expect(network).toHaveBeenCalledTimes(2);
    expect(network.mock.calls.every(([, init]) => (init?.method ?? "GET") === "GET")).toBe(true);
  });
  it("cannot export a cached private receipt when the token changes before a storage event", async () => {
    await loaded();
    localStorage.setItem("csoai_token", "synthetic-owner-b"); // deliberately no storage/session event
    await act(async () => button("Download stored receipt").click());
    expect(createUrl).not.toHaveBeenCalled(); expect(download).not.toHaveBeenCalled();
    expect(network).toHaveBeenCalledTimes(2);
    expect(host.textContent).toContain("The session changed");
  });
  it("keeps the three-second preparation deadline through an actual stalled response body", async () => {
    vi.useFakeTimers();
    let stream!: ReadableStreamDefaultController<Uint8Array>;
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(new ReadableStream<Uint8Array>({ start(c) { stream = c; } }),
      { headers: { "content-type": "application/json" } }));
    const wallet = vi.fn();
    const pending = prepareOwnedChallenge({} as X402Challenge, { url: new URL("/api/proof", window.location.href).href, resource: new URL("/api/proof", window.location.href).href, method: "GET", body_sha256: "a".repeat(64) }, fetcher).then(value => { wallet(); return value; });
    const rejected = expect(pending).rejects.toThrow(/timed out/);
    await vi.advanceTimersByTimeAsync(3001); await rejected;
    expect(fetcher).toHaveBeenCalledOnce(); expect(wallet).not.toHaveBeenCalled();
    expect((fetcher.mock.calls[0][1]?.signal as AbortSignal).aborted).toBe(true);
    stream.error(new Error("synthetic body cleanup")); // the losing read rejection remains observed
  });
  it("bounds preparation even when the injected fetcher never returns headers", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn<typeof fetch>().mockImplementation(() => new Promise<Response>(() => {}));
    const wallet = vi.fn();
    const pending = prepareOwnedChallenge({} as X402Challenge, { url: new URL("/api/proof", window.location.href).href, resource: new URL("/api/proof", window.location.href).href, method: "GET", body_sha256: "a".repeat(64) }, fetcher).then(value => { wallet(); return value; });
    const rejected = expect(pending).rejects.toThrow(/timed out/);
    await vi.advanceTimersByTimeAsync(3001); await rejected;
    expect(wallet).not.toHaveBeenCalled(); expect(fetcher).toHaveBeenCalledOnce();
  });
});
