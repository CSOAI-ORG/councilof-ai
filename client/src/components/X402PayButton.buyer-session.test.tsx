// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import X402PayButton from "./X402PayButton";
import { buyerNonce } from "../../../shared/buyerPurchase";
import type { X402Challenge } from "@/lib/x402Wallet";
const wallet = vi.hoisted(() => ({ discover: vi.fn(), sign: vi.fn() }));
vi.mock("@/lib/x402Wallet", async (original) => ({ ...await original<typeof import("@/lib/x402Wallet")>(),
  discoverEIP6963: wallet.discover, signX402Challenge: wallet.sign }));
let host: HTMLDivElement, root: Root;
const network = vi.fn<typeof fetch>(), execute = vi.fn();
function terms(): X402Challenge {
  const url = new URL("/api/proof", window.location.href).href;
  return { x402Version: 2, payTo: "0x" + "2".repeat(40), amount: "10000", resource: url,
    resourceInfo: { url }, network: "eip155:8453", accepted: { scheme: "exact", network: "eip155:8453",
      asset: "0x" + "3".repeat(40), amount: "10000", payTo: "0x" + "2".repeat(40),
      maxTimeoutSeconds: 60, extra: { name: "USD Coin", version: "2" } },
    purchaseRequest: { url, resource: url, method: "GET", body_sha256: "a".repeat(64) } };
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); vi.stubGlobal("crypto", webcrypto);
  localStorage.clear(); localStorage.setItem("csoai_token", "synthetic-session-a");
  wallet.discover.mockReset().mockResolvedValue({ info: { name: "Synthetic wallet" }, provider: { request: vi.fn() } });
  wallet.sign.mockReset().mockResolvedValue({ header: "synthetic-financial-envelope-not-a-real-authorization" });
  execute.mockReset().mockResolvedValue({ status: "delivered", paymentResponse: "synthetic-route-echo" });
  network.mockReset().mockImplementation(async (input, init) => {
    expect(String(input)).toBe("/api/purchases/prepare");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer synthetic-session-a");
    const request = JSON.parse(String(init?.body)), owner_hash = "b".repeat(64), seed = "d".repeat(64);
    return Response.json({ schema: "csoai.purchase-preparation/1", owner_hash, seed, request,
      nonce: await buyerNonce(owner_hash, request, seed) });
  }); vi.stubGlobal("fetch", network);
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); });
async function settled(check: () => boolean) {
  for (let i = 0; i < 100; i++) { if (check()) return; await act(async () => { await new Promise(r => setTimeout(r, 5)); }); }
  throw new Error("Expected checkout state did not settle");
}
async function render() { await act(async () => root.render(<X402PayButton challenge={terms()} executePayment={execute} isContextCurrent={() => true} />)); }
async function confirm() {
  await act(async () => host.querySelector<HTMLButtonElement>("[data-testid=x402-pay-button]")!.click());
  await act(async () => host.querySelector<HTMLButtonElement>("[data-testid=x402-confirm]")!.click());
}
describe("rendered account-bound checkout without a real wallet or payment", () => {
  it("prepares the exact signed-in request before the mocked approval and dispatch", async () => {
    await render(); await confirm(); await settled(() => execute.mock.calls.length === 1);
    expect(network).toHaveBeenCalledOnce(); expect(wallet.sign).toHaveBeenCalledOnce(); expect(execute).toHaveBeenCalledOnce();
    const challenge = wallet.sign.mock.calls[0][1] as X402Challenge;
    expect(challenge.purchaseSeed).toBe("d".repeat(64));
    expect(challenge.nonce).toBe(await buyerNonce("b".repeat(64), terms().purchaseRequest!, "d".repeat(64)));
  });
  it("keeps a guest approval unowned and does not invent an authenticated preparation", async () => {
    localStorage.removeItem("csoai_token");
    await render(); await confirm(); await settled(() => execute.mock.calls.length === 1);
    expect(network).not.toHaveBeenCalled(); expect(wallet.sign.mock.calls[0][1].purchaseSeed).toBeUndefined();
    expect(execute).toHaveBeenCalledOnce();
  });
  it("discards a pending wallet approval after a token change and leaves an actionable state", async () => {
    let release!: (value: { header: string }) => void;
    wallet.sign.mockImplementation(() => new Promise(resolve => { release = resolve; }));
    await render(); await confirm(); await settled(() => wallet.sign.mock.calls.length === 1);
    localStorage.setItem("csoai_token", "synthetic-session-b"); // no storage event
    await act(async () => release({ header: "synthetic-unused-envelope" }));
    await settled(() => !!host.textContent?.includes("The account or request changed"));
    expect(execute).not.toHaveBeenCalled();
    expect(host.querySelector<HTMLButtonElement>("[data-testid=x402-pay-button]")!.disabled).toBe(false);
  });
  it("refuses unreadable session storage before mocked signing or payment dispatch", async () => {
    const real = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (key) {
      if (key === "csoai_token") throw new Error("synthetic storage refusal");
      return real.call(this, key);
    });
    await render(); await confirm(); await settled(() => !!host.textContent?.includes("Session storage unavailable"));
    expect(wallet.sign).not.toHaveBeenCalled(); expect(execute).not.toHaveBeenCalled(); expect(network).not.toHaveBeenCalled();
  });
  it("never automatically purchases again after an uncertain delivery or component remount", async () => {
    execute.mockResolvedValue({ status: "failed", detail: "Delivery unconfirmed; inspect saved purchases before paying again." });
    await render(); await confirm(); await settled(() => !!host.textContent?.includes("Delivery unconfirmed"));
    expect(execute).toHaveBeenCalledOnce(); expect(wallet.sign).toHaveBeenCalledOnce();
    await act(async () => root.unmount()); root = createRoot(host); await render();
    expect(execute).toHaveBeenCalledOnce(); expect(wallet.sign).toHaveBeenCalledOnce();
    expect(network).toHaveBeenCalledOnce();
  });
});
