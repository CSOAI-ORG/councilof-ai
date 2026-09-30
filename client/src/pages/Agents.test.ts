// /agents/ is rendered from the machine files, so it cannot drift from them (lane gspc-product-ui,
// 30 Sep 2026). These tests hold the page to that: it types no endpoint URL of its own, and its
// readers parse the files actually committed under public/.well-known/.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { AGENT_MACHINE_FILES, catalogRows, paidDoorRows, skillRows } from "./Agents";

const root = resolve(__dirname, "../../..");
const read = (p: string) => JSON.parse(readFileSync(resolve(root, "public", p.replace(/^\//, "")), "utf8"));

describe("/agents/ is generated from the machine files", () => {
  const source = readFileSync(resolve(__dirname, "./Agents.tsx"), "utf8");
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  it("types no absolute endpoint URL; every path it names is a machine file it reads", () => {
    expect(code).not.toMatch(/https?:\/\//);
    for (const p of Object.values(AGENT_MACHINE_FILES)) expect(p.startsWith("/")).toBe(true);
  });

  it("renders every ai-catalog entry, in the catalog's own order", () => {
    const doc = read(AGENT_MACHINE_FILES.catalog);
    const rows = catalogRows(doc);
    expect(rows.length).toBe(doc.entries.length);
    expect(rows.map((r) => r.url)).toEqual(doc.entries.map((e: { url?: string; data?: { endpoint?: string } }) => e.url ?? e.data?.endpoint));
    for (const r of rows) expect(r.url).toMatch(/^https:\/\/(councilof\.ai|huggingface\.co)\//);
  });

  it("renders every A2A skill on the agent card", () => {
    const card = read(AGENT_MACHINE_FILES.agentCard);
    expect(skillRows(card).map((s) => s.id)).toEqual(card.skills.map((s: { id: string }) => s.id));
  });

  it("lists the paid doors without ever reading out an amount", async () => {
    // /.well-known/x402.json is served by a Pages Function; read its real output, not a fixture.
    const { onRequestGet } = await import("../../../functions/.well-known/x402.json");
    const res = await onRequestGet({ request: new Request("https://councilof.ai/.well-known/x402.json"), env: {} } as never);
    const doc = await (res as Response).json();
    const rows = paidDoorRows(doc);
    expect(rows.length).toBe(doc.resources.length);
    const text = JSON.stringify(rows);
    expect(text).not.toMatch(/"amount"|maxAmountRequired|\$\s?\d/);
  });

  it("says no certification, price or codename words", () => {
    expect(code).not.toMatch(/\b(certified|best|leader|Eunomia|Pontius|Harness X|Layer O)\b/);
    expect(code).not.toMatch(/\$\s?\d/);
  });
});
