// Provision-mapping proposals: DRAFT pointers from a measurement (capsule adapter, predicate, GSPC axis) to frozen
// corpus v3. A DRAFT proposal never counts as reviewed; every provision it names exists in corpus v3, pinned; every
// rationale span occurs verbatim in that provision's published text.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
// @ts-expect-error: plain ESM script, no type declarations
import { derive as deriveSidecar, serialise as serialiseSidecar, nodeIo as sidecarIo, proposalProblems, PROPOSALS, CORPUS_V3, OUTPUT as SIDECAR, CAPSULE_ROOT, PROPOSAL_RELATIONS } from "./backfill-capsule-provisions.mjs";
// @ts-expect-error: plain ESM script, no type declarations
import { derive as deriveCoverage, nodeIo, SOURCE, OUTPUT } from "./build-coverage.mjs";

type Proposal = { id: string; source: string; subject: string; status: string; relation: string; provision_id: string; provision_sha256: string; span: string; rationale: string; match?: { field: string; equals: string }; heldout?: Record<string, unknown> };
type Unmapped = { source: string; subject: string; reason: string };
type Row = { capsule_id: string; provisions: { corpus_root: string; provision_id: string; provision_sha256: string; relation: string }[] };
type Batch = { batch: string; adapter: string; n_capsules: number; bound_by_sidecar: number; draft_bound_by_sidecar: number; draft_proposals: string[]; reviewed_proposals: string[]; bindings: Row[] };

const ROOT = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p));
const readJson = (p: string) => JSON.parse(read(p).toString("utf8"));
const doc = readJson(PROPOSALS);
const proposals: Proposal[] = doc.proposals;
const unmapped: Unmapped[] = doc.unmapped;
const v3 = readJson(CORPUS_V3);
const PROVISIONS_DIR = "public/interop/corpus-v3/provisions";
const TEXT = new Map<string, string | null>();
for (const f of readdirSync(join(ROOT, PROVISIONS_DIR)))
  for (const line of read(join(PROVISIONS_DIR, f)).toString("utf8").split("\n"))
    if (line.trim()) {
      const r = JSON.parse(line);
      TEXT.set(r.provision_id, r.text_withheld ? null : r.text);
    }

// The 34 GSPC axes as /api/gspc served them on 22 Nov 2026: 11 already point at AI Act provisions (unchanged, not in
// this file), 23 had no provision pointer and are each classified here.
const POINTED = ["governance", "safety", "provenance", "continuity", "conformance", "openness", "care", "detector-interop", "art5-safeguard", "swarm", "jail"];
const UNPOINTED = ["machinery-conformity", "cross-reality", "affect", "effect-binding", "provenance-controls", "reserve-attestation", "regulatory-framework",
  "distribution-integrity", "custody-disclosure", "ai-adoption-components", "labour-components", "humanoid-labour-index", "lab-practice", "company-practice",
  "measurer-integrity", "harness-fidelity", "interop-conformance", "humanoid-deployment", "regulator-transparency", "interpretability-reproducibility",
  "claim-maintenance", "serving-fidelity", "watchdog-ingest"];
const NOT_PASSED = ["gdpr-13", "gdpr-14", "gdpr-37", "cra-13-support-period", "cra-19-importer"];

/** io with the proposals file replaced and the sidecar re-derived from it, as the producers would leave it. */
function withProposals(next: Proposal[]) {
  const base = nodeIo(ROOT);
  const bytes = Buffer.from(JSON.stringify({ ...doc, proposals: next }, null, 2) + "\n");
  let sidecar: Buffer | null = null;
  const io = { ...base, readBytes: (p: string) => (p === PROPOSALS ? bytes : p === SIDECAR && sidecar ? sidecar : base.readBytes(p)) };
  sidecar = Buffer.from(serialiseSidecar(deriveSidecar(io)));
  return { io, sidecar: JSON.parse(sidecar.toString("utf8")) };
}

describe("provision-mapping proposals", () => {
  it("are well formed and pinned to the corpus v3 manifest", () => {
    expect(proposalProblems(doc, v3)).toEqual([]);
    expect(doc.corpus.corpus_root).toBe(v3.corpus_root);
    for (const p of proposals) {
      expect(v3.anchors[p.provision_id], p.id).toBeTruthy();
      expect(p.provision_sha256, p.id).toBe(v3.anchors[p.provision_id]);
    }
  });

  it("every rationale span occurs verbatim in the provision's published text", () => {
    for (const p of proposals) {
      const text = TEXT.get(p.provision_id);
      expect(typeof text, p.id + ": text published").toBe("string");
      expect((text as string).includes(p.span), p.id + ": span verbatim").toBe(true);
    }
  });

  it("never claims equivalence, and every status is the owner's 2026-11-24 review (20 REVIEWED, 2 REJECTED, 3 held as DRAFT)", () => {
    expect(PROPOSAL_RELATIONS).toEqual(["partial", "related"]);
    for (const p of proposals) {
      expect(["partial", "related"]).toContain(p.relation);
      expect(["DRAFT", "REVIEWED", "REJECTED"]).toContain(p.status);
    }
    const ids = (s: string) => proposals.filter((p) => p.status === s).map((p) => p.id).sort();
    expect(ids("REVIEWED").length).toBe(20);
    expect(ids("REJECTED")).toEqual(["axis:company-practice->US-15USC45-FTCAct-1914:s45", "axis:cross-reality->32024R1689:14"]);
    expect(ids("DRAFT")).toEqual(["axis:distribution-integrity->EU-mica-2023:30", "axis:humanoid-deployment->32024R1689:71", "axis:reserve-attestation->EU-mica-2023:36"]);
    expect(() => withProposals([{ ...proposals[0], relation: "equivalent" }])).toThrow(/relation equivalent/);
  });

  it("classifies every published adapter and every unpointed GSPC axis, and leaves the 11 existing pointers alone", () => {
    const published = [...new Set(readJson(OUTPUT).capsule_adapters.map((a: { adapter: string }) => a.adapter))].sort();
    const subjects = (s: string) => [...new Set([...proposals, ...unmapped].filter((r) => r.source === s).map((r) => r.subject))].sort();
    expect(subjects("adapter")).toEqual(published);
    expect(subjects("axis")).toEqual([...UNPOINTED].sort());
    for (const s of ["adapter", "axis", "predicate"]) {
      const withProposal = new Set(proposals.filter((r) => r.source === s).map((r) => r.subject));
      for (const u of unmapped.filter((r) => r.source === s)) expect(withProposal.has(u.subject), u.subject + " is both mapped and unmapped").toBe(false);
    }
    for (const a of POINTED) expect(subjects("axis")).not.toContain(a);
    for (const u of unmapped) expect(u.reason.length, u.subject).toBeGreaterThan(20);
  });

  it("binds only the cra-13-cvd predicate, citing its held-out result; predicates that did not pass stay unmapped", () => {
    const preds = proposals.filter((p) => p.source === "predicate");
    expect(preds.map((p) => p.subject + "->" + p.provision_id)).toEqual(["cra-13-cvd->32024R2847:13"]);
    const h = preds[0].heldout as { detected_audited: number; true_positive: number; precision_ci95_wilson: number[] };
    expect([h.detected_audited, h.true_positive]).toEqual([14, 14]);
    const z = 1.96, n = 14; // Wilson lower bound of 14/14, recomputed
    expect(h.precision_ci95_wilson[0]).toBeCloseTo(n / (n + z * z), 3);
    expect(unmapped.filter((u) => u.source === "predicate").map((u) => u.subject).sort()).toEqual([...NOT_PASSED].sort());
  });

  it("a DRAFT proposal never counts as reviewed: CAPSULE_BOUND stays the reviewed count, CAPSULE_BOUND_DRAFT is derived", () => {
    const cov = readJson(OUTPUT).capsule_binding;
    const side = readJson(SIDECAR);
    expect(cov.CAPSULE_BOUND).toBe(cov.bound_in_capsule + cov.bound_by_sidecar);
    expect(cov.bound_by_sidecar).toBe(side.totals.bound_by_sidecar);
    expect(cov.CAPSULE_BOUND_DRAFT).toBe(side.totals.draft_bound_by_sidecar);
    expect(side.totals.draft_bound_by_sidecar).toBe((side.batches as Batch[]).reduce((a, b) => a + b.draft_bound_by_sidecar, 0));
    expect(serialiseSidecar(deriveSidecar(sidecarIo(ROOT)))).toBe(read(SIDECAR).toString("utf8"));
    // every adapter proposal is REVIEWED since the 2026-11-24 owner review, so no capsule is counted as DRAFT-bound
    expect(side.totals.draft_bound_by_sidecar).toBe(0);
    for (const b of side.batches as Batch[]) {
      const want = proposals.filter((p) => p.source === "adapter" && p.subject === b.adapter && p.status === "REVIEWED").map((p) => p.id).sort();
      expect(b.reviewed_proposals, b.batch).toEqual(want);
    }
    expect(JSON.stringify(readJson(SOURCE))).not.toMatch(/CAPSULE_BOUND_DRAFT/);
  });

  it("a status flip moves exactly that proposal's capsules: back to DRAFT unbinds them into CAPSULE_BOUND_DRAFT; REJECTED counts nowhere", () => {
    const side = readJson(SIDECAR);
    const target = proposals.find((p) => p.id === "adapter:tool_drift->INTL-owasp-llm-top10-2026:LLM01") as Proposal;
    expect(target.status).toBe("REVIEWED");
    const live = (side.batches as Batch[]).find((b) => b.adapter === "tool_drift") as Batch;
    expect(live.bindings[0].provisions).toContainEqual({ corpus_root: v3.corpus_root, provision_id: target.provision_id, provision_sha256: target.provision_sha256, relation: target.relation });
    const n = (side.batches as Batch[]).filter((b) => b.adapter === "tool_drift").reduce((a, b) => a + b.bound_by_sidecar, 0);
    expect(n).toBeGreaterThan(0);
    const flip = (status: string) => proposals.map((p) => (p.id === target.id ? { ...p, status } : p));

    const draft = withProposals(flip("DRAFT"));
    expect(draft.sidecar.totals.bound_by_sidecar).toBe(side.totals.bound_by_sidecar - n);
    expect(draft.sidecar.totals.draft_bound_by_sidecar).toBe(side.totals.draft_bound_by_sidecar + n);
    const cov = deriveCoverage(read(SOURCE), draft.io).capsule_binding;
    expect(cov.CAPSULE_BOUND).toBe(readJson(OUTPUT).capsule_binding.CAPSULE_BOUND - n);
    expect(cov.CAPSULE_BOUND_DRAFT).toBe(readJson(OUTPUT).capsule_binding.CAPSULE_BOUND_DRAFT + n);

    const rejected = withProposals(flip("REJECTED"));
    expect(rejected.sidecar.totals.bound_by_sidecar).toBe(side.totals.bound_by_sidecar - n);
    expect(rejected.sidecar.totals.draft_bound_by_sidecar).toBe(side.totals.draft_bound_by_sidecar);
  });

  it("a match filter binds only the capsules it names (contract_parity: TOOLS dimension only)", () => {
    const side = readJson(SIDECAR);
    const b = (side.batches as Batch[]).find((x) => x.batch === "contract_parity") as Batch;
    const rec = readJson(CAPSULE_ROOT + "/contract_parity/record.json");
    const caps = gunzipSync(read(CAPSULE_ROOT + "/contract_parity/" + rec.capsules_file.path)).toString("utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
    expect(b.bound_by_sidecar).toBe(caps.filter((c) => c.claim?.dimension === "TOOLS").length);
    expect(b.bound_by_sidecar).toBeLessThan(b.n_capsules);
  });

  it("a proposal off the corpus, or not pinned to its anchor, fails the producer", () => {
    expect(proposalProblems({ ...doc, proposals: [{ ...proposals[0], provision_sha256: "0".repeat(64) }] }, v3).join()).toMatch(/not pinned/);
    const offId = "EU-nowhere:1";
    const off = { ...proposals[0], provision_id: offId, id: proposals[0].source + ":" + proposals[0].subject + "->" + offId };
    expect(proposalProblems({ ...doc, proposals: [off] }, v3).join()).toMatch(/not in corpus v3/);
    expect(() => withProposals([off])).toThrow(/not in corpus v3/);
  });
});
