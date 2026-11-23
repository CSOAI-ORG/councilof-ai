import { describe, expect, it } from "vitest";
import { AXES_A } from "./_gspc_axes_a";
import { onRequestGet } from "./gspc";

// C-2026-1120-02, first open item: "The board's governance row still describes the task as EU AI
// Act risk-tier classification and states no limit. The limit recorded here is owed on the row
// itself." The row states it twice: as its own field, served as axes[governance].limit and printed
// on /axis/governance, and inside the row's own note. The public view rewrites axes[].note for this
// axis from the per-item rows and serves the row's own note as historical_measurement_record.note.
const LIMIT_ID = "C-2026-1120-02";
const LIMIT_FIGURE = /\b225 of 237\b/;

type Row = { axis: string; limit?: unknown };

async function served(search = ""): Promise<{ axes: Row[] }> {
  (globalThis as unknown as { caches: unknown }).caches = {
    default: { match: async () => undefined, put: async () => undefined },
  };
  const res = await onRequestGet({
    request: new Request("https://councilof.ai/api/gspc" + search),
    env: {},
    waitUntil: () => undefined,
  } as unknown as Parameters<typeof onRequestGet>[0]);
  return (await res.json()) as { axes: Row[] };
}

describe("governance row: the C-2026-1120-02 limit", () => {
  it("the row's note cites C-2026-1120-02 and the 225-of-237 wording-only result, and the served row carries both", async () => {
    const row = AXES_A.find((a) => a.axis === "governance");
    expect(row).toBeDefined();
    expect(row?.note).toContain(LIMIT_ID);
    expect(row?.note).toMatch(LIMIT_FIGURE);

    const gov = (await served()).axes.find((a) => a.axis === "governance");
    expect(gov).toBeDefined();
    const text = JSON.stringify(gov);
    expect(text).toContain(LIMIT_ID);
    expect(text).toMatch(LIMIT_FIGURE);
  });

  it("GET /api/gspc serves axes[governance].limit citing C-2026-1120-02 and 225 of 237, on the whole board and on ?axis=governance", async () => {
    for (const search of ["", "?axis=governance"]) {
      const gov = (await served(search)).axes.find((a) => a.axis === "governance");
      expect(gov, search || "whole board").toBeDefined();
      expect(typeof gov?.limit, search || "whole board").toBe("string");
      expect(gov?.limit).toContain(LIMIT_ID);
      expect(gov?.limit).toMatch(LIMIT_FIGURE);
    }
  });

  it("limit is on governance and on the eleven subject rows held by G8, and absent (not empty) on every other row", async () => {
    const { axes } = await served();
    expect(axes.length).toBeGreaterThan(1);
    // Until 2026-11-22 the key was on governance alone. The owner's G8 ruling of 2026-11-21 added the
    // ten held subject axes (C-2026-1120-01) and claim-maintenance (C-2026-1120-03); their limits are
    // held by gspc.held-subject-limits.test.ts. Board order.
    expect(axes.filter((a) => Object.prototype.hasOwnProperty.call(a, "limit")).map((a) => a.axis)).toEqual([
      "governance",
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
      "watchdog-ingest",
    ]);
    for (const a of axes.filter((r) => Object.prototype.hasOwnProperty.call(r, "limit"))) {
      expect(String(a.limit ?? "").trim().length, a.axis).toBeGreaterThan(0);
    }
  });
});
