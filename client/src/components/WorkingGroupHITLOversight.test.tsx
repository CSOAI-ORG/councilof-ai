// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WorkingGroupHITLOversight from "./WorkingGroupHITLOversight";

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { "content-type": "application/json" },
});

let root: Root;
let host: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function mount() {
  await act(async () => { root.render(<WorkingGroupHITLOversight />); });
  return host;
}

describe("working-group human-oversight readback", () => {
  it("keeps GSPC measurements separate from HITL recorded decisions and human authority", async () => {
    const fetcher = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input) === "/api/hitl") return json({
        schema: "csoai.hitl-companion-state/0.1",
        module_count: 34, review_queue_summary: { PENDING: 3, APPROVED: 2 },
        store_bound: true,
        counts_are: "counts in a bounded, eventually consistent view of challenges and historical decisions; not current execution authority",
        assessment_scope: {
          operator_identity: "NOT_VERIFIED", human_presence: "NOT_ESTABLISHED",
          professional_competence: "NOT_ASSESSED", execution_authority: false,
        },
      });
      if (String(input) === "/api/gspc") return json({
        schema: "csoai.gspc-axes/0.5",
        totals: { axes: 34, measured_axes: 34, comparison_axes: 14,
          separated_leads: 0, ties: 7, untested_separations: 7 },
      });
      throw new Error("unexpected fetch");
    });
    const c = await mount();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(c.querySelector('[data-testid="wg-hitl-live"]')?.textContent).toContain("34 board-reading modules");
    expect(c.querySelector('[data-testid="wg-hitl-live"]')?.textContent).toContain("3 pending challenges");
    expect(c.querySelector('[data-testid="wg-hitl-live"]')?.textContent).toContain("NOT_VERIFIED");
    expect(c.querySelector('[data-testid="wg-gspc-live"]')?.textContent).toContain("34 measured axes of 34");
    expect(c.querySelector('[data-testid="wg-gspc-live"]')?.textContent).toContain("Statistically separated leads: 0");
    expect(c.textContent).toContain("NOT_TESTED");
    expect(c.textContent).toContain("does not create a new GSPC axis");
    expect(c.querySelector('a[href="/api/hitl/record"]')).not.toBeNull();
    expect(c.querySelector('a[href="/dispute/"]')).not.toBeNull();
  });

  it("does not show empty-ledger zeros as a pending-challenge count when no decision store is bound", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input) === "/api/hitl") return json({
        schema: "csoai.hitl-companion-state/0.1",
        module_count: 34, review_queue_summary: { PENDING: 0, APPROVED: 0 },
        store_bound: false,
        counts_are: "an empty ledger — no decision store is bound, so these zeros are not a claim that nothing was ever decided",
        assessment_scope: {
          operator_identity: "NOT_VERIFIED", human_presence: "NOT_ESTABLISHED",
          professional_competence: "NOT_ASSESSED", execution_authority: false,
        },
      });
      return json({
        schema: "csoai.gspc-axes/0.5",
        totals: { axes: 34, measured_axes: 34, comparison_axes: 14,
          separated_leads: 0, ties: 7, untested_separations: 7 },
      });
    });
    const c = await mount();
    const reading = c.querySelector('[data-testid="wg-hitl-live"]')?.textContent ?? "";
    expect(reading).toContain("Queue count unavailable: no decision store is bound.");
    expect(reading).toContain("these zeros are not a claim that nothing was ever decided");
    expect(reading).not.toContain("0 pending challenges");
  });

  it("does not convert API failures or bad schemas into a human PASS or a measured zero", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input) === "/api/hitl") return json({ schema: "untrusted", module_count: 0 });
      return json({ schema: "csoai.gspc-axes/0.5", totals: { axes: 34 } });
    });
    const c = await mount();
    expect(c.querySelector('[data-testid="wg-hitl-live"]')?.textContent).toContain("UNCHECKABLE");
    expect(c.querySelector('[data-testid="wg-gspc-live"]')?.textContent).toContain("UNCHECKABLE");
    expect(c.textContent).not.toContain("0 measured axes");
    expect(c.textContent).not.toContain("0 pending challenges");
  });

  it("offers independent challenge and reproduction routes with four proposed measurement rows", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("down"));
    const c = await mount();
    expect(c.querySelectorAll("tbody tr").length).toBe(4);
    expect(c.querySelector('a[href="/gspc-verify/"]')).not.toBeNull();
    expect(c.querySelector('a[href="https://github.com/OpenSecureAIAlliance/wg-safe/issues/13"]')).not.toBeNull();
    expect(c.textContent).toContain("NOT_TESTED");
  });
});
