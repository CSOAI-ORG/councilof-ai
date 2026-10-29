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
        const runPath = new URL(`../../public${finEntry.evidence_url}`, import.meta.url);
        const runDoc = JSON.parse(readFileSync(runPath, "utf8"));
        expect(finEntry.n).toBe(runDoc.n);
        expect(finEntry.as_of).toBe(runDoc.as_of);
        expect(finEntry.status).toBe(runDoc.status);
        expect(finEntry.tally).toEqual(runDoc.tally ?? {});
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
});
