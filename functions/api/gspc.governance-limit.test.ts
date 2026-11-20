import { describe, expect, it } from "vitest";
import { AXES_A } from "./_gspc_axes_a";
import { onRequestGet } from "./gspc";

// C-2026-1120-02, first open item: "The board's governance row still describes the task as EU AI
// Act risk-tier classification and states no limit. The limit recorded here is owed on the row
// itself." The row's own note states it. The public view rewrites axes[].note for this axis from
// the per-item rows and serves the row's own note as historical_measurement_record.note, so the
// served half of this test reads the whole served row, not one field.
const LIMIT_ID = "C-2026-1120-02";
const LIMIT_FIGURE = /\b225 of 237\b/;

describe("governance row: the C-2026-1120-02 limit", () => {
  it("the row's note cites C-2026-1120-02 and the 225-of-237 wording-only result, and the served row carries both", async () => {
    const row = AXES_A.find((a) => a.axis === "governance");
    expect(row).toBeDefined();
    expect(row?.note).toContain(LIMIT_ID);
    expect(row?.note).toMatch(LIMIT_FIGURE);

    (globalThis as unknown as { caches: unknown }).caches = {
      default: { match: async () => undefined, put: async () => undefined },
    };
    const res = await onRequestGet({
      request: new Request("https://councilof.ai/api/gspc"),
      env: {},
      waitUntil: () => undefined,
    } as unknown as Parameters<typeof onRequestGet>[0]);
    const body = (await res.json()) as { axes: Array<{ axis: string }> };
    const served = body.axes.find((a) => a.axis === "governance");
    expect(served).toBeDefined();
    const text = JSON.stringify(served);
    expect(text).toContain(LIMIT_ID);
    expect(text).toMatch(LIMIT_FIGURE);
  });
});
