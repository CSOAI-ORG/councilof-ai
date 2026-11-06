import { afterEach, describe, expect, it, vi } from "vitest";
import registry from "./_gspc_research_semantics.json";
import { onRequestGet, validRegistryForTest } from "./research-plan";
import { AXES_A } from "./_gspc_axes_a";
import { AXES_B } from "./_gspc_axes_b";
import { AXES_C } from "./_gspc_axes_c";
import { AXES_FIN } from "./_gspc_axes_fin";
import { AXES_D } from "./_gspc_axes_d";

// Use the board producer's roster. Deriving this fixture from the research registry
// itself hid the live 503 when eleven measured subject axes were added to the board.
const publishedAxes = [...AXES_A, ...AXES_B, ...AXES_C, ...AXES_FIN, ...AXES_D];

function board() {
  const axes: Record<string, unknown>[] = structuredClone(publishedAxes);
  return {
    schema: "csoai.gspc-axes/0.5",
    totals: { axes: axes.length, measured_axes: axes.filter(axis => axis.status === "MEASURED").length },
    axes,
  };
}

function stub(value: unknown = board()) {
  const calls: { method: string; path: string }[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    calls.push({ method: init?.method ?? "GET", path: url.pathname });
    if (value === null) return new Response("down", { status: 503 });
    return Response.json(value);
  }));
  return calls;
}

async function get(path = "/api/research-plan") {
  const response = await onRequestGet({ request: new Request(`https://example.test${path}`) });
  return { response, body: JSON.parse(await response.text()) };
}

afterEach(() => vi.unstubAllGlobals());

describe("GSPC continuous research semantics", () => {
  it("is a complete, unique, authoritative-source registry with safe controls", () => {
    expect(validRegistryForTest(registry)).toBe(true);
    const measuredIds = publishedAxes.filter(axis => axis.status === "MEASURED").map(axis => axis.axis).sort();
    expect(registry.axes.map(axis => axis.axis).sort()).toEqual(measuredIds);
    expect(new Set(registry.axes.map((axis) => axis.axis)).size).toBe(measuredIds.length);
    expect(registry.axes.every((axis) => axis.compound_semantics.length >= 4)).toBe(true);
    expect(registry.axes.every((axis) => axis.implementation.present && axis.implementation.missing)).toBe(true);
    expect(Object.values(registry.sources).every((source) => source.url.startsWith("https://"))).toBe(true);
    expect(registry.controls).toMatchObject({
      read_only: true,
      writes_board: false,
      model_training: false,
      automatic_fixing: false,
      automatic_signing: false,
      automatic_promotion: false,
      candidate_is_measurement: false,
      source_change_is_legal_change: false,
    });
  });

  it("joins every measured live-board row without replacing measurement or separation state", async () => {
    const calls = stub();
    const first = await get();
    const second = await get();
    expect(first.response.status).toBe(200);
    expect(first.body).toEqual(second.body);
    const measured = publishedAxes.filter(axis => axis.status === "MEASURED");
    expect(first.body.measured_axis_count).toBe(measured.length);
    expect(first.body.plans).toHaveLength(measured.length);
    expect(calls.every((call) => call.method === "GET" && call.path === "/api/gspc")).toBe(true);
    expect(first.body.controls.candidate_is_measurement).toBe(false);
    expect(first.body.watch.candidate_submission).toBe("NONE");
    for (const plan of first.body.plans) {
      expect(plan.measurement.classification).toBe("PUBLISHED_BOARD_MEASUREMENT");
      expect(plan.measurement.status).toBe("MEASURED");
      expect(plan.candidate_state).toBe("NO_CANDIDATE_IN_THIS_RESPONSE");
      expect(plan.candidate_is_measurement).toBe(false);
      expect(plan.sources.length).toBeGreaterThan(0);
      expect(plan.controls).toMatchObject({ read_only: true, automatic_signing: false, automatic_promotion: false });
      const published = measured.find(axis => axis.axis === plan.axis)!;
      for (const key of ["kind", "n", "accuracy", "separation", "applies_to", "rate", "rate_scale", "rate_rule", "method_sha", "bank_sha256"] as const) {
        expect(plan.measurement[key]).toEqual(published[key]);
      }
    }
    expect(first.body.plans.some((plan: any) => plan.measurement.separation === "TIE")).toBe(true);
    expect(first.body.plans.some((plan: any) => plan.measurement.separation === "UNTESTED")).toBe(true);
    expect(first.body.plans.filter((plan: any) => plan.measurement.kind === "measured-subject")).toHaveLength(11);
  });

  it("catalogues external methods without enabling watchers or replacing Council constructs", async () => {
    stub();
    const { body } = await get();
    const safety = body.plans.find((plan: any) => plan.axis === "safety");
    expect(safety.human_gate).toMatch(/Practice results are internal only/);
    expect(safety.sources.some((source: any) => source.id === "mlcommons-result-policy")).toBe(true);
    const jail = body.plans.find((plan: any) => plan.axis === "jail");
    expect(jail.human_gate).toMatch(/different construct from escape-attempt detector accuracy/);
    const references = Object.entries(registry.sources).filter(([id]) => id.startsWith("mlcommons-") || id === "safe-reporting-compact");
    expect(references.length).toBeGreaterThan(0);
    for (const [, source] of references) {
      expect(source.watch).toBe(false);
      expect((source as any).boundary).toMatch(/No test execution/);
    }
    const financial = body.plans.filter((plan: any) => plan.measurement.family === "financial");
    expect(financial.every((plan: any) => plan.sources.every((source: any) => !source.id.startsWith("mlcommons-")))).toBe(true);
  });

  it("filters by exact axis and returns an honest 404 for unknown or unmeasured slots", async () => {
    stub();
    const selected = await get("/api/research-plan?axis=effect-binding");
    expect(selected.response.status).toBe(200);
    expect(selected.body.measured_axis_count).toBe(1);
    expect(selected.body.plans[0].axis).toBe("effect-binding");
    expect(selected.body.plans[0].compound_semantics).toContain("request/result binding");
    const missing = await get("/api/research-plan?axis=not-an-axis");
    expect(missing.response.status).toBe(404);
    expect(missing.body.plans).toEqual([]);
  });

  it("fails closed when the board cannot be read or a measured axis has no semantics", async () => {
    stub(null);
    const unavailable = await get();
    expect(unavailable.response.status).toBe(503);
    expect(unavailable.body.measured_axis_count).toBeNull();
    expect(unavailable.body.plans).toEqual([]);

    const expanded = board();
    expanded.axes.push({ ...expanded.axes[0], axis: "new-measured-axis", status: "MEASURED", kind: "deterministic-facts", task: "new task" });
    expanded.totals.axes += 1;
    expanded.totals.measured_axes += 1;
    stub(expanded);
    const unmapped = await get();
    expect(unmapped.response.status).toBe(503);
    expect(unmapped.body.errors).toEqual(["RESEARCH_SEMANTICS_MISSING:new-measured-axis"]);
  });

  it("rejects a registry that tries to turn candidate research into an automatic board action", () => {
    const unsafe = structuredClone(registry) as any;
    unsafe.controls.automatic_promotion = true;
    expect(validRegistryForTest(unsafe)).toBe(false);
    const missingSource = structuredClone(registry) as any;
    missingSource.axes[0].source_ids = ["invented-source"];
    expect(validRegistryForTest(missingSource)).toBe(false);
  });

  it("retains public reference restrictions without leaking arbitrary source fields or implying a configured watch", async () => {
    const plan = registry.axes[0];
    const sources = registry.sources as Record<string, Record<string, unknown>>;
    const snapshots = plan.source_ids.map(id => [id, structuredClone(sources[id])] as const);
    try {
      for (const id of plan.source_ids) {
        Object.assign(sources[id], {
          watch: false, reviewed_on: "2026-11-06", boundary: "Practice outputs stay internal.",
          rights_url: "https://example.test/terms", version: "1.4", license: "Declared terms",
          private_note: "fixture-private-value", automatic_submission: true,
        });
      }
      stub();
      const { response, body } = await get(`/api/research-plan?axis=${plan.axis}`);
      expect(response.status).toBe(200);
      expect(body.plans[0].research_state).toBe("REFERENCE_ONLY");
      expect(body.plans[0].sources[0]).toMatchObject({
        watch: false, reviewed_on: "2026-11-06", boundary: "Practice outputs stay internal.",
        rights_url: "https://example.test/terms", version: "1.4", license: "Declared terms",
      });
      expect(JSON.stringify(body)).not.toContain("fixture-private-value");
      expect(body.plans[0].sources[0]).not.toHaveProperty("automatic_submission");
      expect(body.controls.candidate_is_measurement).toBe(false);
      expect(body.watch.candidate_submission).toBe("NONE");
    } finally {
      for (const [id, original] of snapshots) sources[id] = original;
    }
  });
});
