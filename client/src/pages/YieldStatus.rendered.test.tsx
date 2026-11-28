// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { snapshotFailure } from "../../../scripts/surface/prerender-io.mjs";
import YieldStatus from "./YieldStatus";

const READ_AT = "2026-11-08T11:30:00.000Z";
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(READ_AT));
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function renderStatus() {
  await act(async () => {
    root.render(<HelmetProvider><YieldStatus /></HelmetProvider>);
  });
}

describe("rendered /status source failures", () => {
  it.each(["Failed to fetch", "fetch failed"])(
    "renders independent unknown observations during a complete %s outage",
    async (message) => {
      const fetcher = vi.fn().mockRejectedValue(new TypeError(message));
      vi.stubGlobal("fetch", fetcher);
      await renderStatus();

      expect(container.querySelectorAll('li[data-state="UNKNOWN"]')).toHaveLength(12);
      expect(container.querySelectorAll('li[data-state="UNMEASURED"]')).toHaveLength(6);
      expect(container.querySelectorAll('li[data-state="OK"]')).toHaveLength(0);
      expect(container.querySelectorAll('li[data-state="DEGRADED"]')).toHaveLength(0);
      expect(container.querySelector('[data-testid="fleet-jobs"]')).toBeNull();
      expect(fetcher).toHaveBeenCalledTimes(15);

      for (const row of container.querySelectorAll('li[data-state="UNKNOWN"], li[data-state="UNMEASURED"]')) {
        expect(row.textContent).toContain("This page could not read the source");
        expect(row.textContent).toContain(READ_AT);
        expect(row.querySelector("a")?.getAttribute("href")).toBeTruthy();
      }
      for (const href of ["/api/health", "/api/state", "/api/worker", "/api/revenue", "/root.json"]) {
        expect(container.querySelector(`li[data-state="UNKNOWN"] a[href="${href}"]`)).not.toBeNull();
      }
      const text = container.textContent ?? "";
      expect(text).toContain("page read completed at");
      expect(text).toContain("No figure is shown");
      expect(text).not.toMatch(/\d+ payer\(s\)|\d+ proof\(s\)|\d+ job\(s\)/);
      expect(text).not.toContain(message);
      expect(snapshotFailure(text, [])).toBeNull();
    },
  );

  it("renders unknown rows for valid JSON null instead of aborting the entire page", async () => {
    const fetcher = vi.fn(async () => new Response("null"));
    vi.stubGlobal("fetch", fetcher);
    await renderStatus();

    expect(container.querySelectorAll('li[data-state="UNKNOWN"]')).toHaveLength(12);
    expect(container.querySelectorAll('li[data-state="UNMEASURED"]')).toHaveLength(6);
    expect(container.querySelectorAll('li[data-state="OK"]')).toHaveLength(0);
    expect(container.textContent).toContain("source response did not contain an object");
    expect(container.textContent).toContain("page read completed at");
    expect(fetcher).toHaveBeenCalledTimes(15);
    expect(snapshotFailure(container.textContent ?? "", [])).toBeNull();
  });

  it("retains measured zero and a source-reported offline state when other reads fail", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url === "/api/revenue") {
        return new Response(JSON.stringify({ one_number: { all_time: 0, settlements: 0 } }));
      }
      if (url === "/api/worker") {
        return new Response(JSON.stringify({ status: "OFFLINE", worker: { state: "stopped" } }));
      }
      throw new TypeError("Failed to fetch");
    }));
    await renderStatus();

    const revenue = container.querySelector('a[href="/api/revenue"]')?.closest("li");
    expect(revenue?.getAttribute("data-state")).toBe("OK");
    expect(revenue?.textContent).toContain("0 payer(s) · 0 settlement(s). Zero is a measured zero.");
    const worker = container.querySelector('a[href="/api/worker"]')?.closest("li");
    expect(worker?.getAttribute("data-state")).toBe("UNAVAILABLE");
    expect(worker?.textContent).toContain("status OFFLINE");
    expect(container.querySelectorAll('li[data-state="UNKNOWN"]')).toHaveLength(10);
    expect(snapshotFailure(container.textContent ?? "", [])).toBeNull();
  });

  it("reads the card chain manifest as the signed envelope it is published as", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url === "/signed/chain.json") {
        return new Response(JSON.stringify({ alg: "Ed25519", body: { head: "66856aca4a1f9390f0f51d89", length: 335 }, signature: "x" }));
      }
      throw new TypeError("Failed to fetch");
    }));
    await renderStatus();

    const chain = container.querySelector('a[href="/signed/chain.json"]')?.closest("li");
    expect(chain?.getAttribute("data-state")).toBe("OK");
    expect(chain?.textContent).toContain("head 66856aca4a1f… · 335 card(s) indexed");
  });

  it("still calls a manifest with no head DEGRADED, and never fills one in", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url === "/signed/chain.json") return new Response(JSON.stringify({ alg: "Ed25519", body: {} }));
      throw new TypeError("Failed to fetch");
    }));
    await renderStatus();

    const chain = container.querySelector('a[href="/signed/chain.json"]')?.closest("li");
    expect(chain?.getAttribute("data-state")).toBe("DEGRADED");
    expect(chain?.textContent).toContain("head not published · n not published card(s) indexed");
  });

  it("keeps the unchanged whole-page guard rejecting genuine fetch and JavaScript failures", () => {
    expect(snapshotFailure("Failed to fetch", [])).toMatch(/^BAKED-FETCH-FAILURE/);
    expect(snapshotFailure("fetch failed", [])).toMatch(/^BAKED-FETCH-FAILURE/);
    expect(snapshotFailure("HTML instead of JSON", [])).toMatch(/^BAKED-FETCH-FAILURE/);
    expect(snapshotFailure("Service status", ["uncaught render error"])).toMatch(/^JS_RUNTIME_FAILURE/);
  });
});
