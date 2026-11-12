// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OwnedPurchases from "./OwnedPurchases";
import { buyerDecisionRequestId } from "@/lib/buyerPurchases";
import { purchaseSha256 } from "../../../shared/buyerPurchase";
let host: HTMLDivElement, root: Root, sha: string;
const owner = "b".repeat(64), transaction = "synthetic-original-tx", version = "2026-11-07T00:00:00Z";
const original = new Uint8Array([0, 255, 128, 1, 42]);
type Saved = { owner_hash: string; transaction: string; request_id: string; action: string; reason: string; result_sha256: string; result_version: string; recorded_at: string };
let saved: Map<string, Saved>, posts: Record<string, unknown>[], writes: number, holdPost: boolean, corruptBody: boolean, corruptDecision: boolean;
let releaseHeld: (() => void) | undefined;
const network = vi.fn<typeof fetch>(), download = vi.fn(), makeUrl = vi.fn(() => "blob:synthetic-original");
const markerKeys = () => Object.keys(localStorage).filter(k => k.startsWith("csoai_purchase_pending_v1:"));
beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); vi.stubGlobal("crypto", webcrypto);
  localStorage.clear(); localStorage.setItem("csoai_token", "synthetic-current-session");
  sha = await purchaseSha256(original); saved = new Map(); posts = []; writes = 0; holdPost = false; corruptBody = false; corruptDecision = false; releaseHeld = undefined;
  makeUrl.mockClear(); download.mockReset();
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: makeUrl });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(download);
  network.mockReset().mockImplementation(async (input, init) => {
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer synthetic-current-session");
    const u = new URL(String(input), window.location.origin);
    expect(u.pathname.startsWith("/api/purchases")).toBe(true); // no financial/provider endpoint
    if (u.pathname.endsWith("/body")) return new Response(corruptBody ? new Uint8Array([1]) : original);
    if (u.pathname.endsWith("/decisions")) {
      if (init?.method === "POST") {
        const body = JSON.parse(String(init.body));
        expect(markerKeys()).toHaveLength(1);
        expect(localStorage.getItem(markerKeys()[0])).toBe(body.request_id); // observed BEFORE HTTP dispatch
        posts.push(body);
        if (!saved.has(body.request_id)) { writes++; saved.set(body.request_id, { ...body, owner_hash: owner, transaction, recorded_at: "synthetic-time" }); }
        const record = saved.get(body.request_id)!;
        const response = () => Response.json({ state: "RECORDED_OBSERVED", decision: record, acceptance_inferred: false }, { status: 201 });
        if (holdPost) return new Promise<Response>(resolve => { releaseHeld = () => resolve(response()); });
        return response();
      }
      const id = u.searchParams.get("request_id");
      let rows = [...saved.values()].filter(row => !id || row.request_id === id);
      if (corruptDecision) rows = rows.map(row => ({ ...row, result_sha256: "f".repeat(64) }));
      return Response.json({ rows, list_complete: true, cursor: null });
    }
    if (u.pathname === "/api/purchases") return Response.json({ owner_hash: owner, rows: [{ transaction, resource: "synthetic-resource", result_url: "/api/purchases/" + transaction }], list_complete: true });
    return Response.json({ owner_hash: owner, transaction, resource: "synthetic-resource",
      result: { sha256: sha, bytes: original.byteLength, version, download_url: "/api/purchases/" + transaction + "/body" },
      receipt: { payment_response: "synthetic-route-reported-receipt", state: "ROUTE_REPORTED_UNVERIFIED" },
      decisions: { rows: [...saved.values()], list_complete: true } });
  }); vi.stubGlobal("fetch", network);
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { releaseHeld?.(); await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); });
function button(text: string) { const b = [...host.querySelectorAll("button")].find(x => x.textContent === text); if (!b) throw new Error("Missing button: " + text); return b; }
async function until(check: () => boolean) { for (let i = 0; i < 120; i++) { if (check()) return; await act(async () => { await new Promise(r => setTimeout(r, 5)); }); } throw new Error("Expected purchase state did not settle"); }
async function click(text: string) { await act(async () => button(text).click()); }
async function open() { await act(async () => root.render(<OwnedPurchases />)); await click("Load saved purchases");
  await until(() => !![...host.querySelectorAll("button")].find(b => b.textContent === "Open original result and receipt"));
  await click("Open original result and receipt"); await until(() => !!host.querySelector("[data-testid=owned-result-detail]")); }
async function remount() { await act(async () => root.unmount()); root = createRoot(host); await open(); }
const labels = { accept: "Accept this original result", reject: "Reject this original result", request_correction: "Request a correction" } as const;
describe("rendered original recovery and explicit result-bound decisions across refresh", () => {
  it.each(["accept", "reject", "request_correction"] as const)("replays the same explicit %s intent after remount without a second stored decision", async action => {
    await open(); expect(posts).toHaveLength(0); expect(saved.size).toBe(0);
    await click(labels[action]); await until(() => posts.length === 1 && markerKeys().length === 0);
    const id = await buyerDecisionRequestId({ transaction, result_sha256: sha, result_version: version, action, reason: "" });
    expect(posts[0]).toMatchObject({ action, request_id: id, result_sha256: sha, result_version: version });
    await remount(); expect(posts).toHaveLength(1); // reads and refresh never infer a new decision
    await click(labels[action]); await until(() => posts.length === 2 && markerKeys().length === 0);
    expect(posts[1]).toEqual(posts[0]); expect(writes).toBe(1);
  });
  it("retains intent before a committed POST reply and reconciles by exact read after remount without reposting", async () => {
    holdPost = true; await open(); await click(labels.accept); await until(() => posts.length === 1);
    const id = posts[0].request_id as string;
    expect(markerKeys()).toHaveLength(1); expect(saved.get(id)?.action).toBe("accept");
    await remount();
    expect(button(labels.accept).disabled).toBe(true); expect(posts).toHaveLength(1);
    await click("Read saved decisions"); await until(() => markerKeys().length === 0);
    const reads = network.mock.calls.filter(([input, init]) => !init?.method && String(input).includes("/decisions"));
    expect(String(reads.at(-1)![0])).toContain("request_id=" + id);
    expect(posts).toHaveLength(1); expect(writes).toBe(1); expect(button(labels.accept).disabled).toBe(false);
    releaseHeld?.(); await act(async () => {});
  });
  it("fails before decision dispatch if its pending-state write cannot be qualified", async () => {
    await open();
    const real = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (key, value) {
      if (key.startsWith("csoai_purchase_pending_v1:")) throw new Error("synthetic write refusal");
      return real.call(this, key, value);
    });
    await click(labels.accept); await until(() => !!host.textContent?.includes("no decision was sent"));
    expect(posts).toHaveLength(0); expect(writes).toBe(0);
  });
  it("exports the original only after verifying its exact stored digest", async () => {
    await open(); await click("Download original bytes"); await until(() => makeUrl.mock.calls.length === 1);
    expect(download).toHaveBeenCalledOnce(); expect(posts).toHaveLength(0); expect(saved.size).toBe(0);
  });
  it("refuses a changed body without exporting or accepting it", async () => {
    corruptBody = true; await open(); await click("Download original bytes"); await until(() => !!host.textContent?.includes("do not match"));
    expect(makeUrl).not.toHaveBeenCalled(); expect(download).not.toHaveBeenCalled(); expect(posts).toHaveLength(0);
  });
  it("does not clear a pending marker for a matching request ID attached to another result", async () => {
    holdPost = true; await open(); await click(labels.reject); await until(() => posts.length === 1);
    await remount(); corruptDecision = true; await click("Read saved decisions");
    await until(() => !!host.textContent?.includes("does not match this original result"));
    expect(markerKeys()).toHaveLength(1); expect(button(labels.accept).disabled).toBe(true);
    expect(posts).toHaveLength(1); expect(writes).toBe(1);
  });
});
