import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { collectCanary, collectSeries, collectWatchdog, collectX402 } from "../../../scripts/build-control-room-series.mjs";
import {
  WEEK_MS,
  breakSegments,
  canaryByDay,
  canaryGrid,
  countSentence,
  inView,
  plotLines,
  watchdogPoints,
  x402CountKeys,
  x402Points,
} from "./controlRoomSeries";
import { headlineTiles, usdcFromAtomic, type Reads } from "./controlRoomHeadlines";

const H = 3600 * 1000;
const NOW = Date.parse("2026-11-24T12:00:00Z");

describe("series builders", () => {
  it("watchdog: reachable out of probed per run, sorted, unusable runs dropped", () => {
    const pts = watchdogPoints([
      { path: "/b", as_of: "2026-11-05T00:00:00Z", sources_probed: 18, reachable: 17, unreachable: 1, uncheckable: 0 },
      { path: "/a", as_of: "2026-11-02T00:00:00Z", sources_probed: 18, reachable: 18, unreachable: 0, uncheckable: 0 },
      { path: "/bad", as_of: "not a date", sources_probed: 18, reachable: 18, unreachable: 0, uncheckable: 0 },
    ]);
    expect(pts.map((p) => [p.path, p.y, p.n])).toEqual([["/a", 18, 18], ["/b", 17, 18]]);
  });

  it("x402: reads challenge_402 over total as stated; a round without them is not a point (not zero)", () => {
    const pts = x402Points([
      { path: "/r1", as_of: "2026-09-07T07:10:00Z", counts: { challenge_402: 74, total: 100 } },
      { path: "/r2", as_of: "2026-11-24T00:12:05Z", counts: { challenge_402: 99, total: 100, other_error: 1 } },
      { path: "/r3", as_of: "2026-11-25T00:00:00Z", counts: { total: 100 } },
    ]);
    expect(pts.map((p) => p.y)).toEqual([74, 99]);
    expect(x402CountKeys([{ path: "x", as_of: "x", counts: { b: 1, a: 2 } }])).toEqual(["a", "b"]);
  });

  it("canary: groups by day, counts statuses, keeps a missing day absent", () => {
    const days = canaryByDay([
      { date: "2026-11-02", endpoint_id: "a", status: "ERROR" },
      { date: "2026-11-01", endpoint_id: "a", status: "UNAVAILABLE" },
      { date: "2026-11-01", endpoint_id: "b", status: "UNAVAILABLE" },
    ]);
    expect(days.map((d) => d.date)).toEqual(["2026-11-01", "2026-11-02"]);
    expect(days[0].statuses).toEqual({ UNAVAILABLE: 2 });
  });

  it("canary grid: a day with no row for an endpoint is undefined, not a status; week view drops old days", () => {
    const rows = [
      { date: "2026-11-23", endpoint_id: "a", status: "ERROR" },
      { date: "2026-11-23", endpoint_id: "b", status: "FORBIDDEN" },
      { date: "2026-11-22", endpoint_id: "a", status: "ERROR" },
      { date: "2026-09-12", endpoint_id: "a", status: "HASHED" },
    ];
    const all = canaryGrid(rows, "all", NOW);
    expect(all.dates).toEqual(["2026-09-12", "2026-11-22", "2026-11-23"]);
    expect(all.cell.b["2026-11-22"]).toBeUndefined();
    const wk = canaryGrid(rows, "week", NOW);
    expect(wk.dates).toEqual(["2026-11-22", "2026-11-23"]);
    expect(wk.statuses).toEqual(["ERROR", "FORBIDDEN"]);
  });

  it("canary grid: two rows for one endpoint and day keep both", () => {
    const g = canaryGrid([{ date: "2026-11-23", endpoint_id: "a", status: "ERROR" }, { date: "2026-11-23", endpoint_id: "a", status: "HASHED" }], "all", NOW);
    expect(g.cell.a["2026-11-23"]).toBe("ERROR + HASHED");
  });

  it("views: week keeps 7 days to now; all keeps everything", () => {
    const pts = [{ t: NOW - WEEK_MS - H }, { t: NOW - WEEK_MS + H }, { t: NOW }, { t: NOW + H }];
    expect(inView(pts, "week", NOW)).toHaveLength(2);
    expect(inView(pts, "all", NOW)).toHaveLength(4);
  });

  it("lines break at gaps and are never joined across them", () => {
    const seg = breakSegments([{ t: 0 }, { t: 10 * H }, { t: 100 * H }, { t: 110 * H }], 36 * H);
    expect(seg.map((s) => s.length)).toEqual([2, 2]);
  });

  it("plot: no interpolation, one point has no segment, empty has no geometry", () => {
    const p = (t: number, y: number) => ({ t, y, n: 18, as_of: "", path: String(t) });
    expect(plotLines([], 100, 50).dots).toEqual([]);
    const one = plotLines([p(5, 10)], 100, 50);
    expect(one.segments).toEqual([]);
    expect(one.dots).toHaveLength(1);
    const two = plotLines([p(0, 18), p(H, 9)], 100, 90);
    expect(two.dots.map((d) => d.y)).toEqual([0, 45]);
    expect(two.segments).toHaveLength(1);
  });

  it("says one measurement / none", () => {
    expect(countSentence(1)).toBe("one measurement");
    expect(countSentence(0)).toBe("no measurement in this view");
    expect(countSentence(3)).toBe("3 measurements");
  });
});

describe("collector (scripts/build-control-room-series.mjs)", () => {
  it("copies stated values and lists what it could not read", () => {
    const skipped: Array<{ reason: string }> = [];
    const rows = collectCanary('{"date":"2026-11-01","endpoint_id":"a","status":"ERROR","note":"x"}\nnot json\n{"date":"2026-11-01"}\n', skipped);
    expect(rows).toEqual([{ date: "2026-11-01", endpoint_id: "a", status: "ERROR" }]);
    expect(skipped).toHaveLength(2);
    expect(collectWatchdog("r.json", { as_of: "2026-11-01T00:00:00Z", totals: { sources_probed: 18, reachable: 17, unreachable: 1 } })).toMatchObject({ reachable: 17, unreachable: 1, uncheckable: null });
    expect(collectWatchdog("r.json", { as_of: "x" })).toBeNull();
    expect(collectX402("r.json", { as_of: "2026-09-07T00:00:00Z", counts: { challenge_402: 74, note: "text" } })?.counts).toEqual({ challenge_402: 74 });
  });

  it("walks a directory, ignores latest.json and v2- files, and lists unreadable files", () => {
    const root = mkdtempSync(join(tmpdir(), "cr-"));
    for (const d of ["public/interop/silent-route-canary-2026-09", "public/interop/watchdog-intake", "public/interop/x402-trust"]) mkdirSync(join(root, d), { recursive: true });
    writeFileSync(join(root, "public/interop/silent-route-canary-2026-09/baseline.jsonl"), '{"date":"2026-11-01","endpoint_id":"a","status":"ERROR"}\n');
    writeFileSync(join(root, "public/interop/watchdog-intake/20261101T000000Z.json"), JSON.stringify({ as_of: "2026-11-01T00:00:00Z", totals: { sources_probed: 18, reachable: 18 } }));
    writeFileSync(join(root, "public/interop/watchdog-intake/latest.json"), "{}");
    writeFileSync(join(root, "public/interop/x402-trust/20261101T000000Z.json"), JSON.stringify({ as_of: "2026-11-01T00:00:00Z", counts: { challenge_402: 9, total: 10 } }));
    writeFileSync(join(root, "public/interop/x402-trust/20261102T000000Z.json"), "{broken");
    writeFileSync(join(root, "public/interop/x402-trust/v2-2026-09-07.json"), "{}");
    const s = collectSeries(root);
    expect(s.canary).toHaveLength(1);
    expect(s.watchdog_runs).toHaveLength(1);
    expect(s.x402_rounds).toHaveLength(1);
    expect(s.skipped.map((x: { path: string }) => x.path)).toEqual(["public/interop/x402-trust/20261102T000000Z.json"]);
  });
});

describe("headline numbers", () => {
  const at = "2026-11-24T12:00:00.000Z";
  const ok = <T,>(body: T) => ({ ok: true as const, body, readAt: at });
  const bad = { ok: false as const, error: "HTTP 503", readAt: at };
  const good: Reads = {
    gspc: ok({ totals: { axes: 34, measured_axes: 34, comparison_axes: 14, separated_leads: 0, ties: 7, untested_separations: 7 } }),
    revenue: ok({ one_number: { last_30d: 2, settled_usdc_atomic: 60000, repeat_nonself_payers: { last_30d: 0 } } }),
    worker: ok({ status: "OFFLINE" }),
    capsule: ok({ index_date: "2026-11-01", as_of: "2026-11-01T08:30:40Z" }),
    watchdog: ok({ as_of: "2026-11-21T16:57:32Z", sources_probed: 18, reachable: 18 }),
    pulls: ok({ total_count: 167 }),
  };

  it("gives ten tiles, each with unit, as_of and a source; hosted models say unverified", () => {
    const { tiles, failed } = headlineTiles(good);
    expect(tiles).toHaveLength(10);
    expect(failed).toEqual([]);
    for (const t of tiles) expect([t.unit, t.asOf, t.source].every((x) => x.length > 0)).toBe(true);
    expect(tiles.find((t) => t.id === "hosted")?.value).toBe("unverified");
    expect(tiles.find((t) => t.id === "settled")?.value).toBe("0.06");
    expect(tiles.find((t) => t.id === "repeat")?.value).toBe("0");
    expect(tiles.find((t) => t.id === "comparisons")?.value).toBe("0 separated · 7 TIE · 7 UNTESTED");
  });

  it("a failed source is omitted and listed, never shown as zero", () => {
    const { tiles, failed } = headlineTiles({ ...good, revenue: bad, pulls: bad });
    expect(tiles.map((t) => t.id)).not.toEqual(expect.arrayContaining(["payers", "repeat", "settled", "pulls"]));
    expect(failed.map((f) => f.error)).toEqual(["HTTP 503", "HTTP 503"]);
    expect(tiles.some((t) => t.value === "0" && ["payers", "settled", "pulls"].includes(t.id))).toBe(false);
  });

  it("settled revenue is two decimals, truncated from atomic USDC", () => {
    expect(usdcFromAtomic(60000)).toBe("0.06");
    expect(usdcFromAtomic(0)).toBe("0.00");
    expect(usdcFromAtomic(1239999)).toBe("1.23");
    expect(usdcFromAtomic(-1)).toBeNull();
    expect(usdcFromAtomic(1.5)).toBeNull();
  });
});
