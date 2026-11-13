import { afterEach, describe, expect, it, vi } from "vitest";
import registry from "./_gspc_research_semantics.json";
import { onRequestGet, validRegistryForTest } from "./research-plan";

function board() {
  const axes = registry.axes.map(({ axis }, index) => ({
    axis,
    status: "MEASURED",
    kind: index < 14 ? "model-comparison" : "deterministic-facts",
    family: axis === "effect-binding" || index < 14 ? "gspc" : "financial",
    task: `${axis} published task`,
    n: index + 30,
    ...(index < 14 ? { separation: index < 7 ? "TIE" : "UNTESTED" } : {}),
    measurement_time: { state: "DAY", observed_on: "2026-08-12" },
  }));
  return {
    schema: "csoai.gspc-axes/0.5",
    totals: { axes: axes.length, measured_axes: axes.length },
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
    expect(registry.axes).toHaveLength(23);
    expect(new Set(registry.axes.map((axis) => axis.axis)).size).toBe(23);
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
    expect(first.body.measured_axis_count).toBe(23);
    expect(first.body.plans).toHaveLength(23);
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
    }
    expect(first.body.plans[0].measurement.separation).toBe("TIE");
    expect(first.body.plans[7].measurement.separation).toBe("UNTESTED");
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
    expanded.axes.push({ axis: "new-measured-axis", status: "MEASURED", kind: "deterministic-facts", task: "new task" });
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
});
