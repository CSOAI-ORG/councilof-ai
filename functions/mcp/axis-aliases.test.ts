import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ALIASES from "./axis-aliases.json";
import { canonicalAxis, sameAxis } from "./_axis";
import { getAxisTool, listCardsTool } from "./_board";
import { onRequestGet as board } from "../api/gspc";

/**
 * ONE axis alias table, used by every surface that takes an axis name. Found 2026-09-26:
 * `list_cards {"axis":"governance"}` returned [] because the signed card index spells it "gov".
 */
const ROOT = resolve(__dirname, "../..");
const COPIES = ["mcp/gspc-server/axis-aliases.json", "scripts/spray/pypi/csoai-gspc/csoai_gspc/axis_aliases.json"];
const TABLE = (ALIASES as { axes: Record<string, string[]> }).axes;

type BoardAxisRow = {
  axis: string;
  dataset?: string | null;
  facts_as_of?: unknown;
  measurement_time?: { state: string; [key: string]: unknown };
};

async function boardAxes(): Promise<BoardAxisRow[]> {
  // The handler serves through the Workers edge cache; give it an empty one.
  vi.stubGlobal("caches", { default: { match: async () => undefined, put: async () => undefined } });
  const r = await (board as unknown as (c: unknown) => Promise<Response>)({
    request: new Request("https://councilof.ai/api/gspc"),
    env: {},
    params: {},
    waitUntil: () => undefined,
  });
  return ((await r.json()) as { axes: BoardAxisRow[] }).axes;
}

afterEach(() => vi.unstubAllGlobals());

describe("axis-aliases.json — the one table", () => {
  it("every copy (npm, PyPI) is byte-identical to functions/mcp/axis-aliases.json", () => {
    const canonical = readFileSync(resolve(__dirname, "axis-aliases.json"));
    for (const c of COPIES) expect(readFileSync(resolve(ROOT, c)).equals(canonical), c).toBe(true);
  });

  it("every key is a row the board serves, and every board row is a key", async () => {
    const axes = (await boardAxes()).map((a) => a.axis);
    expect(Object.keys(TABLE).sort()).toEqual([...axes].sort());
  });

  it("every board row's own dataset code is an alias of it (the grounded source of 'gov')", async () => {
    for (const a of await boardAxes()) {
      const m = String(a.dataset ?? "").match(/^csoai\/gspc-(.+)$/);
      if (m && m[1] !== a.axis) expect(TABLE[a.axis], a.axis).toContain(m[1]);
    }
  });

  it("no alias names two axes, and none shadows a canonical id", () => {
    const seen = new Map<string, string>();
    for (const [k, v] of Object.entries(TABLE)) {
      for (const a of v) {
        expect(seen.get(a), `${a} is claimed by ${seen.get(a)} and ${k}`).toBeUndefined();
        expect(TABLE[a], `${a} is both an alias and a canonical id`).toBeUndefined();
        seen.set(a, k);
      }
    }
  });

  it("resolves canonical names and aliases case-insensitively; unknown names pass through", () => {
    expect(canonicalAxis("governance")).toBe("governance");
    expect(canonicalAxis("GOV")).toBe("governance");
    expect(canonicalAxis(" Gspc-Governance ")).toBe("governance");
    expect(sameAxis("gov", "gspc-governance")).toBe(true);
    expect(canonicalAxis("arc-30")).toBe("arc-30");
    expect(sameAxis("jail-escape-detection", "jail")).toBe(false);
  });
});

describe("MCP tools accept canonical names and aliases", () => {
  const ORIGIN = "https://councilof.ai";
  const index = {
    n_cards: 3,
    cards: [
      { card: "a".repeat(64), axis: "gov", ts: "2026-08-19T00:00:02Z", signed: true },
      { card: "b".repeat(64), axis: "gspc-governance", ts: "2026-08-19T00:00:01Z", signed: true },
      { card: "c".repeat(64), axis: "care", ts: "2026-08-19T00:00:00Z", signed: true },
    ],
  };
  const stub = () =>
    vi.stubGlobal(
      "fetch",
      vi.fn(async (u: string) => {
        const path = new URL(u).pathname;
        if (path === "/signed/card_index.json") return Response.json(index);
        if (path === "/api/cards") return Response.json({ cards: { count: 3, signed: 3 } });
        if (path === "/api/gspc") return Response.json({ measured_on: "x", axes: [{ axis: "governance", status: "MEASURED" }] });
        return new Response("no", { status: 404 });
      }),
    );

  it("list_cards {axis:'governance'} returns the rows the index spells gov and gspc-governance", async () => {
    stub();
    const out = (await listCardsTool(ORIGIN, { axis: "governance" })) as { rows: { axis: string }[]; axis_query: { index_names_matched: string[] } };
    expect(out.rows.map((r) => r.axis).sort()).toEqual(["gov", "gspc-governance"]);
    expect(out.axis_query.index_names_matched).toEqual(["gov", "gspc-governance"]);
  });

  it("control: the literal-match rule that shipped returns [] for the board's own name", () => {
    const literal = index.cards.filter((r) => r.axis.toLowerCase() === "governance");
    expect(literal).toEqual([]);
  });

  it("get_axis resolves an alias to the board row and says it did", async () => {
    stub();
    const out = (await getAxisTool(ORIGIN, { axis: "GOV" })) as { state: string; axis: string; resolved_from?: string };
    expect(out.state).toBe("LIVE");
    expect(out.axis).toBe("governance");
    expect(out.resolved_from).toBe("GOV");
  });
});

describe("get_axis preserves per-axis measurement-time provenance", () => {
  const ORIGIN = "https://councilof.ai";
  const BOARD_DATES = {
    measured_on: { date: "2026-10-23", note: "mixed board dates, not an axis observation" },
    generated_at: "2026-10-23T07:00:00Z",
  };
  const exact = {
    state: "EXACT",
    precision: "instant",
    observed_at: "2026-09-22T05:43:05Z",
    source: "/interop/effect-binding-server-probe-2026-09-22.signed.json",
    source_field: "facts_as_of",
    note: "Serve, build and deploy time do not refresh this observation.",
  };
  const fixtures = [
    {
      label: "EXACT keeps the published instant and facts_as_of",
      asked: "effect-binding",
      row: { axis: "effect-binding", status: "MEASURED", facts_as_of: exact.observed_at, measurement_time: exact },
    },
    {
      label: "DAY keeps day precision through alias resolution",
      asked: "GOV",
      row: {
        axis: "governance", status: "MEASURED",
        measurement_time: {
          state: "DAY", precision: "day", observed_on: "2026-08-12",
          source: "csoai/gspc-peritem-rows-2026-08-12 MANIFEST.json", source_field: "measured",
          note: "No midnight timestamp is invented.",
        },
      },
    },
    {
      label: "NOT_AFTER remains an upper bound rather than an observed instant",
      asked: "swarm",
      row: {
        axis: "swarm", status: "MEASURED",
        measurement_time: {
          state: "NOT_AFTER", precision: "instant-upper-bound", not_after: "2026-08-19T09:24:39.162060+00:00",
          source: "/signed/cards/swarm.json", source_field: "body.created",
          note: "This bounds the observation; it does not date the run exactly.",
        },
      },
    },
    {
      label: "UNCHECKABLE keeps its missing-time reason",
      asked: "company-practice",
      row: {
        axis: "company-practice", status: "UNMEASURED",
        measurement_time: {
          state: "UNCHECKABLE", precision: "unknown", source: "/api/gspc", source_field: "none",
          note: "No structured measurement time is available.",
        },
      },
    },
  ];

  function serve(rows: Record<string, unknown>[]) {
    const fetchMock = vi.fn(async (_url: string) => Response.json({ ...BOARD_DATES, axes: rows }));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it.each(fixtures)("$label", async ({ asked, row }) => {
    const fetchMock = serve([row]);
    const out = await getAxisTool(ORIGIN, { axis: asked });
    expect(out).toMatchObject({
      state: "LIVE", axis: row.axis, status: row.status,
      facts_as_of: "facts_as_of" in row ? row.facts_as_of : null,
      measurement_time: row.measurement_time,
      as_of: { board_measured_on: BOARD_DATES.measured_on, fetched_at: expect.any(String) },
    });
    expect((out as Record<string, unknown>).measurement_time).toEqual(row.measurement_time);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(ORIGIN + "/api/gspc");
  });

  it.each([
    { label: "absent", row: { axis: "company-practice", status: "UNMEASURED" } },
    { label: "explicit null", row: { axis: "company-practice", status: "UNMEASURED", facts_as_of: null, measurement_time: null } },
  ])("$label timestamps never fall back to another axis or board/retrieval time", async ({ row }) => {
    serve([fixtures[0].row, row]);
    const out = await getAxisTool(ORIGIN, { axis: row.axis });
    expect(out).toMatchObject({
      state: "LIVE", axis: row.axis, measured: false,
      facts_as_of: null, measurement_time: null,
      as_of: { board_measured_on: BOARD_DATES.measured_on, fetched_at: expect.any(String) },
    });
  });

  it("projects the actual board producer's fields for every axis without recomputing them", async () => {
    const rows = await boardAxes();
    expect(rows.length).toBeGreaterThan(0);
    expect(new Set(rows.map((row) => row.measurement_time?.state))).toEqual(
      new Set(["EXACT", "DAY", "NOT_AFTER", "UNCHECKABLE"]),
    );
    serve(rows);
    for (const row of rows) {
      const out = await getAxisTool(ORIGIN, { axis: row.axis });
      expect(out).toMatchObject({
        state: "LIVE", axis: row.axis,
        facts_as_of: row.facts_as_of ?? null,
        measurement_time: row.measurement_time,
      });
      expect((out as Record<string, unknown>).measurement_time).toEqual(row.measurement_time);
    }
  });
});
