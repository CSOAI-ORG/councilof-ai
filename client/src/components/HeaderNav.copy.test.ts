import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { navigation, PRIMARY_LINKS } from "./HeaderNav";
import { DASHBOARD_NAV_GROUPS, LOBBY_TABS } from "./lobby/tabs";

/**
 * The header mega-menu and the Council OS sections are rendered by JavaScript, so the
 * brand-gate's scan of prerendered HTML cannot see their words. This applies the gate's own
 * `agent_instruction_leak` pattern to every menu name and description, and to every pane blurb
 * the command palette indexes (persona sweep 6 Oct 2026, finding T05: "Apex 522. SPEC only, not a
 * live mill" and "Do not restore MEASURED-INDEX-v0.1" were rendering in the header menu).
 */
const gate = readFileSync(resolve(__dirname, "../../../scripts/brand-gate.mjs"), "utf8");

function leakPattern(): RegExp {
  const block = gate.slice(gate.indexOf('id: "agent_instruction_leak"'));
  const literal = block.match(/pattern: \/(.+)\/i,\n/);
  if (!literal) throw new Error("agent_instruction_leak pattern not found in scripts/brand-gate.mjs");
  return new RegExp(literal[1], "i");
}

describe("menu copy carries no agent or operator instructions", () => {
  const LEAK = leakPattern();

  it("reads the same pattern the brand-gate enforces", () => {
    expect(LEAK.test("Apex 522. SPEC only, not a live mill")).toBe(true);
    expect(LEAK.test("Do not restore MEASURED-INDEX-v0.1")).toBe(true);
    expect(LEAK.test("Three proposed index measures. Reference test sets only; none is a signed result.")).toBe(false);
  });

  it("header mega-menu: every name and description", () => {
    const hits: string[] = [];
    for (const group of navigation) {
      for (const text of [group.name, group.description]) if (LEAK.test(text)) hits.push(`${group.name}: ${text}`);
      for (const item of group.submenu)
        for (const text of [item.name, item.description, item.section ?? ""])
          if (LEAK.test(text)) hits.push(`${group.name} › ${item.name}: ${text}`);
    }
    for (const link of PRIMARY_LINKS) if (LEAK.test(link.name)) hits.push(`top bar: ${link.name}`);
    expect(hits).toEqual([]);
  });

  it("Council OS sections and every pane blurb", () => {
    const hits: string[] = [];
    for (const group of DASHBOARD_NAV_GROUPS)
      for (const text of [group.label, group.description]) if (LEAK.test(text)) hits.push(`${group.id}: ${text}`);
    for (const tab of LOBBY_TABS)
      for (const text of [tab.label, tab.blurb ?? ""]) if (LEAK.test(text)) hits.push(`${tab.id}: ${text}`);
    expect(hits).toEqual([]);
  });

  it("the Article 50(2) marking check is reachable from the menus a buyer opens", () => {
    const hrefs = (name: string) => navigation.find((g) => g.name === name)!.submenu.map((i) => i.href);
    for (const group of ["Council OS", "Regulation", "Products"]) expect(hrefs(group)).toContain("/dashboard/?tab=art50");
    // "Readiness assessment" used to point at the RAS/x402 request pane; that pane keeps its own entry.
    expect(navigation.flatMap((g) => g.submenu).some((i) => i.name === "Readiness assessment")).toBe(false);
  });
});
