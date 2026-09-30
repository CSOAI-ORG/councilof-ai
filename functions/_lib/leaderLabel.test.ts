/**
 * Tracker row 10 (2026-09-30): chat and dashboard answers printed "leader: <model>" beside "no model
 * separated". The producer (get_axis) now names a non-separated top row "top observed (not separated)"
 * and the chat renderer relabels any payload that still carries `leader` on a TIE/UNTESTED row.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { TOP_OBSERVED_LABEL, isSeparated, leaderLabel } from "./leaderLabel";
import { talk } from "./talkRouter";
import { getAxisTool } from "../mcp/_board";
import { inLaneFacts } from "../../client/src/lib/gspcAxes";

const ORIGIN = "https://councilof.ai";
const BOARD = {
  totals: { axes: 3, measured_axes: 3, unmeasured_axes: 0, public_count: "3 axis · 3 measured" },
  axes: [
    { axis: "safety", family: "gspc", status: "MEASURED", kind: "model-comparison", n: 36, accuracy: 0.9444,
      leader: "gemma3:12b (base model)", separation: "TIE",
      note: "No model separated from the next best on this axis (exact McNemar, p≥0.05, n=36; p=0.6875)." },
    { axis: "jail", family: "gspc", status: "MEASURED", kind: "model-comparison", n: 71, accuracy: 0.5915,
      leader: "qwen2.5:0.5b-instruct (base model)", separation: "UNTESTED" },
    { axis: "governance", family: "gspc", status: "MEASURED", kind: "model-comparison", n: 200, accuracy: 0.9,
      leader: "model-a", separation: "SEPARATED" },
  ],
  measured_on: {},
};

function stubBoard() {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const u = new URL(input instanceof Request ? input.url : String(input));
    return u.pathname === "/api/gspc" ? Response.json(BOARD) : new Response("not found", { status: 404 });
  }));
}
afterEach(() => vi.unstubAllGlobals());

describe("leaderLabel — a leader only when separation SEPARATED it", () => {
  it("SEPARATED is the only state that earns the word", () => {
    expect(isSeparated("SEPARATED")).toBe(true);
    expect(isSeparated("separated")).toBe(true);
    for (const s of ["TIE", "UNTESTED", "", null, undefined, "NOT_SEPARATED"]) {
      expect(isSeparated(s)).toBe(false);
      expect(leaderLabel(s)).toBe(TOP_OBSERVED_LABEL);
    }
    expect(TOP_OBSERVED_LABEL).toBe("top observed (not separated)");
  });
});

describe("get_axis (the producer)", () => {
  it("a TIE row returns its top name as top_observed_not_separated, and leader null", async () => {
    stubBoard();
    const p = (await getAxisTool(ORIGIN, { axis: "safety" })) as Record<string, unknown>;
    expect(p.separation).toBe("TIE");
    expect(p.leader).toBeNull();
    expect(p.top_observed_not_separated).toBe("gemma3:12b (base model)");
    expect(p.leader_label).toBe("top observed (not separated)");
  });
  it("an UNTESTED row is not a leader either", async () => {
    stubBoard();
    const p = (await getAxisTool(ORIGIN, { axis: "jail" })) as Record<string, unknown>;
    expect(p.leader).toBeNull();
    expect(p.top_observed_not_separated).toBe("qwen2.5:0.5b-instruct (base model)");
  });
  it("a SEPARATED row keeps its leader", async () => {
    stubBoard();
    const p = (await getAxisTool(ORIGIN, { axis: "governance" })) as Record<string, unknown>;
    expect(p.leader).toBe("model-a");
    expect(p.top_observed_not_separated).toBeNull();
    expect(p.leader_label).toBe("separated leader");
  });
});

describe("chat answer (/api/chat, AG-UI talk, A2A) for one axis", () => {
  it("a TIE axis prints top observed (not separated), never 'leader:'", async () => {
    stubBoard();
    const a = await talk("how did safety measure", ORIGIN);
    expect(a.answered_by).toBe("tool:get_axis");
    expect(a.answer).toContain("- top observed (not separated): gemma3:12b (base model)");
    expect(a.answer).toContain("- separation: TIE");
    expect(a.answer).not.toMatch(/^- leader/m);
  });
  it("a SEPARATED axis prints the leader, marked separated", async () => {
    stubBoard();
    // A stubbed row: no live model-comparison axis is SEPARATED today (the live board reads 0 separated).
    const a = await talk("how did governance measure", ORIGIN);
    expect(a.answered_by).toBe("tool:get_axis");
    expect(a.answer).toContain("- leader (separated): model-a");
    expect(a.answer).not.toContain("top observed");
  });
  it("control: the pre-fix line shape would fail this test", () => {
    const old = "- leader: gemma3:12b (base model)";
    expect(/^- leader/m.test(old)).toBe(true);
  });
});

describe("dashboard in-lane line", () => {
  it("names a TIE row's top as top observed, and a SEPARATED row as the leader", () => {
    const base = { axis: "safety", bench: "b", task: "t", n: 36, accuracy: 0.9444, leader: "m" } as never;
    const tie = inLaneFacts({ ...(base as object), separation: "TIE" } as never);
    expect(tie.leaderLine).toBe("top observed (not separated) m 0.9444");
    const sep = inLaneFacts({ ...(base as object), separation: "SEPARATED" } as never);
    expect(sep.leaderLine).toBe("separated leader m 0.9444");
  });
});
