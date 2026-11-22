/**
 * /about/ "What we do, with the proof" (21 Nov 2026): every claim carries a proof link beside it,
 * and every figure in it is read from the source that owns it. Rendered against injected payloads,
 * so each figure asserted here is provably the mock's and nothing in this file can reach a page.
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AboutRecord, { recordRows, STANDARDS_ROWS, type RecordInputs } from "./AboutRecord";
import type { DistributionArtifact } from "@/components/home/useHomeReads";

const asOf = "2026-01-02T03:04:05Z";
const row = (value: number, covered: number, attempted: number, state = "READ") => ({ state, value, covered, attempted, as_of: asOf });
const census = (): DistributionArtifact => ({
  schema: "csoai.distribution/0.1",
  as_of: asOf,
  max_age_hours: 48,
  totals: { downloads_all_time: row(7777777, 900, 901, "PARTIAL"), downloads_30d: row(666666, 900, 901, "PARTIAL") },
  by_entity: {
    downloads_all_time: { csoai: row(123456, 12, 12), meok: row(5555555, 30, 31, "PARTIAL") },
    downloads_30d: { csoai: row(23456, 12, 12), meok: row(444444, 30, 31, "PARTIAL") },
  },
});
const ready = (): RecordInputs => ({
  boardCount: "6 axes · 5 measured (mock)",
  cards: { valid: 41, published: 42, keys: 1 },
  corrections: { kind: "ready", payload: { corrections: [{ id: "C-1" }, { id: "C-2" }, { id: "C-3" }], signature_state: "VALID" } },
  distribution: { kind: "ready", payload: census() },
  now: Date.parse(asOf) + 60_000,
});
const loading = (): RecordInputs => ({ boardCount: null, cards: null, corrections: { kind: "loading" }, distribution: { kind: "loading" } });
const text = (rows: ReturnType<typeof recordRows>) => rows.map((r) => `${r.title} ${r.body}`).join("\n");

describe("AboutRecord: a plain claim per row, the proof beside it", () => {
  it("gives every row, live and standards, at least one proof link to a real source", () => {
    for (const r of [...recordRows(ready()), ...recordRows(loading()), ...STANDARDS_ROWS]) {
      expect(r.proof.length, r.id).toBeGreaterThan(0);
      for (const l of r.proof) {
        expect(l.label.trim(), r.id).not.toBe("");
        expect(l.href, `${r.id}: ${l.href}`).toMatch(/^(\/[a-z0-9.]|https:\/\/[a-z0-9.-]+\/)/i);
        expect(l.href, r.id).not.toBe("#");
      }
    }
  });

  it("prints each figure from its source, and none while the source has not answered", () => {
    const live = text(recordRows(ready()));
    expect(live).toContain("6 axes · 5 measured (mock), read from the board's own endpoint");
    expect(live).toContain("41 of 42 published measurement cards verify against our Ed25519 key");
    expect(live).toContain("The ledger's 3 entries each say what was wrong and what changed, and how it was caught where that was recorded. The ledger itself is signed.");
    expect(live).toContain("CSOAI's own packages have 123,456 gross downloads since first release, from 12 of 12 package counters, in the census dated 2 January 2026.");
    // While nothing has answered, the live rows carry no figure at all; nothing is substituted.
    // (A digit inside an identifier such as Ed25519 is a name, not a figure.)
    expect(text(recordRows(loading()))).not.toMatch(/\b\d/);
  });

  it("names CSOAI's own downloads only: never MEOK AI Labs' figure, never the account total", () => {
    const live = text(recordRows(ready()));
    for (const other of ["5,555,555", "444,444", "7,777,777", "666,666", "5,678,011"]) expect(live).not.toContain(other);
    expect(live).toContain("A download is distribution, not adoption, and MEOK AI Labs' packages are counted separately and never added.");
  });

  it("states a lower bound, a stale census and an unsigned ledger as they are", () => {
    const partial = ready();
    const d = census();
    d.by_entity!.downloads_all_time!.csoai = row(123456, 11, 12, "PARTIAL");
    partial.distribution = { kind: "ready", payload: d };
    partial.now = Date.parse(asOf) + 72 * 3600 * 1000;
    partial.corrections = { kind: "ready", payload: { corrections: [{ id: "C-1" }], signature_state: "STALE" } };
    const t = text(recordRows(partial));
    expect(t).toContain("have at least 123,456 gross downloads");
    expect(t).toContain("in the out-of-date census dated");
    expect(t).toContain("The ledger's signature reads STALE.");
    expect(t).not.toContain("The ledger itself is signed");
  });

  it("keeps the holds and the doctrine: no held bank, no certification word, no superlative", () => {
    const all = [text(recordRows(ready())), text(recordRows(loading())), text(STANDARDS_ROWS)].join("\n");
    expect(all).not.toMatch(/certif|accredit|endorse/i);
    expect(all).not.toMatch(/\bgovernance\b|GovBench|claim re-read|\b182\b/i);
    for (const held of ["watchdog-ingest", "serving-fidelity", "company-practice", "lab-practice", "measurer-integrity", "harness-fidelity", "interop-conformance", "regulator-transparency", "claim-maintenance", "interpretability-reproducibility"]) {
      expect(all).not.toContain(held);
    }
    expect(all).not.toMatch(/\bfirst (?:in|to|ever|of its kind)\b|\bleading\b|world-class|most advanced|\bbest\b|\bonly\b/i);
    // Membership labels follow /interop/memberships.json and the outward gate: no Linux Foundation label.
    expect(all).not.toMatch(/Linux Foundation/i);
  });

  it("renders every row with its proof link beside it", () => {
    const html = renderToStaticMarkup(<AboutRecord {...ready()} />);
    expect(html).toContain('data-testid="about-record"');
    for (const id of ["measure", "board", "signed", "corrections", "distribution", "standards", ...STANDARDS_ROWS.map((r) => r.id)]) {
      expect(html, id).toMatch(new RegExp(`data-record="${id}"`));
    }
    for (const href of ["/api/gspc", "/gspc-verify/", "/.well-known/did.json", "/api/corrections", "/interop/distribution-latest.json", "https://github.com/w3c-cg/aikr/pull/25", "https://github.com/x402-foundation/x402/issues/4127", "https://c2pa.org/membership/"]) {
      expect(html).toContain(`href="${href}"`);
    }
  });
});
