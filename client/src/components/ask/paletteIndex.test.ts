/**
 * The ⌘K palette finds the board's tests by name (tools audit, 6 Oct 2026: "safety" found nothing).
 * The fixture rows carry the field names GET /api/gspc serves ({axis, task, status, …}).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  axisTitle,
  boardAxisItems,
  buildIndex,
  crumbFor,
  loadBoardAxes,
  loadPaletteTools,
  paletteKind,
  paletteIndex,
  resetPaletteIndexForTest,
  search,
  toolPaletteItems,
} from "./paletteIndex";

const BOARD = {
  axes: [
    {
      axis: "governance",
      task: "EU AI Act risk-tier classification",
      status: "MEASURED",
      kind: "model-comparison",
    },
    {
      axis: "safety",
      task: "calibrated refusal on paired requests",
      status: "MEASURED",
      kind: "model-comparison",
    },
    {
      axis: "art5-safeguard",
      task: "EU AI Act Article 5 prohibited-practice trip",
      status: "MEASURED",
      kind: "model-comparison",
    },
    {
      axis: "ai-adoption-components",
      task: "cited EU AI-adoption series (not an index)",
      status: "MEASURED",
      kind: "deterministic-facts",
    },
  ],
};

afterEach(() => resetPaletteIndexForTest());

describe("command palette — the board's tests", () => {
  it("one entry per test opens its exact axis input without inventing a score or auto-running", () => {
    const items = boardAxisItems(BOARD);
    expect(items.map((i) => i.title)).toEqual([
      "Governance — test on the board",
      "Safety — test on the board",
      "Art5 safeguard — test on the board",
      "AI adoption components — test on the board",
    ]);
    for (const it of items) {
      const url = new URL(it.href, "https://councilof.ai");
      expect(url.searchParams.get("tab")).toBe("tools");
      expect(url.searchParams.get("tool")).toBe("get_axis");
      expect(url.searchParams.get("axis")).toBe(it.id.slice("axis:".length));
      expect(url.searchParams.has("run")).toBe(false);
      expect(`${it.title} ${it.description}`).not.toMatch(/\d\.\d|%/);
    }
    expect(axisTitle("cross-reality")).toBe("Cross reality");
  });

  it("'safety' finds the Safety test once the board has been read", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json(BOARD),
    ) as unknown as typeof fetch;
    const loaded = await loadBoardAxes(fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith("/api/gspc", expect.anything());
    const hits = search("safety", loaded);
    expect(hits[0]?.title).toBe("Safety — test on the board");
  });

  it("an unreadable board adds nothing and invents nothing", async () => {
    const down = vi.fn(
      async () => new Response("down", { status: 503 }),
    ) as unknown as typeof fetch;
    expect(await loadBoardAxes(down)).toEqual([]);
    expect(boardAxisItems({ totals: {} })).toEqual([]);
    expect(boardAxisItems(null)).toEqual([]);
  });
});

describe("free tools join the finder only from their own catalogue", () => {
  it("names a tool/axis destination on reload without retaining or describing private inputs", () => {
    expect(
      crumbFor("/dashboard?tab=tools&tool=get_axis&axis=safety&ask=secret"),
    ).toEqual({ title: "Safety — axis lookup", crumb: "Council OS › Tools" });
    expect(
      crumbFor("/dashboard?tab=tools&tool=verify_card&card=private-body"),
    ).toEqual({ title: "verify_card", crumb: "Council OS › Tools" });
  });
  it("preserves the exact callable name and never promotes discovery to measurement", async () => {
    const list = vi.fn(async () => ({
      state: "ok" as const,
      tools: [
        { name: "verify_card", description: "Verify a signed record" },
        { name: "verify_card", description: "duplicate" },
      ],
    }));
    const rows = await loadPaletteTools(list);
    expect(list).toHaveBeenCalledWith("/mcp/free", { force: false });
    expect(rows).toHaveLength(1);
    expect(rows[0].href).toBe("/dashboard?tab=tools&tool=verify_card");
    expect(paletteKind(rows[0])).toBe("tool");
    expect(search("verify", paletteIndex()).map((row) => row.id)).toContain(
      "tool:verify_card",
    );
  });
  it("a failed refresh removes old catalogue hits, keeping ordinary pages searchable", async () => {
    await loadPaletteTools(
      vi.fn(async () => ({
        state: "ok" as const,
        tools: [{ name: "example", description: "A public tool" }],
      })),
    );
    await loadPaletteTools(
      vi.fn(async () => ({ state: "unreachable" as const, reason: "offline" })),
      true,
    );
    expect(paletteIndex().some((row) => row.id === "tool:example")).toBe(false);
    expect(buildIndex().length).toBeGreaterThan(0);
    expect(
      toolPaletteItems({ state: "unreachable", reason: "offline" }),
    ).toEqual([]);
  });
});

describe("command palette finds the Article 50(2) marking check by the words people use", () => {
  const items = buildIndex();
  for (const q of [
    "watermark",
    "C2PA",
    "content credentials",
    "label AI images",
    "article 50",
  ]) {
    it(`"${q}" returns /dashboard/?tab=art50`, () => {
      expect(search(q, items).map((i) => i.href)).toContain(
        "/dashboard/?tab=art50",
      );
    });
  }
  it("files it under Get results, not Check a result", () => {
    const hit = items.find((i) => i.href === "/dashboard/?tab=art50");
    expect(hit?.crumb).toBe("Council OS › Get results");
  });
});
