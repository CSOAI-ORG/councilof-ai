import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildTree, writeTree, canonicalHash, canonicalize, slugify, deriveStatus, N_FLOOR } from "./build-axis-reports.mjs";

/**
 * The generator's rules, proven on a fixture repo — with a control that can fail:
 *   · MEASURED only when the card body says MEASURED at n >= 30; n=12 reads UNMEASURED with its reason
 *   · obligations come from the crosswalk or read UNMAPPED — never guessed
 *   · canonical_sha256 ignores the clock and is stable across runs
 *   · counts in index.json are lengths of arrays, a declared slot is one entry at n 0
 *   · --check goes red on a tampered file, and an INVALID card aborts the build
 */

const CARD_A = "a".repeat(64);
const CARD_B = "b".repeat(64);
const CARD_C = "c".repeat(64);
const SLOTS = [
  { axis: "governance", family: "gspc", kind: "model-comparison", bench: "GovBench", task: "t", n: 237, status: "MEASURED" },
  { axis: "safety", family: "gspc", kind: "model-comparison", bench: "DefBench", task: "t", n: 36, status: "MEASURED" },
  { axis: "effect-binding", family: "gspc", kind: "declared-slot", bench: "EffectBench (instrument not built)", task: "t", n: 0, n_unit: "tool-call servers probed", n_note: "0 because nothing has been measured", status: "UNMEASURED" },
  { axis: "reserve-attestation", family: "financial", kind: "deterministic-facts", bench: "ReserveFacts", task: "t", n: 16, n_unit: "issuer accounts (not bank items)", status: "MEASURED" },
];
const verifyOk = async () => ({ state: "VALID" });

function fixtureRepo() {
  const repo = mkdtempSync(join(tmpdir(), "axis-reports-"));
  mkdirSync(join(repo, "public/signed/cards"), { recursive: true });
  mkdirSync(join(repo, "public/interop"), { recursive: true });
  mkdirSync(join(repo, "client/src/data"), { recursive: true });
  const card = (id, body) => writeFileSync(join(repo, `public/signed/cards/${id}.json`), JSON.stringify({ alg: "Ed25519", body, id, pubkey: "k", signature: "s" }));
  card(CARD_A, { kind: "gspc.measurement-card", model: "model-one:7b", axis: "gspc-governance", accuracy: 0.7, n: 40, status: "MEASURED", separation_p: 0.03, rows: [{ item: 1, ok: true }], created: "2026-08-19T09:00:00+00:00" });
  card(CARD_B, { kind: "gspc.measurement-card", model: "model-two:3b", axis: "gspc-governance", accuracy: 0.5, n: 12, status: "MEASURED", created: "2026-08-19T09:00:01+00:00" });
  card(CARD_C, { kind: "gspc.measurement-card", model: "model-one:7b", axis: "gspc-safety", accuracy: 0.9, created: "2026-08-19T09:00:02+00:00" });
  writeFileSync(join(repo, "public/signed/card-matrix.json"), JSON.stringify({
    as_of: "2026-08-19T09:00:02+00:00", as_of_field: "newest card",
    cells: [
      { model: "model-one:7b", axis: "gspc-governance", card: CARD_A, card_url: `/signed/cards/${CARD_A}.json` },
      { model: "model-two:3b", axis: "gspc-governance", card: CARD_B, card_url: `/signed/cards/${CARD_B}.json` },
      { model: "model-one:7b", axis: "gspc-safety", card: CARD_C, card_url: `/signed/cards/${CARD_C}.json` },
    ],
  }));
  writeFileSync(join(repo, "client/src/data/regulator-crosswalk.json"), JSON.stringify({
    fine_tiers: { eu_ai_act: { most_obligations_incl_art50_and_gpai: { statutory_maximum: "up to X", cited_to: "Art 99(4)" } }, no_fine: { statutory_maximum: null, cited_to: null } },
    regulators: [{ id: "eu-ai-act", name: "EU AI Act" }],
    axes: {
      "gspc-governance": { kind: "governance-axis", board_axis: "governance", pointers: [{ regulator: "eu-ai-act", relation: "relevant-to", obligation: "Article 53 — GPAI provider transparency & documentation", tier: "most_obligations_incl_art50_and_gpai" }] },
      "gspc-safety": { kind: "governance-axis", board_axis: "safety", pointers: [] },
      "arc-30": { kind: "capability-benchmark", board_axis: null, pointers: [] },
    },
  }));
  // a card root that carries CARD_A as a leaf; CARD_C is not rooted anywhere
  writeFileSync(join(repo, "public/interop/card-root-2026-09-14.json"), JSON.stringify({ kind: "csoai.card-root/1", merkle_root: "m".repeat(64), leaves: [{ id: CARD_A, index: 3 }] }));
  return repo;
}

describe("build-axis-reports — derivation rules on a fixture corpus", () => {
  let repo;
  let tree;
  beforeAll(async () => {
    repo = fixtureRepo();
    tree = await buildTree({ repo, slots: SLOTS, verify: verifyOk, now: "2026-09-16T00:00:00.000Z" });
  });
  afterAll(() => rmSync(repo, { recursive: true, force: true }));

  it("MEASURED only when the card says MEASURED at n >= 30; rows, p and root come from the card", () => {
    const r = tree.files.get("model-one-7b/governance.json").json;
    expect(r.status).toBe("MEASURED");
    expect(r.n).toBe(40);
    expect(r.rows).toEqual([{ item: 1, ok: true }]);
    expect(r.separation).toBe(0.03);
    expect(r.root_ref).toEqual([{ card: CARD_A, file: "/interop/card-root-2026-09-14.json", merkle_root: "m".repeat(64), index: 3 }]);
    expect(r.reason).toBeUndefined();
  });

  it("n=12 reads UNMEASURED with the floor as the reason, and the n is still reported", () => {
    const r = tree.files.get("model-two-3b/governance.json").json;
    expect(r.status).toBe("UNMEASURED");
    expect(r.n).toBe(12);
    expect(r.reason).toMatch(new RegExp(`n=12 is below the ${N_FLOOR}-item floor`));
    expect(r.separation).toBe("UNTESTED");
    expect(r.root_ref).toBe("NOT_YET_ROOTED");
  });

  it("a card with no n reads UNMEASURED and says so; no obligation is invented where the crosswalk has none", () => {
    const r = tree.files.get("model-one-7b/safety.json").json;
    expect(r.status).toBe("UNMEASURED");
    expect(r.reason).toMatch(/carries no n/);
    expect(r.obligations).toBe("UNMAPPED");
    expect(readFileSync ? tree.files.get("model-one-7b/safety.md").md : "").toMatch(/UNMAPPED — the crosswalk carries no pointer/);
  });

  it("the Art 53 GPAI transparency pointer is carried where the crosswalk maps it, as relevant-to only", () => {
    const r = tree.files.get("model-one-7b/governance.json").json;
    expect(r.obligations).toHaveLength(1);
    expect(r.obligations[0]).toMatchObject({ regulator: "eu-ai-act", relation: "relevant-to", obligation: expect.stringMatching(/Article 53/), no_fine_asserted_owed: true, statutory_maximum: "up to X" });
  });

  it("canonical_sha256 is stable across runs and ignores generated_at", async () => {
    const again = await buildTree({ repo, slots: SLOTS, verify: verifyOk, now: "2027-01-01T00:00:00.000Z" });
    for (const [rel, f] of tree.files) {
      if (!f.json) continue;
      expect(again.files.get(rel).json.canonical_sha256, rel).toBe(f.json.canonical_sha256);
      expect(again.files.get(rel).json.generated_at).not.toBe(f.json.generated_at);
      expect(canonicalHash(f.json), rel).toBe(f.json.canonical_sha256);
    }
    expect(canonicalize({ b: 1, a: [2, { d: null, c: "x" }] })).toBe('{"a":[2,{"c":"x","d":null}],"b":1}');
  });

  it("index counts are derived; a declared slot is one entry at n 0; a facts axis has no subject reports", () => {
    const i = tree.index;
    expect(i.counts.axes).toBe(4);
    expect(i.counts.reports).toBe(3);
    expect(i.counts.measured).toBe(1);
    expect(i.counts.unmeasured).toBe(2);
    expect(i.counts.subjects_with_reports).toBe(2);
    expect(i.counts.reports_unmapped).toBe(1);
    expect(i.counts.reports_rooted).toBe(1);
    expect(Object.values(i.counts.unmeasured_reasons).reduce((a, b) => a + b, 0)).toBe(2);
    const declared = i.axes.find((a) => a.axis === "effect-binding");
    expect(declared).toMatchObject({ kind: "declared-slot", status: "UNMEASURED", n: 0, reports: { total: 0, measured: 0, unmeasured: 0 } });
    expect([...tree.files.keys()].filter((k) => k.endsWith("/effect-binding.json"))).toEqual([]);
    const facts = i.axes.find((a) => a.axis === "reserve-attestation");
    expect(facts.reports.total).toBe(0);
    expect(facts.n_unit).toBe("issuer accounts (not bank items)");
  });

  it("slugs are one-way and URL-safe", () => {
    expect(slugify("qwen2.5:7b")).toBe("qwen2.5-7b");
    expect(slugify("eat-unsloth-050b:2026-08-02")).toBe("eat-unsloth-050b-2026-08-02");
  });
});

describe("build-axis-reports — the parts that must be able to fail", () => {
  it("writes, then --check is green; tamper a file and --check goes red; a rerun heals it", async () => {
    const repo = fixtureRepo();
    try {
      const w = await writeTree({ repo, slots: SLOTS, verify: verifyOk });
      expect(w.ok).toBe(true);
      const p = join(repo, "public/reports/model-two-3b/governance.json");
      expect(existsSync(p)).toBe(true);
      const green = await writeTree({ repo, slots: SLOTS, verify: verifyOk, check: true });
      expect(green.ok).toBe(true);
      expect(green.stale).toEqual([]);
      writeFileSync(p, readFileSync(p, "utf8").replace('"UNMEASURED"', '"MEASURED"'));
      writeFileSync(join(repo, "public/reports/model-two-3b/orphan.json"), "{}");
      const red = await writeTree({ repo, slots: SLOTS, verify: verifyOk, check: true });
      expect(red.ok).toBe(false);
      expect(red.stale).toContain("model-two-3b/governance.json");
      expect(red.stale).toContain("model-two-3b/orphan.json (orphan)");
      await writeTree({ repo, slots: SLOTS, verify: verifyOk });
      expect(existsSync(join(repo, "public/reports/model-two-3b/orphan.json"))).toBe(false);
      expect(JSON.parse(readFileSync(p, "utf8")).status).toBe("UNMEASURED");
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it("refuses a card the verifier does not call VALID", async () => {
    const repo = fixtureRepo();
    try {
      const verify = async (card) => (card.id === CARD_B ? { state: "INVALID", reason: "signature does not verify" } : { state: "VALID" });
      await expect(buildTree({ repo, slots: SLOTS, verify })).rejects.toThrow(/not VALID: signature does not verify/);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it("refuses a crosswalk join to a slot that is not on the board", async () => {
    const repo = fixtureRepo();
    try {
      const xw = join(repo, "client/src/data/regulator-crosswalk.json");
      writeFileSync(xw, readFileSync(xw, "utf8").replace('"board_axis":"safety"', '"board_axis":"not-a-slot"'));
      await expect(buildTree({ repo, slots: SLOTS, verify: verifyOk })).rejects.toThrow(/not an exported board slot/);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it("deriveStatus never promotes a card whose body does not say MEASURED", () => {
    const st = deriveStatus([{ id: "x", body: { n: 100, status: "DRAFT" } }]);
    expect(st.status).toBe("UNMEASURED");
    expect(st.reason).toMatch(/states status 'DRAFT'/);
  });
});
