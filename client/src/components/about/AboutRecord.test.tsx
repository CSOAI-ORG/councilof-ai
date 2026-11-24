/**
 * /about/ "What we do, with the proof" (24 Nov 2026): every claim carries a proof link beside it,
 * no row prints a figure, and the record tells the same story as the home hero and the lead of
 * /llms.txt: the same claims, in the same order, on the same sources.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AboutRecord, { RECORD_ROWS } from "./AboutRecord";
import { HERO_PROOF } from "../home/HomeHero";

const text = RECORD_ROWS.map((r) => `${r.title} ${r.body} ${r.proof.map((l) => l.label).join(" ")}`).join("\n");
const llmsLead = readFileSync(resolve(__dirname, "../../../../public/llms.txt"), "utf8")
  .split("\n")
  .filter((line) => line.startsWith("> "))
  .join("\n");
const HELD = ["watchdog-ingest", "serving-fidelity", "company-practice", "lab-practice", "measurer-integrity", "harness-fidelity", "interop-conformance", "regulator-transparency", "humanoid-deployment", "interpretability-reproducibility", "claim-maintenance"];

describe("AboutRecord: a plain claim per row, the proof beside it", () => {
  it("gives every row at least one proof link to a real source", () => {
    for (const r of RECORD_ROWS) {
      expect(r.proof.length, r.id).toBeGreaterThan(0);
      for (const l of r.proof) {
        expect(l.label.trim(), r.id).not.toBe("");
        expect(l.href, `${r.id}: ${l.href}`).toMatch(/^(\/[a-z0-9.]|https:\/\/[a-z0-9.-]+\/)/i);
      }
    }
  });

  it("prints no figure: every count belongs to the source behind its link", () => {
    // A digit inside an identifier such as Ed25519 is a name, not a figure.
    for (const r of RECORD_ROWS) expect(`${r.title} ${r.body}`, r.id).not.toMatch(/\b\d/);
  });

  it("keeps the holds and the doctrine: no held bank, no certification word, no superlative", () => {
    expect(text).not.toMatch(/certif|accredit|endorse/i);
    expect(text).not.toMatch(/\bgovernance\b|GovBench|claim re-read/i);
    for (const held of HELD) expect(text).not.toContain(held);
    expect(text).not.toMatch(/\bfirst\b|\bleading\b|world-class|most advanced|\bbest\b|\bonly\b/i);
    expect(text).not.toMatch(/Linux Foundation|subscription|\bplans?\b|\btiers?\b/i);
  });

  it("states distribution as the census does: not adoption, and MEOK AI Labs never added", () => {
    const row = RECORD_ROWS.find((r) => r.id === "distribution")!;
    expect(row.body).toContain("A download is distribution, not adoption");
    expect(row.body).toContain("MEOK AI Labs' packages are counted separately and never added to ours");
    expect(row.proof.map((l) => l.href)).toEqual(["/interop/distribution-latest.json"]);
  });

  it("renders every row with its proof links beside it", () => {
    const html = renderToStaticMarkup(<AboutRecord />);
    expect(html).toContain('data-testid="about-record"');
    for (const r of RECORD_ROWS) {
      const item = html.match(new RegExp(`<li data-record="${r.id}">([\\s\\S]*?)</li>`))?.[1] ?? "";
      for (const l of r.proof) expect(item, `${r.id}: ${l.href}`).toContain(`href="${l.href}"`);
    }
  });
});

describe("one front-door story: the home hero, /about/ and the lead of /llms.txt", () => {
  it("/about/ makes the hero's claims in the hero's order, each on the hero's own source", () => {
    expect(RECORD_ROWS[0].id).toBe("measure");
    expect(RECORD_ROWS.slice(1).map((r) => r.id)).toEqual(HERO_PROOF.map((p) => p.id));
    for (const p of HERO_PROOF) {
      expect(RECORD_ROWS.find((r) => r.id === p.id)!.proof.map((l) => l.href), p.id).toContain(p.href);
    }
  });

  it("the lead of /llms.txt names the same sources in the same order", () => {
    const at = HERO_PROOF.map((p) => {
      // A path on this site matches its absolute form in the lead (councilof.ai or csoai.org).
      const index = llmsLead.indexOf(p.href);
      expect(index, `${p.id}: ${p.href} is not in the lead`).toBeGreaterThan(-1);
      return index;
    });
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(llmsLead).toContain("A download is distribution, not adoption, and MEOK AI Labs' packages are never added to ours.");
  });
});
