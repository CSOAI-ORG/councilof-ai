import { afterEach, describe, expect, it, vi } from "vitest";

import { onRequestGet } from "./learning-scenarios";

const CARD = "a".repeat(64);
const CANONICAL_AXES = [
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
  "provenance-controls",
  "reserve-attestation",
  "regulatory-framework",
  "distribution-integrity",
  "custody-disclosure",
  "ai-adoption-components",
  "labour-components",
  "humanoid-labour-index",
];

function board() {
  const axes = CANONICAL_AXES.map((axis, index) => ({
    axis,
    family: index < 14 ? "gspc" : "financial",
    kind: index < 14 ? "model-comparison" : "deterministic-facts",
    bench: `${axis} bench`,
    task: `${axis} task`,
    n: index + 1,
    status: "MEASURED",
    ...(axis === "governance" ? { fleet_mean: 0.49 } : {}),
  }));
  return {
    schema: "csoai.gspc-axes/0.5",
    measured_on: { date: "2026-08-18" },
    totals: { axes: axes.length, measured_axes: axes.length },
    axes,
  };
}

const POINTER = {
  regulator: "eu-ai-act",
  regulator_name: "EU AI Act",
  relation: "relevant-to",
  obligation: "Article 9 risk management",
  statutory_maximum: "statutory maximum",
  fine_cited_to: "Article 99(4)",
  fine_applies_to: "the obligation",
  tier: "most_obligations_incl_art50_and_gpai",
  no_fine_asserted_owed: true,
};

function findings(
  measurementOverrides: Record<string, unknown> = {},
  findingOverrides: Record<string, unknown> = {},
) {
  return {
    schema: "csoai.regulation-findings-index/0.2",
    as_of: "2026-08-19T09:24:39.000Z",
    counts: { findings: 1, legacy_unadjudicated_records: 1066 },
    axes: [
      { axis: "gspc-governance", pointers: [POINTER] },
      { axis: "jail-escape-detection", pointers: [POINTER] },
    ],
    findings: [
      {
        model: "example/model@revision",
        axis: "gspc-governance",
        measurement: {
          accuracy: 0.42,
          status: "DISCOVERED",
          card: CARD,
          card_url: `/signed/cards/${CARD}.json`,
          signed: true,
          signature_verified: true,
          admitted: true,
          evidence_state: "ADMITTED_VERIFIED",
          measured_on: "2026-08-19T09:24:39.000Z",
          ...measurementOverrides,
        },
        crosswalk: { pointers: [POINTER] },
        ...findingOverrides,
      },
    ],
  };
}

const regulation = {
  schema: "csoai.regulation-deadlines/0.1",
  verified_as_of: "2026-08-19",
  deadlines: [
    {
      date: "2026-12-02",
      instrument: "EU AI Act Art 50(2)",
      what: "Marking grace ends",
      basis: "Article 111(4)",
      status: "UPCOMING",
      penalty_exposure: "statutory maximum",
    },
  ],
};

function stub(
  sources: { board?: unknown; findings?: unknown; regulation?: unknown } = {},
) {
  const calls: { method: string; path: string }[] = [];
  const values: Record<string, unknown> = {
    "/api/gspc": sources.board === undefined ? board() : sources.board,
    "/signed/findings_index.json":
      sources.findings === undefined ? findings() : sources.findings,
    "/api/regulation":
      sources.regulation === undefined ? regulation : sources.regulation,
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url,
      );
      calls.push({ method: init?.method ?? "GET", path: url.pathname });
      const value = values[url.pathname];
      return value === null
        ? new Response("unavailable", { status: 503 })
        : Response.json(value);
    }),
  );
  return calls;
}

async function get(path = "/api/learning-scenarios") {
  const response = await onRequestGet({
    request: new Request(`https://example.test${path}`),
  });
  return { response, text: await response.text() };
}

afterEach(() => vi.unstubAllGlobals());

describe("GET /api/learning-scenarios", () => {
  it("builds deterministic 22-axis scenarios without collapsing evidence classes", async () => {
    const calls = stub();
    const first = await get();
    const second = await get();
    expect(first.response.status).toBe(200);
    expect(first.text).toBe(second.text);
    expect(calls.every((call) => call.method === "GET")).toBe(true);
    const body = JSON.parse(first.text);
    expect(body.canonical_axis_count).toBe(22);
    expect(body.scenario_count).toBe(22);
    expect(body.policy).toMatchObject({
      read_only: true,
      writes_board: false,
      model_training: false,
      automatic_fixing: false,
      automatic_promotion: false,
    });

    const governance = body.scenarios.find(
      (scenario: any) => scenario.axis === "governance",
    );
    expect(governance.board_measurement).toMatchObject({
      classification: "BOARD_MEASUREMENT_CONTEXT",
      status: "MEASURED",
      fleet_mean: 0.49,
    });
    expect(governance.evidence.admitted_measurements).toEqual([
      expect.objectContaining({
        classification: "ADMITTED_EVIDENCE",
        state: "ADMITTED_VERIFIED",
        card: CARD,
        accuracy: 0.42,
      }),
    ]);
    expect(governance.evidence.candidate_findings).toEqual([
      expect.objectContaining({
        classification: "CANDIDATE_FINDING",
        state: "CANDIDATE_FINDING",
        legal_review_required: true,
        writes_board: false,
      }),
    ]);
    expect(governance.regulation_context).toMatchObject({
      classification: "REGULATION_CONTEXT",
      state: "CROSSWALK_POINTERS",
      source_axis: "gspc-governance",
      match: "PREFIXED_EXACT",
    });
    expect(governance.regulation_context.pointers[0].relation).toBe(
      "relevant-to",
    );
    expect(
      governance.regulation_context.pointers[0].no_fine_asserted_owed,
    ).toBe(true);

    const safety = body.scenarios.find(
      (scenario: any) => scenario.axis === "safety",
    );
    expect(safety.evidence.admitted_state).toBe("NONE_ADMITTED");
    expect(safety.evidence.candidate_state).toBe("NO_CANDIDATE_FINDING");
    expect(body.regulation_context[0]).toMatchObject({
      classification: "REGULATION_CONTEXT",
      source: "/api/regulation",
      date: "2026-12-02",
    });
    expect(first.text).not.toContain("auto-train");
    expect(first.text).not.toContain("auto-fix");
  });

  it("uses only declared irregular aliases and never fuzzy-maps an unknown axis", async () => {
    stub();
    const { text } = await get();
    const body = JSON.parse(text);
    const jail = body.scenarios.find(
      (scenario: any) => scenario.axis === "jail",
    );
    expect(jail.regulation_context).toMatchObject({
      source_axis: "jail-escape-detection",
      match: "DECLARED_ALIAS",
    });
    const detector = body.scenarios.find(
      (scenario: any) => scenario.axis === "detector-interop",
    );
    expect(detector.regulation_context).toMatchObject({
      state: "UNMAPPED",
      source_axis: null,
    });
    expect(detector.regulation_context.pointers).toEqual([]);
  });

  it("accepts an admitted mill card on the exact board axis without inventing a crosswalk", async () => {
    const millCard = "b".repeat(64);
    stub({
      findings: findings(
        {
          card: millCard,
          card_url: `/interop/mill-cards-signed/signed-openness-${millCard.slice(0, 12)}.json`,
        },
        { axis: "openness", crosswalk: { pointers: [] } },
      ),
    });
    const { response, text } = await get();
    expect(response.status).toBe(200);
    const openness = JSON.parse(text).scenarios.find(
      (scenario: any) => scenario.axis === "openness",
    );
    expect(openness.evidence.admitted_measurements).toEqual([
      expect.objectContaining({
        card: millCard,
        state: "ADMITTED_VERIFIED",
        source_axis: "openness",
      }),
    ]);
    expect(openness.evidence.candidate_state).toBe("NO_CANDIDATE_FINDING");
    expect(openness.evidence.candidate_findings).toEqual([]);
  });

  it("fails closed when a signature is present without independent admission", async () => {
    stub({
      findings: findings({
        admitted: false,
        evidence_state: "LEGACY_UNADJUDICATED",
      }),
    });
    const { response, text } = await get();
    expect(response.status).toBe(503);
    expect(JSON.parse(text)).toMatchObject({
      state: "UNCHECKABLE",
      errors: ["FINDINGS_SOURCE_UNAVAILABLE_OR_INVALID"],
      scenario_count: 0,
      scenarios: [],
      model_training: false,
      automatic_fixing: false,
    });
  });

  it("fails closed when any source is unavailable or the board is not the 22-axis canon", async () => {
    stub({
      regulation: null,
      board: { ...board(), axes: board().axes.slice(0, 21) },
    });
    const { response, text } = await get();
    expect(response.status).toBe(503);
    const body = JSON.parse(text);
    expect(body.errors).toEqual([
      "GSPC_SOURCE_UNAVAILABLE_OR_INVALID",
      "REGULATION_SOURCE_UNAVAILABLE_OR_INVALID",
    ]);
    expect(body.scenarios).toEqual([]);
  });

  it("filters by exact axis and returns 404 instead of guessing", async () => {
    stub();
    const selected = await get("/api/learning-scenarios?axis=care");
    expect(selected.response.status).toBe(200);
    expect(JSON.parse(selected.text)).toMatchObject({
      canonical_axis_count: 22,
      scenario_count: 1,
    });
    const missing = await get("/api/learning-scenarios?axis=Care");
    expect(missing.response.status).toBe(404);
    expect(JSON.parse(missing.text).scenarios).toEqual([]);
  });
});
