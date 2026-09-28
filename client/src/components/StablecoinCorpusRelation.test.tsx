/**
 * The corpus_relation block and the cross-ledger section as first rendered (what a prerender or a
 * crawler without JavaScript sees): the relation and the section are there before any figure loads,
 * and no figure is shown until its own file has been read.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import StablecoinCorpusRelation, { CorpusRelationView } from "./StablecoinCorpusRelation";
import { crossLedgerSummary, parityFigure, readinessFigure, supplyReadFigure, type XlRecord } from "@/lib/stablecoinCorpusRelation";
import type { StablecoinReadiness } from "@/lib/stablecoinReadiness";

const html = renderToStaticMarkup(<StablecoinCorpusRelation />);
const visible = html.replace(/<pre[\s\S]*?<\/pre>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ");

describe("StablecoinCorpusRelation, first render", () => {
  it("states the relation and names the three figures before anything loads", () => {
    expect(html).toContain('id="corpus_relation"');
    expect(visible).toContain("corpus_relation: SEPARATE_CORPORA");
    for (const id of ["readiness", "supply_read", "parity"]) expect(html).toContain(`data-corpus="${id}"`);
    expect(visible).toMatch(/never added together, never reconciled, never substituted for one another/);
    expect(html).toContain("&quot;relation&quot;: &quot;SEPARATE_CORPORA&quot;");
  });

  it("carries the cross-ledger section with the free record, its signed wrapper and the check steps", () => {
    expect(html).toContain('id="cross-ledger"');
    expect(visible).toContain("Cross-ledger reads");
    expect(html).toContain('href="/api/xl"');
    expect(html).toContain('href="/api/xl?part=signed"');
    expect(html).toContain('href="/stablecoins/deployments/"');
    expect(visible).toContain("payload.artifact.sha256");
  });

  it("shows no figure until its source is read", () => {
    expect(visible).toContain("Reading the source file");
    expect(visible).not.toMatch(/\b\d+ of \d+\b/);
  });

  it("no rating, ranking, scoring or certification wording unless negated", () => {
    for (const m of visible.matchAll(/\b(certif\w*|rank\w*|scor\w*|grade\w*|rating\w*|endorse\w*)\b/gi)) {
      expect(visible.slice(Math.max(0, m.index! - 70), m.index!), `"${m[0]}" must be negated`).toMatch(/\b(not|never|no|nothing|nor)\b/i);
    }
  });
});

const ROOT = resolve(__dirname, "../../..");
const json = (p: string) => JSON.parse(readFileSync(resolve(ROOT, p), "utf8"));
const READINESS = json("public/interop/stablecoin-universe-2026-09/readiness.json") as StablecoinReadiness;
const SUPPLY = json("public/interop/stablecoin-corpus-index-2026-09-16.json");
const XL = json("functions/_lib/reach/__fixtures__/xl-daily-2026-09-26.json") as XlRecord;
const text = (h: string) => h.replace(/<pre[\s\S]*?<\/pre>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ");

describe("StablecoinCorpusRelation, loaded from the real files", () => {
  const r = readinessFigure(READINESS), s = supplyReadFigure(SUPPLY), p = parityFigure(XL), c = crossLedgerSummary(XL);
  const loaded = renderToStaticMarkup(<CorpusRelationView
    readiness={{ state: "ok", value: r }}
    supply={{ state: "ok", value: s }}
    xl={{ state: "ok", value: { record: XL, sha256: "ab".repeat(32), signature: "VERIFIES", version: "v2" } }} />);
  const v = text(loaded);

  it("each card shows its own file's figure and date, and no other card's", () => {
    expect(v).toContain(`${r.measured_assets} of ${r.indexed_assets} indexed assets`);
    expect(v).toContain(`${s.assets_read} of ${s.universe_assets} assets, read once on ${s.as_of.slice(0, 10)}`);
    for (const t of p.states) expect(v).toContain(`${t.n} ${t.state}`);
    expect(v).toContain(`Of ${p.assets} assets in the record dated ${p.date}`);
    // no card carries a combination of two figures
    expect(v).not.toContain(String(r.measured_assets + s.assets_read));
    expect(v).not.toContain(String(s.assets_read + p.assets));
  });

  it("the cross-ledger section shows the record's own counts, evidence kinds and the not-read rows", () => {
    expect(v).toContain(`${c.deployments_read}`);
    for (const k of c.evidence_kinds) expect(v).toContain(`${k.n} ${k.state}`);
    expect(v).toContain(`${c.selected_without_issuer_list} UNMEASURED — not zero, not absent`);
    expect(v).toContain(`${c.not_read} UNCHECKABLE`);
    expect(v).toContain("VERIFIES");
  });

  it("no rating, ranking, scoring or certification wording unless negated, once loaded", () => {
    for (const m of v.matchAll(/\b(certif\w*|rank\w*|scor\w*|grade\w*|rating\w*|endorse\w*)\b/gi)) {
      expect(v.slice(Math.max(0, m.index! - 70), m.index!), `"${m[0]}" must be negated`).toMatch(/\b(not|never|no|nothing|nor)\b/i);
    }
  });

  it("a source that cannot be read shows UNMEASURED and no number", () => {
    const down = text(renderToStaticMarkup(<CorpusRelationView
      readiness={{ state: "unavailable", reason: "readiness unavailable (503)" }}
      supply={{ state: "ok", value: s }}
      xl={{ state: "unavailable", reason: "cross-ledger record unavailable (503)" }} />));
    expect(down.match(/UNMEASURED here/g)?.length).toBe(3); // readiness card, parity card, cross-ledger section
    expect(down).not.toContain(`${r.measured_assets} of ${r.indexed_assets}`);
    expect(down).toContain(`${s.assets_read} of ${s.universe_assets}`);
  });
});
