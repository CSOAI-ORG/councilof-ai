/**
 * corpus_relation on /stablecoins/: three figures, read from their own files, never combined.
 *
 * Real bytes: the committed readiness ledger and supply-read index, and the REAL signed 2026-09-26
 * cross-ledger record (functions/_lib/reach/__fixtures__/). No figure below is typed; each expectation
 * is derived from the same file the page reads.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CORPUS_RELATION,
  DETERMINATION_NAMES,
  crossLedgerSummary,
  isXlRecord,
  parityFigure,
  readinessFigure,
  supplyReadFigure,
  tally,
  type XlRecord,
} from "./stablecoinCorpusRelation";
import type { StablecoinReadiness } from "./stablecoinReadiness";

const ROOT = resolve(__dirname, "../../..");
const json = (p: string) => JSON.parse(readFileSync(resolve(ROOT, p), "utf8"));
const READINESS = json("public/interop/stablecoin-universe-2026-09/readiness.json") as StablecoinReadiness;
const SUPPLY = json("public/interop/stablecoin-corpus-index-2026-09-16.json");
const XL = json("functions/_lib/reach/__fixtures__/xl-daily-2026-09-26.json") as XlRecord;
const component = readFileSync(resolve(__dirname, "../components/StablecoinCorpusRelation.tsx"), "utf8");
const lib = readFileSync(resolve(__dirname, "stablecoinCorpusRelation.ts"), "utf8");

describe("the three stablecoin figures are read from their own files", () => {
  it("readiness: measured and indexed assets from the readiness ledger's own coverage", () => {
    const f = readinessFigure(READINESS);
    expect(f.measured_assets).toBe(READINESS.assets.filter((a) => a.measurement.state === "MEASURED").length);
    expect(f.indexed_assets).toBe(READINESS.assets.length);
    expect(f.as_of).toBe(READINESS.as_of);
  });

  it("supply read: the dated index's own figure, its readers and its disjointness result", () => {
    const f = supplyReadFigure(SUPPLY);
    expect(f.assets_read).toBe(SUPPLY.assets_with_at_least_one_measured_deployment);
    expect(f.universe_assets).toBe(SUPPLY.universe_asset_count);
    expect(f.by_reader.map((r) => r.reader).sort()).toEqual(Object.keys(SUPPLY.by_reader).sort());
    expect(f.disjointness).toBe(SUPPLY.disjointness_checked.result);
    expect(f.as_of).toBe(SUPPLY.as_of);
  });

  it("parity: one state per asset in the signed record, counted, nothing else", () => {
    expect(isXlRecord(XL)).toBe(true);
    const f = parityFigure(XL);
    const states = Object.values(XL.parity.asset_states);
    expect(f.assets).toBe(states.length);
    for (const t of f.states) expect(t.n).toBe(states.filter((s) => s === t.state).length);
    expect(f.states.map((t) => t.state).sort()).toEqual([...new Set(states)].sort());
    expect(f.date).toBe(XL.date);
  });

  it("the cross-ledger summary is lengths of the record's own arrays", () => {
    const s = crossLedgerSummary(XL);
    expect(s.deployments_read).toBe(XL.deployments.length);
    expect(s.evidence_kinds.reduce((a, t) => a + t.n, 0)).toBe(XL.deployments.length);
    expect(s.assets_in_record).toBe(Object.keys(XL.assets).length);
    expect(s.selected_without_issuer_list).toBe((XL.unmeasured_selected ?? []).length);
    expect(s.not_read).toBe((XL.uncheckable ?? []).length);
  });

  it("tally orders the parity states first and counts every name", () => {
    expect(tally(["UNCHECKABLE", "X", "CONSISTENT", "UNCHECKABLE", "INCONSISTENT"])).toEqual([
      { state: "CONSISTENT", n: 1 }, { state: "INCONSISTENT", n: 1 }, { state: "UNCHECKABLE", n: 2 }, { state: "X", n: 1 },
    ]);
  });
});

describe("the figures stay separate (corpus_relation)", () => {
  it("declares SEPARATE_CORPORA over exactly the three figures", () => {
    expect(CORPUS_RELATION.relation).toBe("SEPARATE_CORPORA");
    expect([...CORPUS_RELATION.corpora]).toEqual(["readiness", "supply_read", "parity"]);
    expect(CORPUS_RELATION.never).toContain("added together");
  });

  it("the three are different populations on different dates (so a sum would mean nothing)", () => {
    const r = readinessFigure(READINESS), s = supplyReadFigure(SUPPLY), p = parityFigure(XL);
    expect(new Set([r.source, s.source, p.source]).size).toBe(3);
    expect(new Set([r.as_of.slice(0, 10), s.as_of.slice(0, 10), p.date]).size).toBe(3);
    expect(r.indexed_assets).not.toBe(p.assets);
  });

  it("no figure is typed into the component or the lib", () => {
    const typed = [
      READINESS.coverage.indexed_assets, READINESS.coverage.unmeasured_assets, READINESS.coverage.indexed_chain_deployments,
      SUPPLY.assets_with_at_least_one_measured_deployment, SUPPLY.still_unmeasured, SUPPLY.universe_asset_count,
      ...Object.values(SUPPLY.by_reader as Record<string, { measured_assets: number }>).map((r) => r.measured_assets),
      XL.deployments.length,
    ].filter((n) => n >= 10);
    for (const n of typed) {
      expect(component, `component types ${n}`).not.toMatch(new RegExp(`\\b${n}\\b`));
      expect(lib, `lib types ${n}`).not.toMatch(new RegExp(`\\b${n}\\b`));
    }
  });

  it("the component never adds two figures from different files", () => {
    // Each figure renders from its own slot; no expression joins readiness, supply-read and parity values.
    expect(component).not.toMatch(/\b(?:r|s|p)\.(?:measured_assets|assets_read|assets)\s*\+\s*(?:r|s|p)\./);
    expect(component).toContain("{CORPUS_RELATION.relation}");
  });
});

describe("owner-gated vocabulary", () => {
  it("the three determination names are HELD until the owner approves them (plan 2026-09-28, decision 6)", () => {
    // Flip this only with the owner's written approval of the names; the cards then show them.
    expect(DETERMINATION_NAMES).toBeNull();
  });

  it("evidence kinds are listed in the record's own ladder order", () => {
    const s = crossLedgerSummary(XL);
    const legend = Object.keys(XL.evidence_kind_legend ?? {});
    const idx = s.evidence_kinds.map((k) => legend.indexOf(k.state)).filter((i) => i >= 0);
    expect(idx).toEqual([...idx].sort((a, b) => a - b));
  });
});

describe("contracts fail closed (must-fail controls)", () => {
  it("a record with another schema is not a cross-ledger record", () => {
    expect(isXlRecord({ ...XL, schema: "csoai.something-else/0.1" })).toBe(false);
    expect(isXlRecord({ ...XL, parity: {} })).toBe(false);
    expect(isXlRecord("<!doctype html><title>SPA</title>")).toBe(false);
  });

  it("a supply index with another schema or a missing figure throws, never shows a number", () => {
    expect(() => supplyReadFigure({ ...SUPPLY, schema: "x" })).toThrow();
    const { assets_with_at_least_one_measured_deployment: _dropped, ...rest } = SUPPLY;
    expect(() => supplyReadFigure(rest)).toThrow();
  });
});
