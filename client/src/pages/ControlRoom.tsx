import { useEffect, useState } from "react";
import { readJson, readClock, type Read } from "../lib/statusReads";
import { headlineTiles, SRC, type Failed, type Reads, type Tile } from "../lib/controlRoomHeadlines";
import {
  breakSegments,
  canaryGrid,
  countSentence,
  inView,
  plotLines,
  watchdogPoints,
  x402CountKeys,
  x402Points,
  type Point,
  type SeriesFile,
  type View,
} from "../lib/controlRoomSeries";

const SERIES_URL = "/interop/control-room/series.json";
type Axis = { axis?: string; n?: number; status?: string; separation?: string; measurement_time?: { observed_on?: string } };
type Gspc = { totals?: Record<string, unknown>; axes?: Axis[] };

function Line({ points, label, unit }: { points: Point[]; label: string; unit: string }) {
  const W = 560;
  const H = 120;
  const g = plotLines(points, W, H);
  return (
    <figure className="mt-3" data-testid="control-room-line">
      <figcaption className="text-sm font-semibold text-slate-100">{label}</figcaption>
      <p className="font-mono text-[11px] text-slate-400">
        {countSentence(points.length)} · y axis: {unit}, 0 to {g.yMax}
        {points.length ? ` · ${new Date(g.tMin).toISOString().slice(0, 10)} to ${new Date(g.tMax).toISOString().slice(0, 10)}` : ""}
      </p>
      {points.length ? (
        <svg viewBox={`-4 -4 ${W + 8} ${H + 8}`} className="mt-1 w-full max-w-[560px]" role="img" aria-label={`${label}: ${countSentence(points.length)}`}>
          <line x1="0" y1={H} x2={W} y2={H} stroke="#334155" />
          {g.segments.map((s) => (
            <polyline key={s} points={s} fill="none" stroke="#6ee7b7" strokeWidth="1.5" />
          ))}
          {g.dots.map((d) => (
            <circle key={d.p.path} cx={d.x} cy={d.y} r="2.5" fill="#6ee7b7">
              <title>{`${d.p.as_of}: ${d.p.y} of ${d.p.n} (${d.p.path})`}</title>
            </circle>
          ))}
        </svg>
      ) : null}
      <p className="font-mono text-[10px] text-slate-500">
        {breakSegments(points).length > 1 ? `${breakSegments(points).length} separate runs: the line is broken where measurements are more than 36 hours apart. ` : ""}
        Each dot is one dated file; hover for its address. Straight segments join stated values; nothing is smoothed.
      </p>
    </figure>
  );
}

export default function ControlRoom() {
  const [view, setView] = useState<View>("week");
  const [reads, setReads] = useState<(Reads & { series: Read<SeriesFile> }) | null>(null);
  const [nowMs, setNowMs] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [gspc, revenue, worker, capsule, watchdog, pulls, series] = await Promise.all([
        readJson<Gspc>(SRC.gspc),
        readJson<Reads["revenue"] extends Read<infer B> ? B : never>(SRC.revenue),
        readJson<Reads["worker"] extends Read<infer B> ? B : never>(SRC.worker),
        readJson<Reads["capsule"] extends Read<infer B> ? B : never>(SRC.capsule),
        readJson<Reads["watchdog"] extends Read<infer B> ? B : never>(SRC.watchdog),
        readJson<Reads["pulls"] extends Read<infer B> ? B : never>(SRC.pulls, { headers: { accept: "application/vnd.github+json" } }),
        readJson<SeriesFile>(SERIES_URL),
      ]);
      if (!cancelled) {
        setReads({ gspc, revenue, worker, capsule, watchdog, pulls, series });
        setNowMs(Date.now());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { tiles, failed }: { tiles: Tile[]; failed: Failed[] } = reads ? headlineTiles(reads) : { tiles: [], failed: [] };
  const series = reads?.series.ok ? reads.series.body : null;
  const gspc = reads?.gspc.ok ? (reads.gspc.body as Gspc) : null;
  const wd = inView(watchdogPoints(series?.watchdog_runs ?? []), view, nowMs);
  const x4 = inView(x402Points(series?.x402_rounds ?? []), view, nowMs);
  const grid = canaryGrid(series?.canary ?? [], view, nowMs);
  const canaryCells = grid.endpoints.flatMap((e) => grid.dates.map((d) => grid.cell[e][d])).filter((s): s is string => typeof s === "string");
  const canaryHashed = canaryCells.filter((s) => s.split(" + ").includes("HASHED")).length;
  const footer = reads
    ? [
        [SRC.gspc, reads.gspc],
        [SRC.revenue, reads.revenue],
        [SRC.worker, reads.worker],
        [SRC.capsule, reads.capsule],
        [SRC.watchdog, reads.watchdog],
        [SRC.pulls, reads.pulls],
        [SERIES_URL, reads.series],
      ] as Array<[string, Read<unknown>]>
    : [];

  return (
    <section className="bg-slate-950 px-5 pt-16 text-slate-100" data-testid="control-room" aria-labelledby="control-room-h">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">Control room · read live · never typed</p>
        <h2 id="control-room-h" className="mt-3 text-3xl font-black tracking-tight">Live numbers, with history</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Council of AI measured these from its own endpoints and dated files. One count, open pull requests, is read from GitHub. Nothing is simulated.
          Every figure comes from an automated job and has not been reviewed by a named person. Each number carries its unit, its time and its source address.
          A source that could not be read is left out and listed in the footer; it is never drawn as zero. Measurement, not certification.
        </p>

        <h3 className="mt-8 text-lg font-bold">Headline numbers</h3>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="control-room-tiles">
          {!reads ? <li className="font-mono text-xs text-slate-500">reading…</li> : null}
          {tiles.map((t) => (
            <li key={t.id} className="rounded-xl border border-slate-700 bg-slate-900/80 p-4" data-tile={t.id}>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.label}</div>
              <div className="mt-1 text-2xl font-black text-slate-50">{t.value}</div>
              <div className="text-xs text-slate-300">{t.unit}</div>
              {t.note ? <div className="mt-1 text-[11px] text-slate-400">{t.note}</div> : null}
              <div className="mt-2 font-mono text-[10px] text-slate-500">
                {t.asOfBasis === "stated" ? "as of" : "read at"} {t.asOf}
                {t.asOfBasis === "read" ? ` (${readClock()})` : ""} · {t.source}
              </div>
            </li>
          ))}
        </ul>

        <h3 className="mt-10 text-lg font-bold">History</h3>
        <div className="mt-2 flex gap-2" role="group" aria-label="time view">
          {(["week", "all"] as const).map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} className={`rounded-full border px-3 py-1 font-mono text-xs ${view === v ? "border-emerald-300 text-emerald-200" : "border-slate-700 text-slate-400"}`}>
              {v === "week" ? "past week" : "all time"}
            </button>
          ))}
        </div>
        {reads && !series ? <p className="mt-3 text-sm text-slate-400">The dated-file series could not be read, so no history is drawn.</p> : null}
        {series ? (
          <>
            <Line points={wd} label="Watchdog sources reachable, per run" unit="sources reachable (n = sources probed in that run)" />
            <Line points={x4} label="x402 catalogue rows answering a correct 402 challenge, per round" unit="rows (n = rows probed in that round)" />
            <p className="mt-1 font-mono text-[10px] text-slate-500">
              A 402 answer is not delivery. Rounds state these count keys: {x402CountKeys(series.x402_rounds ?? []).join(", ") || "none"}. Rounds differ in which keys they state; each round's file lists its own at the address in the dot.
            </p>

            <figure className="mt-6" data-testid="control-room-canary">
              <figcaption className="text-sm font-semibold text-slate-100">Silent-route canary: what our own probe recorded for each endpoint, by day</figcaption>
              <p className="font-mono text-[11px] text-slate-400">
                {grid.dates.length ? `${grid.dates.length} day(s) with rows · ${grid.endpoints.length} endpoint(s) · ${canaryHashed} of ${canaryCells.length} rows are HASHED · blank cell = no row that day (a gap, not a pass)` : "no row in this view"}
              </p>
              {grid.dates.length ? (
                <div className="mt-2 overflow-x-auto">
                  <table className="font-mono text-[10px] text-slate-300">
                    <thead>
                      <tr>
                        <th className="pr-3 text-left text-slate-500">endpoint</th>
                        {grid.dates.map((d) => (
                          <th key={d} className="px-1 text-slate-500">{d.slice(5)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {grid.endpoints.map((e) => (
                        <tr key={e}>
                          <td className="pr-3">{e}</td>
                          {grid.dates.map((d) => (
                            <td key={d} className="border border-slate-800 px-1" title={`${e} ${d}: ${grid.cell[e][d] ?? "no row"}`}>
                              {grid.cell[e][d] ?? ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              <p className="mt-2 max-w-3xl text-[11px] leading-5 text-slate-400">
                Each status describes our own daily probe, not the service of the organisation named. HASHED: the responses were received and hashed, which is the only status that is a measurement.
                UNAVAILABLE: our probe held no credential for that endpoint, or our local endpoint did not answer. BAD_CREDENTIALS, NO_BALANCE, FORBIDDEN and RATE_LIMITED: our request was answered 401, 402, 403 or 429.
                ERROR: our request failed in another way.
              </p>
              <p className="font-mono text-[10px] text-slate-500">Source: /interop/silent-route-canary-2026-09/baseline.jsonl, one row per endpoint per day, copied verbatim into the series file. Statuses stated: {grid.statuses.join(", ") || "none"}.</p>
            </figure>
          </>
        ) : null}

        <h3 className="mt-10 text-lg font-bold">Benchmarks: one line per axis, with n</h3>
        <p className="mt-1 text-sm text-slate-300">
          A benchmark is shown as a line over time with its n, never as one score. The board states one dated measurement for each axis, and this page reads no earlier run of any axis,
          so each axis is one point: one measurement. A second dated measurement would extend it to a line.
        </p>
        {gspc?.axes?.length ? (
          <div className="mt-3 overflow-x-auto" data-testid="control-room-axes">
            <table className="w-full text-left font-mono text-[11px] text-slate-300">
              <thead>
                <tr className="border-b border-slate-700 text-slate-500">
                  <th className="py-1 pr-3">axis</th>
                  <th className="py-1 pr-3">n</th>
                  <th className="py-1 pr-3">measurements</th>
                  <th className="py-1 pr-3">measured on</th>
                  <th className="py-1">separation</th>
                </tr>
              </thead>
              <tbody>
                {gspc.axes.map((a) => (
                  <tr key={a.axis} className="border-b border-slate-800">
                    <td className="py-1 pr-3">{a.axis}</td>
                    <td className="py-1 pr-3">{typeof a.n === "number" ? a.n : "not stated"}</td>
                    <td className="py-1 pr-3">one measurement</td>
                    <td className="py-1 pr-3">{a.measurement_time?.observed_on ?? "not stated"}</td>
                    <td className="py-1">{a.separation ?? "not applicable"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : reads ? (
          <p className="mt-3 text-sm text-slate-400">The board could not be read, so no axis is listed.</p>
        ) : null}

        <footer className="mt-10 border-t border-slate-800 pt-4" data-testid="control-room-footer">
          <h3 className="text-sm font-bold text-slate-200">Sources and when each was read</h3>
          <ul className="mt-2 space-y-1 font-mono text-[11px] text-slate-400">
            {footer.map(([url, rd]) => (
              <li key={url} data-read={rd.ok ? "ok" : "failed"}>
                {url} · {"error" in rd ? `FAILED (${rd.error})` : "read"} at {rd.readAt}
              </li>
            ))}
            {series?.skipped?.length ? <li>series file skipped {series.skipped.length} source file(s): {series.skipped.map((s) => s.path).join(", ")}</li> : null}
            {failed.length ? <li className="text-amber-300">left out of the headline numbers: {failed.map((f) => `${f.source} (${f.error})`).join("; ")}</li> : null}
          </ul>
          <p className="mt-2 font-mono text-[10px] text-slate-500">
            The series file is rebuilt from the dated files each time the site is built (scripts/build-control-room-series.mjs), so its newest point is the newest dated file in that build.
          </p>
        </footer>
      </div>
    </section>
  );
}
