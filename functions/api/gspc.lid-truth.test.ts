import { beforeAll, describe, expect, it } from "vitest";
import { onRequestGet } from "./gspc";

/**
 * G-3 (2026-09-22). GET /api/gspc served, on one object:
 *
 *   "fact_runs": 9,
 *   "lid": "23 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · …"
 *
 * The lid is the single line the estate asks readers to quote verbatim (openapi
 * x-guidance: "quote totals.lid verbatim, never compose a count"), so a wrong number in
 * it propagates to the README badge, the org card, the HF card and every citation.
 *
 * The cause was two derivations of one quantity: totals.fact_runs counted every
 * deterministic-facts axis, while the lid counted only the FINANCIAL family. They agreed
 * until ADR-002 moved effect-binding to a deterministic-facts run in the GSPC family.
 *
 * This test re-parses the served lid and checks each of its four numbers against the
 * totals field that publishes the same quantity. It reads the payload, never the source,
 * so it stays true however the lid is composed.
 */

type Totals = {
  measured_axes: number;
  model_fleets: number;
  separated_leads: number;
  public_leader_count: number;
  fact_runs: number;
  comparison_axes: number;
  ties: number;
  untested_separations: number;
  separation_public_count: string;
  count_grammar: string;
  lid: string;
};

/**
 * The six numbers the lid states, by the noun each one is attached to. Since 30 Sep 2026 the
 * lid uses comparison wording ("14 model comparisons: 0 separated · 7 TIE · 7 UNTESTED") and
 * carries no count of "leaders"; model comparisons publishes the same quantity as model_fleets.
 */
export function lidNumbers(lid: string): Record<string, number | null> {
  const read = (re: RegExp) => {
    const m = lid.match(re);
    return m ? Number(m[1]) : null;
  };
  return {
    measured_axes: read(/(\d+)\s+ax(?:is|es)\s+measured\b/i),
    model_fleets: read(/(\d+)\s+model\s+comparisons?\b/i),
    separated_leads: read(/(\d+)\s+separated\b/i),
    ties: read(/(\d+)\s+TIE\b/),
    untested_separations: read(/(\d+)\s+UNTESTED\b/),
    fact_runs: read(/(\d+)\s+fact\s+runs?\b/i),
  };
}

const LID_FIELDS = ["measured_axes", "model_fleets", "separated_leads", "ties", "untested_separations", "fact_runs"] as const;

async function servedTotals(): Promise<Totals> {
  (globalThis as unknown as { caches: unknown }).caches = {
    default: { match: async () => undefined, put: async () => undefined },
  };
  const res = await onRequestGet({
    request: new Request("https://councilof.ai/api/gspc"),
    env: {},
    waitUntil: () => undefined,
  } as unknown as Parameters<typeof onRequestGet>[0]);
  return ((await res.json()) as { totals: Totals }).totals;
}

describe("GET /api/gspc: every number in totals.lid equals the totals field beside it", () => {
  let totals: Totals;
  beforeAll(async () => {
    totals = await servedTotals();
  });

  it("serves a lid and the four counts this guard reads (not a vacuous pass)", () => {
    expect(typeof totals.lid).toBe("string");
    expect(totals.lid.length).toBeGreaterThan(20);
    for (const field of LID_FIELDS) {
      expect(typeof totals[field], `totals.${field} must be a number`).toBe("number");
    }
  });

  it("the parser finds all four numbers in the served lid", () => {
    const parsed = lidNumbers(totals.lid);
    for (const [noun, value] of Object.entries(parsed)) {
      expect(value, `lid does not state "${noun}": ${totals.lid}`).not.toBeNull();
    }
  });

  it("the parser is not vacuous — it reads the numbers it is given", () => {
    expect(
      lidNumbers("7 axes measured · 2 model comparisons: 1 separated · 0 TIE · 1 UNTESTED · 4 fact runs · TIE is TIE."),
    ).toEqual({ measured_axes: 7, model_fleets: 2, separated_leads: 1, ties: 0, untested_separations: 1, fact_runs: 4 });
  });

  it("catches the exact 2026-09-22 defect: lid says 8 fact runs, totals says 9", () => {
    const drifted = lidNumbers(
      "23 axes measured · 14 model comparisons: 0 separated · 7 TIE · 7 UNTESTED · 8 fact runs · TIE is TIE · not a certificate.",
    );
    expect(drifted.fact_runs).toBe(8);
    expect(drifted.fact_runs).not.toBe(9);
  });

  for (const field of LID_FIELDS) {
    it(`lid's ${field} equals totals.${field}`, () => {
      expect(lidNumbers(totals.lid)[field]).toBe(totals[field]);
    });
  }

  it("the lid keeps its non-numeric promises", () => {
    expect(totals.lid).toContain("TIE is TIE");
    expect(totals.lid).toContain("not a certificate");
  });

  it("the lid uses comparison wording: no 'leader' and no 'fleets' (30 Sep 2026)", () => {
    expect(totals.lid).not.toMatch(/leader/i);
    expect(totals.lid).not.toMatch(/model fleets/i);
    expect(totals.lid).toMatch(/model comparisons:/);
  });
});

/**
 * D-2026-09-23T03-02. totals could state how many axis carry a RUN and had no field that
 * stated how many can tell two models apart, so every surface quoting the headline
 * inherited the blind spot. The aggregate now sits beside the count, and the three states
 * stay three states.
 */
describe("GET /api/gspc: totals can express the negative, from one derivation", () => {
  let totals: Totals;
  beforeAll(async () => {
    totals = await servedTotals();
  });

  it("carries a separation aggregate beside the measured count", () => {
    expect(typeof totals.separation_public_count).toBe("string");
    expect(totals.separation_public_count).toContain("separated a leader");
    expect(totals.separation_public_count).toContain("TIE");
    expect(totals.separation_public_count).toContain("UNTESTED");
  });

  it("the aggregate states the same three numbers as the tallies beside it", () => {
    expect(totals.separation_public_count).toBe(
      `${totals.separated_leads} of ${totals.comparison_axes} model-comparison ${totals.comparison_axes === 1 ? "axis" : "axes"} separated a leader · ` +
        `${totals.ties} TIE · ${totals.untested_separations} UNTESTED`,
    );
  });

  it("the three separation states account for every model-comparison axis, none folded into another", () => {
    expect(totals.separated_leads + totals.ties + totals.untested_separations).toBe(totals.comparison_axes);
    expect(totals.comparison_axes).toBeGreaterThan(0);
  });

  it("count_grammar carries the negative, not only the count", () => {
    expect(totals.count_grammar).toContain("not a separated leader");
    expect(totals.count_grammar).toContain(totals.separation_public_count);
  });

  it("measured_axes is never quoted as a separation count", () => {
    // the defect this guards: a reader taking "N measured" for "N axes told two models apart"
    expect(totals.measured_axes).not.toBe(totals.separated_leads);
  });
});
