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
  public_leader_count: number;
  fact_runs: number;
  lid: string;
};

/** The four numbers the lid states, by the noun each one is attached to. */
export function lidNumbers(lid: string): Record<string, number | null> {
  const read = (re: RegExp) => {
    const m = lid.match(re);
    return m ? Number(m[1]) : null;
  };
  return {
    measured_axes: read(/(\d+)\s+axes?\s+measured\b/i),
    model_fleets: read(/(\d+)\s+model\s+fleets?\b/i),
    public_leader_count: read(/(\d+)\s+public\s+leader\s+scores?\b/i),
    fact_runs: read(/(\d+)\s+fact\s+runs?\b/i),
  };
}

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
    for (const field of ["measured_axes", "model_fleets", "public_leader_count", "fact_runs"] as const) {
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
      lidNumbers("7 axes measured · 2 model fleets · 5 public leader scores · 4 fact runs · TIE is TIE."),
    ).toEqual({ measured_axes: 7, model_fleets: 2, public_leader_count: 5, fact_runs: 4 });
  });

  it("catches the exact 2026-09-22 defect: lid says 8 fact runs, totals says 9", () => {
    const drifted = lidNumbers(
      "23 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certificate.",
    );
    expect(drifted.fact_runs).toBe(8);
    expect(drifted.fact_runs).not.toBe(9);
  });

  for (const field of ["measured_axes", "model_fleets", "public_leader_count", "fact_runs"] as const) {
    it(`lid's ${field} equals totals.${field}`, () => {
      expect(lidNumbers(totals.lid)[field]).toBe(totals[field]);
    });
  }

  it("the lid keeps its non-numeric promises", () => {
    expect(totals.lid).toContain("TIE is TIE");
    expect(totals.lid).toContain("not a certificate");
  });
});
