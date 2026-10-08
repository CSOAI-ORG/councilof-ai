import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import type { GspcBoardLiveState, GspcPayload } from "../board/useGspcBoard";

const board = vi.hoisted(() => ({ read: null as GspcBoardLiveState | null }));
vi.mock("../board/useGspcBoard", async (original) => ({
  ...await original<typeof import("../board/useGspcBoard")>(),
  useGspcBoard: () => board.read,
}));
import GspcWorkspaceHome from "./GspcWorkspaceHome";

const data = (): GspcPayload => ({
  schema: "csoai.gspc-axes/0.5",
  axes: [{ axis: "retained-fact-run", kind: "deterministic-facts", status: "MEASURED", n: 3 }],
  totals: { axes: 1, measured_axes: 1, unmeasured_axes: 0, comparison_axes: 0, fact_runs: 1, public_count: "1 measured of 1 axis" },
  measured_on: { "retained-fact-run": "2026-09-15T03:00:00Z" },
});
const read = (payload: GspcPayload | null, error: string | null = null): GspcBoardLiveState => ({
  data: payload, error, loading: false, refreshing: false,
  readAt: payload ? "2026-10-08T07:44:00.000Z" : null,
  refresh: async () => {},
});
const render = () => renderToStaticMarkup(<Router ssrPath="/dashboard"><GspcWorkspaceHome talk={null} /></Router>);

describe("workspace board read states", () => {
  it("keeps the last successful board and its client read time visible after a refresh fails", () => {
    const retained = data();
    board.read = read(retained);
    const first = render();
    expect(first).toContain('data-testid="ws-board-count"');
    expect(first).toContain("retained-fact-run");
    expect(first).not.toContain('data-testid="ws-board-refresh-error"');

    // The reader retains exactly these bytes and readAt when a later request fails.
    board.read = read(retained, "request timed out");
    const failedRefresh = render();
    expect(failedRefresh).toContain('data-testid="ws-board-count"');
    expect(failedRefresh).toContain("1 measured of 1 axis");
    expect(failedRefresh).toContain("retained-fact-run");
    expect(failedRefresh).toContain('data-testid="ws-board-refresh-error"');
    expect(failedRefresh).toContain("Showing the last successful read.");
    expect(failedRefresh).toContain('dateTime="2026-10-08T07:44:00.000Z"');
    expect(failedRefresh).toContain("client read time");
    expect(failedRefresh).toContain("own measurement dates");
    expect(failedRefresh).not.toContain('data-testid="ws-board-error"');
    expect(failedRefresh).not.toContain("Nothing is shown in its place.");
    expect(retained.measured_on).toEqual({ "retained-fact-run": "2026-09-15T03:00:00Z" });
  });

  it("keeps a failed first read empty without claiming a last successful read", () => {
    board.read = read(null, "HTTP 503");
    const html = render();
    expect(html).toContain('data-testid="ws-board-error"');
    expect(html).toContain("Nothing is shown in its place.");
    expect(html).not.toContain('data-testid="ws-board-count"');
    expect(html).not.toContain('data-testid="ws-board-read-at"');
    expect(html).not.toContain('data-testid="ws-board-refresh-error"');
    expect(html).not.toContain("retained-fact-run");
  });

  it("labels an unavailable presentation state without calling it an untested comparison", () => {
    // Presentation fixtures can expose a future state; this does not relax reader validation.
    const unknown = data();
    unknown.axes = [{ axis: "future-comparison", kind: "model-comparison", status: "MEASURED", separation: "FUTURE_STATE" }];
    board.read = read(unknown);
    const html = render();
    expect(html).toContain("State unavailable");
    expect(html).toContain("future-comparison: state unavailable");
    expect(html).toContain("No run or comparison result is inferred (UNKNOWN).");
    expect(html).not.toContain("future-comparison: untested");
    expect(html).not.toContain("undefined");
  });
});
