import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ALL_TOOL_NAMES, FREE_TOOL_NAMES, PAID_TOOL_NAMES, toolSummary } from "./mcpTools";

const J = (rel: string) => JSON.parse(readFileSync(new URL(rel, import.meta.url), "utf8"));

describe("the pages advertise the tools the door actually serves", () => {
  const free = J("../../../functions/mcp/gspc-tools.json").tools.map((t: { name: string }) => t.name);
  const paid = J("../../../functions/mcp/paid-tools.json").tools.map((t: { name: string }) => t.name);

  it("derives both lists from the files the door reads", () => {
    expect(FREE_TOOL_NAMES).toEqual(free);
    expect(PAID_TOOL_NAMES).toEqual(paid);
    expect(ALL_TOOL_NAMES.length).toBe(free.length + paid.length);
  });

  it("the summary never understates the total", () => {
    // The defect being fixed: the page said four when the door served eleven.
    const m = toolSummary().match(/\+ (\d+) more/);
    const shown = toolSummary().split(" + ")[0].split(" · ").length;
    const claimed = shown + (m ? Number(m[1]) : 0);
    expect(claimed, "the card must account for every tool the door serves").toBe(ALL_TOOL_NAMES.length);
  });

  it("says a metered surface exists, because a buyer cannot discover it otherwise", () => {
    if (PAID_TOOL_NAMES.length > 0) {
      expect(toolSummary()).toMatch(/x402-metered/);
      expect(toolSummary()).toContain(String(PAID_TOOL_NAMES.length));
    }
  });
});

describe("neither page carries a hand-typed tool list any more", () => {
  for (const page of ["../pages/Products.tsx", "../pages/McpFleet.tsx"]) {
    it(`${page} renders the derived summary, not a literal`, () => {
      const src = readFileSync(new URL(page, import.meta.url), "utf8");
      expect(src).toContain("toolSummary()");
      expect(src, "a typed tool list is a number typed by hand")
        .not.toMatch(/board_totals\s*·\s*get_axis/);
    });
  }
});

describe("no component keeps its own copy of the door's tool set", () => {
  // WHY: DashboardToolsPane's typed list was CORRECT on 2026-09-05, which is the trap — a
  // hand-kept duplicate is right until someone adds a tool. OsDoors' fallback was already
  // wrong at four of eleven, and during the outage the fallback is all anyone sees.
  const components = ["../components/DashboardToolsPane.tsx", "../components/os/OsDoors.tsx"];
  for (const c of components) {
    it(`${c} derives its tool names`, () => {
      const src = readFileSync(new URL(c, import.meta.url), "utf8");
      expect(src).toMatch(/FREE_TOOL_NAMES/);
      // a literal array of quoted tool names is the shape being banned
      const literalRun = src.match(/"board_totals"\s*,\s*\n\s*"get_axis"/);
      expect(literalRun, "a typed tool array is a duplicate of the door that cannot stay in step")
        .toBeNull();
    });
  }
});
