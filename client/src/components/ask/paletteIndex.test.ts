/**
 * The ⌘K palette finds the board's tests by name (tools audit, 6 Oct 2026: "safety" found nothing).
 * The fixture rows carry the field names GET /api/gspc serves ({axis, task, status, …}).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { axisTitle, boardAxisItems, buildIndex, loadBoardAxes, resetPaletteIndexForTest, search } from "./paletteIndex";

const BOARD = {
  axes: [
    { axis: "governance", task: "EU AI Act risk-tier classification", status: "MEASURED", kind: "model-comparison" },
    { axis: "safety", task: "calibrated refusal on paired requests", status: "MEASURED", kind: "model-comparison" },
    { axis: "art5-safeguard", task: "EU AI Act Article 5 prohibited-practice trip", status: "MEASURED", kind: "model-comparison" },
    { axis: "ai-adoption-components", task: "cited EU AI-adoption series (not an index)", status: "MEASURED", kind: "deterministic-facts" },
  ],
};

afterEach(() => resetPaletteIndexForTest());

describe("command palette — the board's tests", () => {
  it("one entry per test, labelled '<Test> — test on the board', opening the board, no numbers", () => {
    const items = boardAxisItems(BOARD);
    expect(items.map((i) => i.title)).toEqual([
      "Governance — test on the board",
      "Safety — test on the board",
      "Art5 safeguard — test on the board",
      "AI adoption components — test on the board",
    ]);
    for (const it of items) {
      expect(it.href).toBe("/dashboard/?tab=board");
      expect(`${it.title} ${it.description}`).not.toMatch(/\d\.\d|%/);
    }
    expect(axisTitle("cross-reality")).toBe("Cross reality");
  });

  it("'safety' finds the Safety test once the board has been read", async () => {
    const fetchImpl = vi.fn(async () => Response.json(BOARD)) as unknown as typeof fetch;
    const loaded = await loadBoardAxes(fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith("/api/gspc", expect.anything());
    const hits = search("safety", loaded);
    expect(hits[0]?.title).toBe("Safety — test on the board");
  });

  it("an unreadable board adds nothing and invents nothing", async () => {
    const down = vi.fn(async () => new Response("down", { status: 503 })) as unknown as typeof fetch;
    expect(await loadBoardAxes(down)).toEqual([]);
    expect(boardAxisItems({ totals: {} })).toEqual([]);
    expect(boardAxisItems(null)).toEqual([]);
  });
});

describe("command palette finds the Article 50(2) marking check by the words people use", () => {
  const items = buildIndex();
  for (const q of ["watermark", "C2PA", "content credentials", "label AI images", "article 50"]) {
    it(`"${q}" returns /dashboard/?tab=art50`, () => {
      expect(search(q, items).map((i) => i.href)).toContain("/dashboard/?tab=art50");
    });
  }
  it("files it under Get results, not Check a result", () => {
    const hit = items.find((i) => i.href === "/dashboard/?tab=art50");
    expect(hit?.crumb).toBe("Council OS › Get results");
  });
});
