// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ControlRoom from "./ControlRoom";

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

const json = (b: unknown) => new Response(JSON.stringify(b), { headers: { "content-type": "application/json" } });

describe("ControlRoom", () => {
  it("draws tiles and history, lists the failed source in the footer and leaves its tile out", async () => {
    vi.stubGlobal("fetch", vi.fn(async (u: string) => {
      if (u.includes("api.github.com")) return new Response("{}", { status: 403 });
      if (u === "/api/gspc") return json({ totals: { axes: 34, measured_axes: 34, comparison_axes: 14, separated_leads: 0, ties: 7, untested_separations: 7 }, axes: [{ axis: "governance", n: 237, separation: "TIE", measurement_time: { observed_on: "2026-08-12" } }] });
      if (u === "/api/revenue") return json({ one_number: { last_30d: 2, settled_usdc_atomic: 60000, repeat_nonself_payers: { last_30d: 0 } } });
      if (u === "/api/worker") return json({ status: "OFFLINE" });
      if (u.includes("capsules")) return json({ index_date: "2026-11-01", as_of: "2026-11-01T08:30:40Z" });
      if (u.includes("watchdog")) return json({ as_of: "2026-11-21T16:57:32Z", sources_probed: 18, reachable: 18 });
      return json({ watchdog_runs: [{ path: "/w1", as_of: "2026-11-21T16:57:32Z", sources_probed: 18, reachable: 18 }], x402_rounds: [], canary: [{ date: "2026-11-23", endpoint_id: "openai", status: "ERROR" }] });
    }));
    await act(async () => root.render(<ControlRoom />));
    const text = container.textContent ?? "";
    expect(container.querySelectorAll("[data-tile]")).toHaveLength(9);
    expect(container.querySelector('[data-tile="pulls"]')).toBeNull();
    expect(container.querySelector('[data-tile="hosted"]')?.textContent).toContain("unverified");
    expect(container.querySelector('[data-read="failed"]')?.textContent).toContain("HTTP 403");
    expect(text).toContain("one measurement");
    expect(text).toContain("no measurement in this view");
    expect(text).not.toMatch(/arena|certified|compliant/i);
  });

  it("with every source down shows no tile and no number", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    await act(async () => root.render(<ControlRoom />));
    expect(container.querySelectorAll('[data-tile]:not([data-tile="hosted"])')).toHaveLength(0);
    expect(container.querySelectorAll('[data-read="failed"]')).toHaveLength(7);
  });
});
