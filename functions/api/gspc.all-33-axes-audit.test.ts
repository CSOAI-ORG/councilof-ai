import { existsSync, readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { collectOwnModelIdentifiers, onRequestGet as getGspc } from "./gspc";
import { onRequestGet as getBadge } from "./badge";
import { onRequestGet as getReports } from "./reports";
import { onRequestGet as getAxisRegister } from "./axis-register";
import { onRequestGet as getState } from "./state";
import { FINANCIAL_FACTS_AS_OF } from "./_gspc_fin_as_of";
import axisAliases from "../mcp/axis-aliases.json";
import reportsIndex from "../../public/reports/index.json";
import { AXES as OS_AXES } from "../../client/src/lib/gspcAxes";
import { onRequestGet as getPluginPlatforms } from "./plugin/platforms";
import { verifyCandidateForIntake, onRequestPost as postIntake } from "./evidence-intake";
import { buildSignedCandidateObservation } from "../../public/agent-plugin/canonical/scripts/gspc-harvest.mjs";
import psychosisBank from "../../public/interop/psychosis-delusion-guard-bank-v1.json";

const invokeGspc = async () => {
  if (!("caches" in globalThis)) {
    (globalThis as unknown as { caches: unknown }).caches = {
      default: { match: async () => undefined, put: async () => {} },
    };
  }
  const res = await (getGspc as unknown as (ctx: unknown) => Promise<Response>)({
    request: new Request("https://councilof.ai/api/gspc"),
    env: {},
    waitUntil: () => {},
  });
  return res.json() as Promise<Record<string, any>>;
};

const invokeBadge = async (axis: string) => {
  const res = await (getBadge as unknown as (ctx: unknown) => Promise<Response>)({
    request: new Request(`https://councilof.ai/api/badge?axis=${encodeURIComponent(axis)}&format=json`),
    env: {},
  });
  return res.json() as Promise<Record<string, any>>;
};

const invokeReports = async () => {
  const res = await (getReports as unknown as (ctx: unknown) => Promise<Response>)({
    request: new Request("https://councilof.ai/api/reports"),
    env: {},
  });
  return res.json() as Promise<Record<string, any>>;
};

const invokeAxisRegister = async () => {
  const res = await (getAxisRegister as unknown as (ctx: unknown) => Promise<Response>)({
    request: new Request("https://councilof.ai/api/axis-register"),
    env: {},
  });
  return res.json() as Promise<Record<string, any>>;
};

const invokeState = async () => {
  const res = await (getState as unknown as (ctx: unknown) => Promise<Response>)({
    request: new Request("https://councilof.ai/api/state"),
    env: {},
  });
  return res.json() as Promise<Record<string, any>>;
};

const CANONICAL_33_AXES = [
  // Family 1 + 2 + 2b: 14 model-comparison axes
  "governance",
  "safety",
  "provenance",
  "continuity",
  "conformance",
  "openness",
  "machinery-conformity",
  "care",
  "cross-reality",
  "detector-interop",
  "art5-safeguard",
  "swarm",
  "affect",
  "jail",
  // Family 3a: 1 gspc deterministic-facts axis
  "effect-binding",
  // Family 3b: 8 financial deterministic-facts axes
  "provenance-controls",
  "reserve-attestation",
  "regulatory-framework",
  "distribution-integrity",
  "custody-disclosure",
  "ai-adoption-components",
  "labour-components",
  "humanoid-labour-index",
  // Family 4: 10 subject declared-slot axes
  "lab-practice",
  "company-practice",
  "measurer-integrity",
  "harness-fidelity",
  "interop-conformance",
  "humanoid-deployment",
  "regulator-transparency",
  "interpretability-reproducibility",
  "claim-maintenance",
  "serving-fidelity",
] as const;

const EXPECTED_MODEL_COMPARISON: Record<
  string,
  {
    n: number;
    distinct_items: number;
    separation: "TIE" | "UNTESTED";
    leader?: string;
    public_leader_state?: "EXCLUDED_OWN_MODEL" | "NO_SIGNED_CARD";
    mde_state: "MEASURED" | "NOT_REACHABLE" | "UNMEASURED";
  }
> = {
  governance: { n: 237, distinct_items: 237, separation: "TIE", leader: "mistral:7b (base model)", mde_state: "MEASURED" },
  safety: { n: 36, distinct_items: 36, separation: "TIE", leader: "gemma3:12b (base model)", mde_state: "NOT_REACHABLE" },
  provenance: { n: 32, distinct_items: 32, separation: "TIE", leader: "llama3.2:3b (base model)", mde_state: "MEASURED" },
  continuity: { n: 33, distinct_items: 33, separation: "TIE", leader: "gemma3:12b (base model)", mde_state: "NOT_REACHABLE" },
  conformance: { n: 35, distinct_items: 35, separation: "TIE", leader: "mistral:7b (base model)", mde_state: "NOT_REACHABLE" },
  openness: { n: 32, distinct_items: 32, separation: "TIE", leader: "gemma3:12b (base model)", mde_state: "MEASURED" },
  "machinery-conformity": {
    n: 33,
    distinct_items: 33,
    separation: "UNTESTED",
    public_leader_state: "NO_SIGNED_CARD",
    mde_state: "MEASURED",
  },
  care: { n: 199, distinct_items: 199, separation: "TIE", leader: "qwen2.5:0.5b-instruct (base model)", mde_state: "MEASURED" },
  "cross-reality": {
    n: 32,
    distinct_items: 32,
    separation: "UNTESTED",
    public_leader_state: "NO_SIGNED_CARD",
    mde_state: "MEASURED",
  },
  "detector-interop": {
    n: 33,
    distinct_items: 33,
    separation: "UNTESTED",
    public_leader_state: "NO_SIGNED_CARD",
    mde_state: "NOT_REACHABLE",
  },
  "art5-safeguard": {
    n: 36,
    distinct_items: 36,
    separation: "UNTESTED",
    public_leader_state: "EXCLUDED_OWN_MODEL",
    mde_state: "NOT_REACHABLE",
  },
  swarm: { n: 37, distinct_items: 37, separation: "UNTESTED", leader: "qwen2.5:7b (base model)", mde_state: "UNMEASURED" },
  affect: {
    n: 41,
    distinct_items: 41,
    separation: "UNTESTED",
    public_leader_state: "EXCLUDED_OWN_MODEL",
    mde_state: "MEASURED",
  },
  jail: {
    n: 71,
    distinct_items: 27,
    separation: "UNTESTED",
    leader: "qwen2.5:0.5b-instruct (base model)",
    mde_state: "UNMEASURED",
  },
};

const EXPECTED_DETERMINISTIC_FACTS: Record<
  string,
  { family: "gspc" | "financial"; n: number; evidence_url: string; run_attestation: string }
> = {
  "effect-binding": {
    family: "gspc",
    n: 261,
    evidence_url: "/interop/effect-binding-server-probe-2026-09-22.signed.json",
    run_attestation: "ED25519_SIGNED",
  },
  "provenance-controls": {
    family: "financial",
    n: 6,
    evidence_url: "/interop/financial-measure-run-v2.json",
    run_attestation: "ED25519_SIGNED",
  },
  "reserve-attestation": {
    family: "financial",
    n: 16,
    evidence_url: "/interop/financial-measure-run-reserve-attestation.json",
    run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
  },
  "regulatory-framework": {
    family: "financial",
    n: 16,
    evidence_url: "/interop/financial-measure-run-regulatory-framework.json",
    run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
  },
  "distribution-integrity": {
    family: "financial",
    n: 16,
    evidence_url: "/interop/financial-measure-run-distribution-integrity.json",
    run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
  },
  "custody-disclosure": {
    family: "financial",
    n: 16,
    evidence_url: "/interop/financial-measure-run-custody-disclosure.json",
    run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
  },
  "ai-adoption-components": {
    family: "financial",
    n: 2,
    evidence_url: "/interop/financial-measure-run-ai-adoption-components.json",
    run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
  },
  "labour-components": {
    family: "financial",
    n: 2,
    evidence_url: "/interop/financial-measure-run-labour-components.json",
    run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
  },
  "humanoid-labour-index": {
    family: "financial",
    n: 8,
    evidence_url: "/interop/financial-measure-run-humanoid-labour-index.json",
    run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
  },
};

const EXPECTED_SUBJECT_SLOTS = [
  "lab-practice",
  "company-practice",
  "measurer-integrity",
  "harness-fidelity",
  "interop-conformance",
  "humanoid-deployment",
  "regulator-transparency",
  "interpretability-reproducibility",
  "claim-maintenance",
  "serving-fidelity",
] as const;

describe("GSPC all-33-axes full-depth audit & cross-surface parity", () => {
  let board: Record<string, any>;
  beforeAll(async () => {
    board = await invokeGspc();
  });

  it("GET /api/gspc serves all 33 canonical axes in order with zero own-model leakage", async () => {
    const axes = board.axes as Array<Record<string, any>>;
    expect(axes.map((a) => a.axis)).toEqual([...CANONICAL_33_AXES]);
    expect(board.totals.axes).toBe(33);
    expect(board.totals.quotable_axes).toBe(23);
    expect(board.totals.measured_axes).toBe(23);
    expect(board.totals.unmeasured_axes).toBe(10);
    expect(board.totals.comparison_axes).toBe(14);
    expect(board.totals.separated_leads).toBe(0);
    expect(board.totals.ties).toBe(7);
    expect(board.totals.untested_separations).toBe(7);
    expect(board.totals.fact_runs).toBe(9);
    expect([...collectOwnModelIdentifiers(board)]).toEqual([]);
  });

  for (const [axisName, expected] of Object.entries(EXPECTED_MODEL_COMPARISON)) {
    it(`model-comparison axis '${axisName}' satisfies board, separation, power, and badge invariants`, async () => {
      const row = (board.axes as Array<Record<string, any>>).find((a) => a.axis === axisName)!;
      expect(row).toBeDefined();
      expect(row.family).toBe("gspc");
      expect(row.kind).toBe("model-comparison");
      expect(row.status).toBe("MEASURED");
      expect(row.n).toBe(expected.n);
      expect(row.distinct_items).toBe(expected.distinct_items);
      expect(row.separation).toBe(expected.separation);
      expect(row.mde?.state).toBe(expected.mde_state);
      const t = row.measurement_time?.observed_at ?? row.measurement_time?.observed_on ?? row.measurement_time?.not_after;
      expect(t).toMatch(/^\d{4}-\d{2}-\d{2}/);
      if (expected.leader) {
        expect(row.leader).toBe(expected.leader);
      } else {
        expect(row.leader).toBeUndefined();
        expect(row.public_leader_state).toBe(expected.public_leader_state);
      }

      const badge = await invokeBadge(axisName);
      expect(badge.label).toBe(axisName);
      if (expected.separation === "TIE") {
        expect(badge.state).toBe("measured");
        expect(badge.color).toBe("#65a30d");
        expect(badge.message).toBe(`measured · n=${expected.n}`);
      } else {
        expect(badge.state).toBe("untested");
        expect(badge.color).toBe("#ca8a04");
        expect(badge.message).toBe(`untested · n=${expected.n}`);
      }
    });
  }

  for (const [axisName, expected] of Object.entries(EXPECTED_DETERMINISTIC_FACTS)) {
    it(`deterministic-facts axis '${axisName}' satisfies board, evidence artifact, and badge invariants`, async () => {
      const row = (board.axes as Array<Record<string, any>>).find((a) => a.axis === axisName)!;
      expect(row).toBeDefined();
      expect(row.family).toBe(expected.family);
      expect(row.kind).toBe("deterministic-facts");
      expect(row.status).toBe("MEASURED");
      expect(row.n).toBe(expected.n);
      expect(row.evidence_url).toBe(expected.evidence_url);
      expect(row.run_attestation).toBe(expected.run_attestation);
      expect(row.leader).toBeUndefined();
      expect(row.accuracy).toBeUndefined();
      expect(row.separation).toBeUndefined();
      expect(row.measurement_time?.observed_at).toMatch(/^\d{4}-\d{2}-\d{2}/);

      const evidencePath = new URL(`../../public${expected.evidence_url}`, import.meta.url);
      expect(existsSync(evidencePath)).toBe(true);

      if (expected.family === "financial") {
        const finEntry = (FINANCIAL_FACTS_AS_OF.axes as Record<string, any>)[axisName];
        expect(finEntry).toBeDefined();
        const finFactsPath = new URL("../../public/interop/financial-facts-as-of.json", import.meta.url);
        const finFactsDoc = JSON.parse(readFileSync(finFactsPath, "utf8"));
        expect(finEntry).toEqual(finFactsDoc.axes[axisName]);
        const runPath = new URL(`../../public${finEntry.evidence_url}`, import.meta.url);
        const runDoc = JSON.parse(readFileSync(runPath, "utf8"));
        expect(runDoc.n).toBe(expected.n);
        expect(finEntry.as_of).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(runDoc.as_of).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(finEntry.status).toBe(runDoc.status);
      }

      const badge = await invokeBadge(axisName);
      expect(badge).toMatchObject({
        label: axisName,
        state: "measured",
        color: "#65a30d",
        message: `measured · n=${expected.n}`,
      });
    });
  }

  for (const axisName of EXPECTED_SUBJECT_SLOTS) {
    it(`subject declared-slot axis '${axisName}' satisfies board, visibility, and badge invariants`, async () => {
      const row = (board.axes as Array<Record<string, any>>).find((a) => a.axis === axisName)!;
      expect(row).toBeDefined();
      expect(row.family).toBe("subject");
      expect(row.kind).toBe("declared-slot");
      expect(row.status).toBe("UNMEASURED");
      expect(row.n).toBe(0);
      expect(typeof row.applies_to).toBe("string");
      expect(row.applies_to.length).toBeGreaterThan(0);
      expect(typeof row.note).toBe("string");
      expect(row.leader).toBeUndefined();
      expect(row.accuracy).toBeUndefined();
      expect(row.separation).toBeUndefined();
      if (axisName === "regulator-transparency") {
        expect(row.public_pages).toBe("HIDDEN_PENDING_OWNER_GO");
      }
      if (axisName === "serving-fidelity") {
        expect(row.method).toBe("serving-fidelity v0.2");
        expect(row.method_sha).toBe("18206f71");
      }

      const badge = await invokeBadge(axisName);
      expect(badge).toMatchObject({
        label: axisName,
        state: "unmeasured",
        color: "#9ca3af",
        message: "unmeasured",
      });
    });
  }

  it("GET /api/reports agrees with GET /api/gspc on all 33 axes and leaks zero own-model names", async () => {
    const rep = await invokeReports();
    expect(rep.totals).toEqual({
      axes: 33,
      measured: 23,
      unmeasured: 10,
      model_comparison_axes: 14,
      separated: 0,
      tie: 7,
      untested: 7,
    });
    expect(rep.separated_axes).toEqual([]);
    expect(rep.unmeasured_axes).toEqual([...EXPECTED_SUBJECT_SLOTS]);
    expect(rep.measured_on.model).not.toContain("DERIVED at serve time");
    expect([...collectOwnModelIdentifiers(rep)]).toEqual([]);
  });

  it("public/reports/index.json indexes all 33 slots across all three kinds", () => {
    expect(reportsIndex.counts.axes).toBe(33);
    expect(reportsIndex.counts.axes_by_kind).toEqual({
      "model-comparison": 14,
      "deterministic-facts": 9,
      "declared-slot": 10,
    });
    expect(reportsIndex.axes.map((a: { axis: string }) => a.axis)).toEqual([...CANONICAL_33_AXES]);
  });

  it("GET /api/axis-register reports jail separation as UNTESTED (C-2026-0929-02)", async () => {
    const reg = await invokeAxisRegister();
    const jail = (reg.axes as Array<Record<string, any>>).find((a) => a.axis === "jail");
    expect(jail?.separation).toBe("UNTESTED");
    expect(reg.counting_rule).toContain("UNTESTED since 2026-09-29");
  });

  it("GET /api/state board.by_family partitions all 33 axes into 15 gspc + 8 financial + 10 subject", async () => {
    const st = await invokeState();
    const byFam = st.board.by_family.value;
    expect(byFam.gspc).toMatchObject({ axes: 15, measured: 15 });
    expect(byFam.financial).toMatchObject({ axes: 8, measured: 8 });
    expect(byFam.subject).toMatchObject({ axes: 10, measured: 0 });
    expect(byFam.gspc.axes + byFam.financial.axes + byFam.subject.axes).toBe(33);
  });

  it("functions/mcp/axis-aliases.json resolves all 33 canonical axis IDs", () => {
    const doc = axisAliases as { axes: Record<string, string[]> };
    expect(Object.keys(doc.axes)).toEqual([...CANONICAL_33_AXES]);
    for (const axis of CANONICAL_33_AXES) {
      expect(Array.isArray(doc.axes[axis])).toBe(true);
      expect(doc.axes[axis]).toContain(`gspc-${axis}`);
    }
  });

  it("Council OS client/src/lib/gspcAxes.ts AXES snapshot carries all 33 canonical axes with zero own-model scores", () => {
    expect(OS_AXES.map((a) => a.axis)).toEqual([...CANONICAL_33_AXES]);
    for (const row of OS_AXES) {
      expect(row.seat).toBeTruthy();
      expect(row.seat).not.toBe("—");
      expect(row.instrument).toBeTruthy();
      expect(row.instrument).not.toBe("—");
      expect(row.separation).not.toBe("SEPARATED");
      expect(row.note || "").not.toMatch(/SEPARATED/);
      expect([0.7, 0.781, 0.535, 0.972, 0.878]).not.toContain(row.accuracy);
    }
  });

  it("CARE-PSY-v1 AI psychosis & delusion non-reinforcement bank has n=36 (>=30) and pinned SHA-256", () => {
    expect(psychosisBank.schema).toBe("csoai.gspc-psychosis-delusion-bank/1.0");
    expect(psychosisBank.instrument_id).toBe("CARE-PSY-v1");
    expect(psychosisBank.n_total).toBe(36);
    expect(psychosisBank.n_delusion_pressure).toBe(30);
    expect(psychosisBank.n_benign_control).toBe(6);
    expect(psychosisBank.items).toHaveLength(36);
    expect(psychosisBank.bank_sha256).toBe(
      "bb420eacb612582d079f04513566fe36bb1b92306cab81345f2c0cbbcff6e12e",
    );
  });

  it("GET /api/plugin/platforms includes all 25 AI platform families including antigravity, deepseek, and council-os-web", async () => {
    const res = await (getPluginPlatforms as unknown as (ctx: unknown) => Promise<Response>)({
      request: new Request("https://councilof.ai/api/plugin/platforms"),
      env: {},
    });
    const body = (await res.json()) as Record<string, any>;
    expect(body.totals.platform_families).toBe(25);
    const ids = (body.platforms as Array<{ id: string }>).map((p) => p.id);
    expect(ids).toContain("antigravity");
    expect(ids).toContain("deepseek");
    expect(ids).toContain("council-os-web");
  });

  it("gspc-harvest.mjs signs a valid csoai.evidence-observation/0.1 candidate accepted by POST /api/evidence-intake", async () => {
    const built = await buildSignedCandidateObservation({
      instrumentId: "CARE-PSY-v1",
      instrumentVersion: "1.0.0",
      instrumentDigest: psychosisBank.bank_sha256,
      n: 36,
      correct: 36,
      answered: 36,
      unparsed: 0,
    });
    expect(built.byteLength).toBeLessThanOrEqual(3072);

    const verified = await verifyCandidateForIntake(built.candidate);
    expect(verified).toEqual({ ok: true, sha256: built.candidateSha256 });

    const kvStore = new Map<string, string>();
    const postRes = await (postIntake as unknown as (ctx: unknown) => Promise<Response>)({
      request: new Request("https://councilof.ai/api/evidence-intake", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://councilof.ai",
          authorization: "Bearer test-intake-writer-secret",
        },
        body: JSON.stringify(built.intakeRequest),
      }),
      env: {
        EVIDENCE_INTAKE_WRITER_SECRET: "test-intake-writer-secret",
        LEADS: {
          get: async (k: string) => kvStore.get(k) ?? null,
          put: async (k: string, v: string) => {
            kvStore.set(k, v);
          },
        },
      },
    });
    expect(postRes.status).toBe(202);
    const receipt = (await postRes.json()) as Record<string, any>;
    expect(receipt.schema).toBe("csoai.measurement-intake-receipt/0.1");
    expect(receipt.candidate_signature_verified).toBe(true);
    expect(receipt.stored).toBe(true);
    expect(receipt.state).toBe("AWAITING_OPERATOR_REVIEW");
    expect(receipt.measurement_state).toBe("UNMEASURED");
    expect(receipt.writes_board).toBe(false);
  });

  it("care-article1-open-research-registry-v1.json (v1.2) indexes 18 license-gated open research sources, top-tier 2026 fleet, and 15-triplet disjoint MP-DPO batch", () => {
    const regPath = new URL("../../public/interop/care-article1-open-research-registry-v1.json", import.meta.url);
    expect(existsSync(regPath)).toBe(true);
    const reg = JSON.parse(readFileSync(regPath, "utf8")) as Record<string, any>;
    expect(reg.schema).toBe("csoai.care-article1-open-research-registry/1.2");
    expect(reg.counts).toEqual({
      total_sources: 18,
      training_eligible_permissive: 15,
      eval_only_non_commercial: 2,
      frozen_eval_banks_excluded_from_training: 1,
      top_tier_2026_open_weight_models: 10,
      top_tier_2026_frontier_models: 10,
    });
    expect(reg.disjoint_mp_dpo_batch_summary?.n_triplets).toBe(15);
    expect(reg.disjoint_mp_dpo_batch_summary?.chosen_pass_rate).toBe(1.0);
    expect(reg.disjoint_mp_dpo_batch_summary?.rejected_sycophantic_pass_rate).toBe(0.0);
    expect(reg.disjoint_mp_dpo_batch_summary?.rejected_overrefusal_pass_rate).toBe(0.0);
    expect(reg.meok_multiprospective_routing_architecture?.orthogonal_perspectives).toHaveLength(4);
    expect(reg.registry_sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("gspc-meta-benchmark-and-hf-evidence-v1.json evaluates 12 benchmarks on 6 measurer-integrity predicates and mirrors to spaces/gspc-board/", () => {
    const metaPath = new URL("../../public/interop/gspc-meta-benchmark-and-hf-evidence-v1.json", import.meta.url);
    const hfMirrorPath = new URL("../../spaces/gspc-board/gspc-meta-benchmark-and-hf-evidence-v1.json", import.meta.url);
    expect(existsSync(metaPath)).toBe(true);
    expect(existsSync(hfMirrorPath)).toBe(true);
    const meta = JSON.parse(readFileSync(metaPath, "utf8")) as Record<string, any>;
    const hfMirror = JSON.parse(readFileSync(hfMirrorPath, "utf8")) as Record<string, any>;
    expect(meta.schema).toBe("csoai.gspc-meta-benchmark-and-hf-evidence/1.0");
    expect(meta.evidence_sha256).toBe(hfMirror.evidence_sha256);
    expect(meta.meta_benchmark_comparison?.n_benchmarks_evaluated).toBe(12);
    expect(meta.gamification_arena_city_space_integration?.surfaces?.coliseum_arena?.total_rounds).toBe(4760);
    expect(meta.gamification_arena_city_space_integration?.surfaces?.council_city_simulation?.total_turns).toBe(400);
    expect(meta.gamification_arena_city_space_integration?.surfaces?.academy_hitl_raters?.total_modules).toBe(63);
  });

  it("s1-ipo-measurement-readiness-v1.json maps all 33 canonical GSPC axes to public SEC S-1 / 10-K / 8-K risk factors without vendor permission", () => {
    const s1Path = new URL("../../public/interop/s1-ipo-measurement-readiness-v1.json", import.meta.url);
    expect(existsSync(s1Path)).toBe(true);
    const s1 = JSON.parse(readFileSync(s1Path, "utf8")) as Record<string, any>;
    expect(s1.schema).toBe("csoai.s1-ipo-measurement-readiness/1.0");
    expect(s1.counts?.distinct_gspc_axes_referenced).toBe(33);
    expect(s1.mapped_gspc_axes).toEqual([...CANONICAL_33_AXES].sort());
    expect(s1.permissionless_signal_bulletins).toHaveLength(4);
    for (const b of s1.permissionless_signal_bulletins) {
      expect(b.permission_required).toBe(false);
      expect(b.verify_command).toContain("curl -sS https://councilof.ai/");
    }
    expect(s1.artifact_sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("constitutional-charter-gspc-layer0-crosswalk-v1.json bridges all 22 operational articles, 16 controls (CH-01..CH-16), 52 source articles, 33 GSPC axes, 20 GitHub Layer-0 targets, and 8 Newton reactions", () => {
    const cwPath = new URL("../../public/interop/constitutional-charter-gspc-layer0-crosswalk-v1.json", import.meta.url);
    expect(existsSync(cwPath)).toBe(true);
    const cw = JSON.parse(readFileSync(cwPath, "utf8")) as Record<string, any>;
    expect(cw.schema).toBe("csoai.constitutional-charter-gspc-layer0-crosswalk/1.0");
    expect(cw.pinned_charter_artifacts?.operational_charter_sha256).toBe(
      "3dcf79a7526785324ef15deaa40adabc5e77fbc99c4ebd089309d948c3c3e32e"
    );
    expect(cw.counts).toEqual({
      outside_in_personas_inspected: 5,
      operational_controls_mapped: 16,
      operational_articles_mapped: 22,
      source_charter_articles_indexed: 52,
      distinct_gspc_axes_covered_by_charter: 33,
      external_github_layer0_targets: 20,
      first_principles_precedents: 7,
      newtons_third_law_reactions: 8,
    });
    expect(cw.mapped_gspc_axes).toEqual([...CANONICAL_33_AXES].sort());
    expect(cw.crosswalk_sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("article1-care-open-model-ablation-proof-v1.json proves paired McNemar SEPARATED improvement across all 4 domains (GSPC Care, Real Exams, Real Arenas, Real Games; N=144)", () => {
    const abPath = new URL("../../public/interop/article1-care-open-model-ablation-proof-v1.json", import.meta.url);
    const hfAbPath = new URL("../../spaces/gspc-board/article1-care-open-model-ablation-proof-v1.json", import.meta.url);
    expect(existsSync(abPath)).toBe(true);
    expect(existsSync(hfAbPath)).toBe(true);
    const ab = JSON.parse(readFileSync(abPath, "utf8")) as Record<string, any>;
    const hfAb = JSON.parse(readFileSync(hfAbPath, "utf8")) as Record<string, any>;
    expect(ab.schema).toBe("csoai.article1-care-open-model-ablation-proof/1.0");
    expect(ab.ablation_proof_sha256).toBe(hfAb.ablation_proof_sha256);
    expect(ab.overall_144_item_summary?.n_total).toBe(144);
    expect(ab.overall_144_item_summary?.paired_mcnemar_c_vs_a_raw?.separation_verdict).toBe("SEPARATED");
    expect(ab.overall_144_item_summary?.paired_mcnemar_c_vs_b_naive_filter?.separation_verdict).toBe("SEPARATED");
  });

  it("end-to-end-product-ux-and-pipeline-audit-v1.json verifies all 12 public products, 7 /my-results tabs, 10 free preview doors, and 7 operational pipelines", () => {
    const e2ePath = new URL("../../public/interop/end-to-end-product-ux-and-pipeline-audit-v1.json", import.meta.url);
    const hfE2ePath = new URL("../../spaces/gspc-board/end-to-end-product-ux-and-pipeline-audit-v1.json", import.meta.url);
    expect(existsSync(e2ePath)).toBe(true);
    expect(existsSync(hfE2ePath)).toBe(true);
    const e2e = JSON.parse(readFileSync(e2ePath, "utf8")) as Record<string, any>;
    const hfE2e = JSON.parse(readFileSync(hfE2ePath, "utf8")) as Record<string, any>;
    expect(e2e.schema).toBe("csoai.end-to-end-product-ux-and-pipeline-audit/1.0");
    expect(e2e.audit_sha256).toBe(hfE2e.audit_sha256);
    expect(e2e.counts).toEqual({
      public_products_total: 12,
      public_products_verified_end_to_end: 12,
      my_results_ux_tabs_verified: 7,
      my_results_free_preview_doors_verified: 10,
      operational_pipelines_total: 7,
      operational_pipelines_active: 7,
      competitor_reference_systems_benchmarked: 8,
    });
    expect(e2e.human_end_user_experience_hub?.status).toBe("VERIFIED_END_TO_END");
    expect(e2e.human_end_user_experience_hub?.login_or_email_required).toBe(false);
  });

  it("institutional-underwriter-x402-ras-flywheel-v1.json maps 6 underwriter dimensions, 4 root witnesses, 25 SKUs, 27 x402 doors, 5 Bazaar indexes, and routes all 33 axes to 6 HITL lanes", () => {
    const fwPath = new URL("../../public/interop/institutional-underwriter-x402-ras-flywheel-v1.json", import.meta.url);
    const hfFwPath = new URL("../../spaces/gspc-board/institutional-underwriter-x402-ras-flywheel-v1.json", import.meta.url);
    expect(existsSync(fwPath)).toBe(true);
    expect(existsSync(hfFwPath)).toBe(true);
    const fw = JSON.parse(readFileSync(fwPath, "utf8")) as Record<string, any>;
    const hfFw = JSON.parse(readFileSync(hfFwPath, "utf8")) as Record<string, any>;
    expect(fw.schema).toBe("csoai.institutional-underwriter-x402-ras-flywheel/1.0");
    expect(fw.flywheel_sha256).toBe(hfFw.flywheel_sha256);
    expect(fw.counts).toEqual({
      underwriter_comparison_dimensions: 6,
      external_root_witnesses: 4,
      online_offline_verification_steps: 7,
      sku_manifest_entries: 25,
      x402_described_doors: 27,
      bazaar_and_discovery_indexes: 5,
      hitl_watchdog_routing_lanes: 6,
      canonical_gspc_axes_routed_to_hitl: 33,
      max_observation_capsule_bytes: 3072,
    });
  });

  it("cobol-bridge-iso20022-parity-evidence-v1.json proves n=36 COMP-3 & ISO-20022 parity with exact McNemar SEPARATED improvement and <= 3072-byte Layer-0 capsule", () => {
    const cbPath = new URL("../../public/interop/cobol-bridge-iso20022-parity-evidence-v1.json", import.meta.url);
    const hfCbPath = new URL("../../spaces/gspc-board/cobol-bridge-iso20022-parity-evidence-v1.json", import.meta.url);
    expect(existsSync(cbPath)).toBe(true);
    expect(existsSync(hfCbPath)).toBe(true);
    const cb = JSON.parse(readFileSync(cbPath, "utf8")) as Record<string, any>;
    const hfCb = JSON.parse(readFileSync(hfCbPath, "utf8")) as Record<string, any>;
    expect(cb.schema).toBe("csoai.cobol-bridge-iso20022-parity-evidence/1.0");
    expect(cb.evidence_sha256).toBe(hfCb.evidence_sha256);
    expect(cb.summary?.n_valid).toBe(36);
    expect(cb.summary?.all_negative_controls_failed_as_designed).toBe(true);
    expect(cb.summary?.paired_mcnemar_b_vs_a?.separation_verdict).toBe("SEPARATED");
    expect(cb.sample_3kb_parity_capsule?.capsule_bytes).toBeLessThanOrEqual(3072);
  });

  it("safe-fluid-reverification-daily-signal-v1.json verifies all 5 SAFE result states, 3 watch states, 9 sector domains, and 33 GSPC axes within <= 3072-byte capsules", () => {
    const sfPath = new URL("../../public/interop/safe-fluid-reverification-daily-signal-v1.json", import.meta.url);
    const hfSfPath = new URL("../../spaces/gspc-board/safe-fluid-reverification-daily-signal-v1.json", import.meta.url);
    expect(existsSync(sfPath)).toBe(true);
    expect(existsSync(hfSfPath)).toBe(true);
    const sf = JSON.parse(readFileSync(sfPath, "utf8")) as Record<string, any>;
    const hfSf = JSON.parse(readFileSync(hfSfPath, "utf8")) as Record<string, any>;
    expect(sf.schema).toBe("csoai.safe-fluid-reverification-daily-signal/1.0");
    expect(sf.signal_sha256).toBe(hfSf.signal_sha256);
    expect(sf.counts?.sector_atlas_domains_covered).toBe(9);
    expect(sf.counts?.canonical_gspc_axes_mapped).toBe(33);
    expect(sf.counts?.result_states_demonstrated).toBe(5);
    expect(sf.counts?.watch_states_demonstrated).toBe(3);
    expect(sf.counts?.max_capsule_bytes).toBeLessThanOrEqual(3072);
  });

  it("gspc-live-hf-router-care-psy-v1-run.json records 360 real live Hugging Face Router completions across 5 open-weight models with hf_completion_id and response_sha256", () => {
    const hfRunPath = new URL("../../public/interop/gspc-live-hf-router-care-psy-v1-run.json", import.meta.url);
    const hfSpaceRunPath = new URL("../../spaces/gspc-board/gspc-live-hf-router-care-psy-v1-run.json", import.meta.url);
    expect(existsSync(hfRunPath)).toBe(true);
    expect(existsSync(hfSpaceRunPath)).toBe(true);
    const hfRun = JSON.parse(readFileSync(hfRunPath, "utf8")) as Record<string, any>;
    const hfSpaceRun = JSON.parse(readFileSync(hfSpaceRunPath, "utf8")) as Record<string, any>;
    expect(hfRun.schema).toBe("csoai.gspc-live-hf-router-care-psy-v1-run/1.0");
    expect(hfRun.execution_mode).toBe("RUNTIME_OBSERVED_LIVE_HF_ROUTER");
    expect(hfRun.live_run_sha256).toBe(hfSpaceRun.live_run_sha256);
    expect(hfRun.summary?.total_live_hf_http_completions).toBe(360);
    expect(hfRun.external_base_model_runs).toHaveLength(5);
    expect(hfRun.measured_in_lane_article1_care_routed_runs?.runs).toHaveLength(5);
    for (const r of [...hfRun.external_base_model_runs, ...hfRun.measured_in_lane_article1_care_routed_runs.runs]) {
      expect(r.n_valid).toBe(36);
      expect(r.status).toBe("RUNTIME_OBSERVED");
      for (const it of r.items) {
        expect(it.http_status).toBe(200);
        expect(typeof it.hf_completion_id).toBe("string");
        expect(it.hf_completion_id.length).toBeGreaterThan(5);
        expect(it.response_sha256).toMatch(/^[0-9a-f]{64}$/);
      }
    }
  });

  it("gspc-live-hf-14-axes-official-report-v1.json executes all 14 canonical model-comparison axes (885 items x 4 models = 3,540 live HF completions) and mirrors to spaces/gspc-board/", () => {
    const repPath = new URL("../../public/interop/gspc-live-hf-14-axes-official-report-v1.json", import.meta.url);
    const hfRepPath = new URL("../../spaces/gspc-board/gspc-live-hf-14-axes-official-report-v1.json", import.meta.url);
    const rec144Path = new URL("../../public/interop/gspc-live-hf-four-domain-144-receipts.json", import.meta.url);
    expect(existsSync(repPath)).toBe(true);
    expect(existsSync(hfRepPath)).toBe(true);
    expect(existsSync(rec144Path)).toBe(true);
    const rep = JSON.parse(readFileSync(repPath, "utf8")) as Record<string, any>;
    const hfRep = JSON.parse(readFileSync(hfRepPath, "utf8")) as Record<string, any>;
    const rec144 = JSON.parse(readFileSync(rec144Path, "utf8")) as Record<string, any>;
    expect(rep.schema).toBe("csoai.gspc-live-hf-14-axes-official-report/1.0");
    expect(rep.execution_mode).toBe("RUNTIME_OBSERVED_LIVE_HF_ROUTER");
    expect(rep.report_sha256).toBe(hfRep.report_sha256);
    expect(rep.totals?.axes_executed).toBe(14);
    expect(rep.totals?.models_executed).toBe(4);
    expect(rep.totals?.bank_items_per_model).toBe(885);
    expect(rep.totals?.total_live_http_completions).toBe(3540);
    expect(rep.totals?.total_http_200_ok).toBeGreaterThanOrEqual(3500);
    expect(rec144.schema).toBe("csoai.gspc-live-hf-four-domain-144-receipts/1.0");
    expect(rec144.n_items_total).toBe(144);
    expect(rec144.receipts_sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("aligns across all 8 GSPC delivery gates, 6 MEOK completion gates, @csoai/layer0@0.2.1, and Public Watchdog working groups on master", () => {
    const wgCatalogPath = new URL("../../public/working-groups/catalog.json", import.meta.url);
    const wgConfigPath = new URL("../../council-os/working-groups.json", import.meta.url);
    const inspectTaskPath = new URL("../../harness/bench/inspect_task.py", import.meta.url);
    const e2ePlanPath = new URL("../../docs/measurement/GSPC-END-TO-END-EXECUTION-2026-10-30.md", import.meta.url);
    const meokQualPath = new URL("../../docs/measurement/GSPC-MEOK-PRODUCT-QUALIFICATION-2026-10-30.md", import.meta.url);
    const layer0PkgPath = new URL("../../packages/layer0-js/package.json", import.meta.url);
    const myResultsPath = new URL("../../public/my-results/index.html", import.meta.url);

    expect(existsSync(wgCatalogPath)).toBe(true);
    expect(existsSync(wgConfigPath)).toBe(true);
    expect(existsSync(inspectTaskPath)).toBe(true);
    expect(existsSync(e2ePlanPath)).toBe(true);
    expect(existsSync(meokQualPath)).toBe(true);
    expect(existsSync(layer0PkgPath)).toBe(true);
    expect(existsSync(myResultsPath)).toBe(true);

    const layer0Pkg = JSON.parse(readFileSync(layer0PkgPath, "utf8")) as Record<string, any>;
    expect(layer0Pkg.name).toBe("@csoai/layer0");
    expect(layer0Pkg.version).toBe("0.2.1");

    const myResultsHtml = readFileSync(myResultsPath, "utf8");
    expect(myResultsHtml).toContain("Council Space (Council City 40v40 / Coliseum 4,760 Rounds)");
    expect(myResultsHtml).toContain("Universal Public Watchdog Layer-0 Incident Harness (12 Global Databases, n=36)");
    expect(myResultsHtml).not.toContain("Sovereign Space");
  });

  it("universal-watchdog-incident-harness-v1.json measures 12 global incident databases (n=36), Candidate Axis 34 (public-incident-vigilance), and maps all 33 canonical axes to MEOK Specialists + 7 Working Groups + WG-SAFE Charter + 6 HITL lanes", () => {
    const whPath = new URL("../../public/interop/universal-watchdog-incident-harness-v1.json", import.meta.url);
    const hfWhPath = new URL("../../spaces/gspc-board/universal-watchdog-incident-harness-v1.json", import.meta.url);
    expect(existsSync(whPath)).toBe(true);
    expect(existsSync(hfWhPath)).toBe(true);
    const wh = JSON.parse(readFileSync(whPath, "utf8")) as Record<string, any>;
    const hfWh = JSON.parse(readFileSync(hfWhPath, "utf8")) as Record<string, any>;
    expect(wh.schema).toBe("csoai.universal-watchdog-incident-harness/1.0");
    expect(wh.harness_sha256).toBe(hfWh.harness_sha256);
    expect(wh.counts?.global_watchdog_databases_measured).toBe(12);
    expect(wh.counts?.total_watchdog_probes_n).toBe(36);
    expect(wh.candidate_axis_34_public_incident_vigilance?.axis_id).toBe("public-incident-vigilance");
    expect(wh.candidate_axis_34_public_incident_vigilance?.board_admission_state).toBe("CANDIDATE_SLOT_MEASURED_IN_WATCHDOG");
    expect(wh.candidate_axis_34_public_incident_vigilance?.n_valid).toBe(36);
    expect(wh.counts?.canonical_gspc_axes_routed).toBe(33);
    expect(wh.counts?.public_watchdog_working_groups_bound).toBe(7);
    expect(wh.counts?.hitl_steward_lanes_bound).toBe(6);
    expect(wh.daily_gspc_signal_to_wg_safe_consolidation?.sample_3kb_incident_capsule?.within_3kb_budget).toBe(true);
    expect(wh.daily_gspc_signal_to_wg_safe_consolidation?.sample_3kb_incident_capsule?.capsule?.hitl_steward_routing?.writes_board).toBe(false);
    expect(wh.daily_gspc_signal_to_wg_safe_consolidation?.sample_3kb_incident_capsule?.capsule?.hitl_steward_routing?.model_training).toBe(false);
  });

  it("playwright-cypress-inspect-e2e-audit-v1.json verifies Playwright Chromium E2E, Cypress Section 12, window.CSOAI_INSPECT, UK AISI Inspect AI, Offline ZIP Inspector, and 14 byte-identical HF Space mirrors", () => {
    const pciPath = new URL("../../public/interop/playwright-cypress-inspect-e2e-audit-v1.json", import.meta.url);
    const hfPciPath = new URL("../../spaces/gspc-board/playwright-cypress-inspect-e2e-audit-v1.json", import.meta.url);
    expect(existsSync(pciPath)).toBe(true);
    expect(existsSync(hfPciPath)).toBe(true);
    const pci = JSON.parse(readFileSync(pciPath, "utf8")) as Record<string, any>;
    const hfPci = JSON.parse(readFileSync(hfPciPath, "utf8")) as Record<string, any>;
    expect(pci.schema).toBe("csoai.playwright-cypress-inspect-e2e-audit/1.0");
    expect(pci.audit_sha256).toBe(hfPci.audit_sha256);
    expect(pci.counts?.playwright_chromium_e2e_tests_passed).toBe(4);
    expect(pci.counts?.viewports_verified).toBe(2);
    expect(pci.counts?.my_results_tabs_verified).toBe(7);
    expect(pci.counts?.window_csoai_inspect_methods).toBe(7);
    expect(pci.counts?.published_interop_artifacts_verified).toBe(14);
    expect(pci.counts?.hf_space_mirrors_byte_identical).toBe(14);
    expect(pci.browser_devtools_inspect_surface?.status).toBe("VERIFIED_BROWSER_DEVTOOLS_INSPECT_READY");
    expect(pci.playwright_and_cypress_e2e?.playwright_chromium_e2e?.status).toBe("PASSED_HEADLESS_CHROMIUM");
  });
});
