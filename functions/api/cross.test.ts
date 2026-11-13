/**
 * Ratchet: /api/cross maps every board axis whose short code is in THE ONE alias table.
 *
 * WHY. AXIS_LAW is keyed by the board's own short codes ("gov", "art5", "det", "prv", "mach",
 * "mcp", "oss", "agi", "asi", "xr") while GET /api/gspc spells each axis with its canonical id
 * ("governance", "art5-safeguard", "detector-interop", ...). A direct AXIS_LAW[a.axis] lookup
 * therefore matched only the axes whose two spellings happen to coincide ("care", "affect",
 * "swarm"): ten of the thirteen published mappings shipped as "no single governing instrument
 * mapped for this axis". The fix resolves the axis through functions/mcp/axis-aliases.json —
 * THE ONE alias table — so no second spelling table can drift beside it.
 *
 * The board rows here are a fixture, not the live board: the point is that a canonical id
 * resolves to its published mapping, and that an axis with no published mapping still says so.
 */
import { describe, expect, it, afterEach } from "vitest";
import { onRequestGet } from "./cross";
import ALIASES from "../mcp/axis-aliases.json";

/** The canonical board ids that carry a short code the published AXIS_LAW table uses. */
const MAPPED_CANONICAL = [
  "governance",
  "art5-safeguard",
  "detector-interop",
  "provenance",
  "machinery-conformity",
  "conformance",
  "openness",
  "safety",
  "continuity",
  "cross-reality",
  "care",
  "affect",
  "swarm",
];

/** An axis the alias table knows but the published mapping does not cover. */
const UNMAPPED_CANONICAL = "jail";

const board = {
  axes: [...MAPPED_CANONICAL, UNMAPPED_CANONICAL].map((axis, i) => ({
    axis,
    leader: `model-${i}`,
    accuracy: 0.5,
    accuracy_is: "point estimate",
    separation: "TIE",
    n: 10,
    status: "MEASURED",
  })),
};

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

async function run(axes = board.axes) {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/api/gspc")) {
      return new Response(JSON.stringify({ axes }), { headers: { "content-type": "application/json" } });
    }
    return new Response(JSON.stringify({ deadlines: [], penalty_tiers_eu_ai_act: null, entries: [] }), {
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  const res = await onRequestGet({
    request: new Request("https://councilof.ai/api/cross"),
    env: {},
    params: {},
    data: {},
    functionPath: "/api/cross",
    waitUntil: () => {},
    passThroughOnException: () => {},
  } as unknown as Parameters<typeof onRequestGet>[0]);
  return res.json() as Promise<{
    schema: string;
    rows: { axis: string; regulation: { obligation?: string; instrument?: string; note?: string } }[];
  }>;
}

describe("/api/cross axis mapping", () => {
  it("resolves every canonical board axis to its published mapping", async () => {
    const body = await run();
    const mapped = body.rows.filter((row) => row.regulation.instrument).map((row) => row.axis);
    expect(mapped.sort()).toEqual([...MAPPED_CANONICAL].sort());
    expect(mapped).toHaveLength(13);
  });

  it("does not invent a mapping for an axis the published table does not cover", async () => {
    const body = await run();
    const row = body.rows.find((r) => r.axis === UNMAPPED_CANONICAL);
    expect(row?.regulation.instrument).toBeUndefined();
    expect(row?.regulation.note).toBe("no single governing instrument mapped for this axis");
  });

  it("keeps the output shape it has always published", async () => {
    const body = await run();
    expect(body.schema).toBe("csoai.cross/0.1");
    expect(body.rows).toHaveLength(MAPPED_CANONICAL.length + 1);
    for (const row of body.rows) {
      expect(Object.keys(row)).toEqual(["axis", "measured_ai", "regulation", "divergence"]);
    }
  });

  it("resolves a short-code spelling to the same mapping", async () => {
    // The board publishes canonical ids; the alias table carries the short codes too. A board
    // row that spells its axis with the short code must resolve to the same published mapping.
    const shortBoard = { axes: [{ ...board.axes[0], axis: "gov" }] };
    const body = await run(shortBoard.axes);
    expect(body.rows[0].regulation.instrument).toBeTruthy();
    expect(body.rows[0].regulation.obligation).toBeTruthy();
  });

  it("keeps THE ONE alias table as the source of the resolution", async () => {
    // Every canonical id the fixture maps must be a key of the alias table the fix reads.
    const table = (ALIASES as { axes: Record<string, string[]> }).axes;
    for (const axis of MAPPED_CANONICAL) {
      expect(Object.keys(table)).toContain(axis);
    }
  });
});
