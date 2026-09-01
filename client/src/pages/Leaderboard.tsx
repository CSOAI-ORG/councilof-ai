/**
 * /leaderboard — THE governance leaderboard. The product's face.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE THESIS, BUILT INTO THE UX (not printed and then ignored).
 *
 * Single-number model rankings are the disease. A model strong on one axis is
 * often weak on another, and hiding that is the malpractice this board exists to
 * correct. So this page has NO forced "overall rank": the reader sorts by the
 * axis they care about, the composite is opt-in with its formula shown in the
 * open, and the per-axis breakdown is always visible beside any composite. Every
 * measured cell links to the signed card behind it; every unmeasured pair is
 * shown as empty, never as a zero. The board audits itself in a panel at the
 * bottom. Lead by example.
 *
 * Data core: client/src/lib/gspcFleet.ts (reads /signed/card-matrix.json). Counts
 * are derived from the arrays there, never typed here. The axis-level statistics
 * (n, Wilson interval, separation test) come from the governance board
 * (/api/gspc) via useGspcBoard — a DIFFERENT instrument, linked, never summed.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import { useGspcBoard, type GspcAxis } from "@/components/board/useGspcBoard";
import {
  loadFleetMatrix,
  buildGrid,
  deriveCounts,
  cellFor,
  compositeAcrossAxes,
  axisBankN,
  wilson,
  pct,
  shortSha,
  fetchCardByUrl,
  fetchPinnedCardKey,
  verifyCard,
  type FleetMatrix,
  type FleetGrid,
  type MatrixCell,
  type MatrixModel,
  type CardVerdict,
} from "@/lib/gspcFleet";
import {
  axisMeta,
  regulationForAxis,
  axesRelevantTo,
  REGIMES,
  type Regime,
} from "@/lib/axisRegulation";

/* ── loader grammar ──────────────────────────────────────────────────────── */

type LoadState = "LOADING" | "READY" | "UNREACHABLE";

const GROUND = "#03110b";

/* ════════════════════════════════════════════════════════════════════════ */

export default function Leaderboard() {
  const [matrix, setMatrix] = useState<FleetMatrix | null>(null);
  const [state, setState] = useState<LoadState>("LOADING");
  const [err, setErr] = useState<string | null>(null);
  const board = useGspcBoard();
  const [pinnedKey, setPinnedKey] = useState<Uint8Array | null>(null);

  useEffect(() => {
    document.title = "The AI Governance Leaderboard — sorted by the axis you care about | Council of AI";
    setMetaDescription(
      "Not a single 'best AI'. Sort 64 signed models across every governance axis — safety, provenance, refusal, jailbreak-resistance — every cell verifiable against its Ed25519 card. Measurement, not certification.",
    );
  }, []);

  useEffect(() => {
    let live = true;
    loadFleetMatrix()
      .then((m) => { if (live) { setMatrix(m); setState("READY"); } })
      .catch((e) => { if (live) { setErr(String(e?.message ?? e)); setState("UNREACHABLE"); } });
    // The pinned card key powers per-cell verification. If it never arrives the
    // verifier reports UNCHECKABLE, never INVALID — see cardVerify.ts.
    fetchPinnedCardKey().then((k) => { if (live) setPinnedKey(k); }).catch(() => {});
    return () => { live = false; };
  }, []);

  return (
    <div className="min-h-screen" style={{ background: GROUND, color: "#ecfdf5" }}>
      <Hero />
      {state === "LOADING" && <Banner tone="wait">LOADING — reading the signed card matrix…</Banner>}
      {state === "UNREACHABLE" && (
        <Banner tone="err">
          UNREACHABLE — the card matrix could not be read ({err}). No numbers are shown, because a
          placeholder number is a lie with a nice font.
        </Banner>
      )}
      {state === "READY" && matrix && <Board matrix={matrix} board={board.data} pinnedKey={pinnedKey} />}
      <Footer />
    </div>
  );
}

/* ── hero + persistent thesis ────────────────────────────────────────────── */

function Hero() {
  return (
    <header className="border-b border-emerald-500/15">
      <div className="mx-auto max-w-[1400px] px-5 pt-12 pb-8">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
          Council of AI · measurement, not certification
        </p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">The Governance Leaderboard</h1>
        <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-emerald-100/85">
          <strong className="text-emerald-200">There is no single &ldquo;best AI&rdquo;.</strong> A model strong on
          one axis is often weak on another; hiding that is the malpractice this board exists to correct. So there is
          no forced overall rank here. Sort by the axis <em>you</em> care about — safety, provenance, refusal,
          jailbreak-resistance. Every measured cell links to the Ed25519 card behind it. Every unmeasured pair is shown
          empty, never as a zero.
        </p>
      </div>
    </header>
  );
}

function Banner({ tone, children }: { tone: "wait" | "err"; children: React.ReactNode }) {
  const cls = tone === "err" ? "border-rose-500/40 bg-rose-500/10 text-rose-200" : "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8">
      <div className={`rounded-lg border px-4 py-3 font-mono text-[13px] ${cls}`}>{children}</div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */

type SortKey = { type: "model" } | { type: "axis"; axis: string } | { type: "composite" };

function Board({ matrix, board, pinnedKey }: { matrix: FleetMatrix; board: import("@/components/board/useGspcBoard").GspcPayload | null; pinnedKey: Uint8Array | null }) {
  const grid = useMemo(() => buildGrid(matrix), [matrix]);
  const counts = useMemo(() => deriveCounts(matrix), [matrix]);
  const axisIds = useMemo(() => matrix.axes.map((a) => a.id), [matrix]);

  const [sort, setSort] = useState<SortKey>({ type: "model" });
  const [regime, setRegime] = useState<Regime | "">("");
  const [compositeOn, setCompositeOn] = useState(false);
  const [query, setQuery] = useState("");
  const [compare, setCompare] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<string | null>(null);
  const [verifyCell, setVerifyCell] = useState<MatrixCell | null>(null);

  // Regulator lens: the set of axes relevant to the chosen regime (pointers only).
  const relevant = useMemo(
    () => (regime ? axesRelevantTo(regime, axisIds) : null),
    [regime, axisIds],
  );
  const shownAxes = useMemo(
    () => (relevant ? matrix.axes.filter((a) => relevant.has(a.id)) : matrix.axes),
    [matrix.axes, relevant],
  );

  // Board-twin lookup: enrich an axis column with the governance board's n /
  // Wilson / separation where a twin exists. A LINK across instruments, not a sum.
  const boardAxisByName = useMemo(() => {
    const map = new Map<string, GspcAxis>();
    for (const a of board?.axes ?? []) if (a?.axis) map.set(String(a.axis).toLowerCase(), a);
    return map;
  }, [board]);

  const composite = useMemo(
    () => compositeAcrossAxes(matrix, relevant ? [...relevant] : axisIds),
    [matrix, relevant, axisIds],
  );
  const compositeByModel = useMemo(() => new Map(composite.map((r) => [r.model, r])), [composite]);

  // The rows: models, filtered by query, ordered by the chosen sort. Ordering is
  // presentation — never a separation claim (see the note under the grid).
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list: MatrixModel[] = matrix.models.filter((m) => !q || m.id.toLowerCase().includes(q));
    if (sort.type === "model") {
      list = [...list].sort((a, b) => a.id.localeCompare(b.id));
    } else if (sort.type === "axis") {
      const ax = sort.axis;
      list = [...list].sort((a, b) => {
        const ca = cellFor(grid, a.id, ax), cb = cellFor(grid, b.id, ax);
        // Measured rows first (best→worst); unmeasured sink to the bottom, kept.
        if (!ca && !cb) return a.id.localeCompare(b.id);
        if (!ca) return 1;
        if (!cb) return -1;
        return cb.accuracy - ca.accuracy;
      });
    } else {
      list = [...list].sort((a, b) => {
        const ca = compositeByModel.get(a.id)?.mean ?? -1;
        const cb = compositeByModel.get(b.id)?.mean ?? -1;
        return cb - ca;
      });
    }
    return list;
  }, [matrix.models, query, sort, grid, compositeByModel]);

  const toggleCompare = (id: string) =>
    setCompare((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-24">
      <CountStrip counts={counts} matrix={matrix} board={board} />

      {/* CONTROLS */}
      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-4">
        <Control label="Rank by axis">
          <select
            value={sort.type === "axis" ? sort.axis : ""}
            onChange={(e) => {
              const v = e.target.value;
              setCompositeOn(false);
              setSort(v ? { type: "axis", axis: v } : { type: "model" });
            }}
            className="min-h-[40px] rounded-md border border-emerald-500/25 bg-[#052018] px-3 text-[13px] text-emerald-50"
          >
            <option value="">— none (A→Z, no rank) —</option>
            {shownAxes.map((a) => (
              <option key={a.id} value={a.id}>{axisMeta(a.id).label}</option>
            ))}
          </select>
        </Control>

        <Control label="Regulator lens (pointers only)">
          <select
            value={regime}
            onChange={(e) => setRegime(e.target.value as Regime | "")}
            className="min-h-[40px] rounded-md border border-emerald-500/25 bg-[#052018] px-3 text-[13px] text-emerald-50"
          >
            <option value="">— all axes —</option>
            {REGIMES.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </Control>

        <Control label="Find a model">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="filter rows…"
            className="min-h-[40px] w-48 rounded-md border border-emerald-500/25 bg-[#052018] px-3 text-[13px] text-emerald-50 placeholder:text-emerald-200/40"
          />
        </Control>

        <label className="flex min-h-[40px] cursor-pointer items-center gap-2 rounded-md border border-amber-400/30 bg-amber-400/[0.06] px-3 text-[13px] text-amber-100">
          <input
            type="checkbox"
            checked={compositeOn}
            onChange={(e) => {
              setCompositeOn(e.target.checked);
              setSort(e.target.checked ? { type: "composite" } : { type: "model" });
            }}
          />
          Opt-in composite
        </label>

        {compare.size > 0 && (
          <button
            onClick={() => setCompare(new Set())}
            className="min-h-[40px] rounded-md border border-emerald-500/25 px-3 text-[13px] text-emerald-200 hover:bg-emerald-500/10"
          >
            Clear compare ({compare.size})
          </button>
        )}
      </div>

      {regime && <RegimeNote regime={regime} shown={shownAxes.length} total={matrix.axes.length} />}
      {compositeOn && <CompositeNote count={(relevant ? relevant.size : axisIds.length)} />}

      {compare.size >= 2 && (
        <HeadToHead matrix={matrix} grid={grid} models={[...compare]} shownAxes={shownAxes} onClose={() => setCompare(new Set())} />
      )}

      {/* THE GRID */}
      <MatrixGrid
        matrix={matrix}
        grid={grid}
        rows={rows}
        shownAxes={shownAxes}
        sort={sort}
        onSortAxis={(ax) => { setCompositeOn(false); setSort({ type: "axis", axis: ax }); }}
        boardAxisByName={boardAxisByName}
        compositeOn={compositeOn}
        compositeByModel={compositeByModel}
        compare={compare}
        onToggleCompare={toggleCompare}
        onOpenProfile={setProfile}
        onVerifyCell={setVerifyCell}
      />

      <TwoInstrumentNote matrix={matrix} board={board} />
      <Methodology matrix={matrix} />
      <SelfAudit matrix={matrix} counts={counts} board={board} />
      <ShaVerifyBox pinnedKey={pinnedKey} />

      {profile && (
        <ModelProfileDrawer
          matrix={matrix}
          grid={grid}
          modelId={profile}
          boardAxisByName={boardAxisByName}
          pinnedKey={pinnedKey}
          onClose={() => setProfile(null)}
          onVerifyCell={setVerifyCell}
        />
      )}
      {verifyCell && <VerifyModal cell={verifyCell} pinnedKey={pinnedKey} onClose={() => setVerifyCell(null)} />}
    </div>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-300/60">{label}</span>
      {children}
    </div>
  );
}

/* ── live count strip ────────────────────────────────────────────────────── */

function CountStrip({ counts, matrix, board }: { counts: ReturnType<typeof deriveCounts>; matrix: FleetMatrix; board: any }) {
  const boardCount = board?.totals?.public_count
    ?? (typeof board?.totals?.measured_axes === "number" && typeof board?.totals?.axes === "number"
      ? `${board.totals.measured_axes} measured of ${board.totals.axes}`
      : null);
  const cov = counts.coverage;
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      <Stat n={counts.models} label="models (rows)" />
      <Stat n={counts.axes} label="signed axes (columns)" />
      <Stat n={counts.measuredCells} label="measured cells" />
      <Stat n={counts.possibleCells} label="possible cells" sub={cov !== null ? `${(cov * 100).toFixed(0)}% covered` : undefined} />
      <Stat n={counts.signedCells} label="signed cells" sub={counts.signedCells === counts.measuredCells ? "every cell signed" : undefined} />
      <Stat text={boardCount ?? "—"} label="governance board" sub="separate instrument · /api/gspc" />
    </div>
  );
}

function Stat({ n, text, label, sub }: { n?: number; text?: string; label: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.03] px-3 py-2.5">
      <div className="font-mono text-2xl font-black tabular-nums text-emerald-100">{text ?? (n ?? 0).toLocaleString()}</div>
      <div className="mt-0.5 text-[11px] leading-tight text-emerald-200/60">{label}</div>
      {sub && <div className="mt-0.5 text-[10px] leading-tight text-emerald-300/50">{sub}</div>}
    </div>
  );
}

function RegimeNote({ regime, shown, total }: { regime: Regime; shown: number; total: number }) {
  const info = REGIMES.find((r) => r.id === regime)!;
  return (
    <div className="mt-3 rounded-lg border border-sky-500/25 bg-sky-500/[0.06] px-4 py-3 text-[12.5px] text-sky-100/85">
      <strong>Regulator lens · {info.label}.</strong> Showing {shown} of {total} axes whose behaviour is relevant to
      reasoning about this regime. These are research <em>pointers</em> — which axes bear on the regime — <strong>not</strong> a
      finding of conformity, legality, or risk class. Council of AI measures; it does not adjudicate legal status. Read the
      primary law yourself.
    </div>
  );
}

function CompositeNote({ count }: { count: number }) {
  return (
    <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/[0.06] px-4 py-3 text-[12.5px] text-amber-100/90">
      <strong>Composite is opt-in, and here is the whole formula:</strong> the unweighted mean of each model&rsquo;s
      measured cells across the {count} selected axes. It averages <em>only</em> the axes a model was measured on, and it
      reports that count (<span className="font-mono">measured / of</span>) beside every score — a mean over the selected measures and a
      mean over 12 are not the same claim. No hidden weighting, no filled blanks. The per-axis columns stay visible
      beside it. This is a convenience, never a crown.
    </div>
  );
}

/* ── the matrix ──────────────────────────────────────────────────────────── */

function accColour(p: number): string {
  if (p >= 0.66) return "text-emerald-300";
  if (p >= 0.33) return "text-amber-300";
  return "text-slate-300";
}

function MatrixGrid(props: {
  matrix: FleetMatrix;
  grid: FleetGrid;
  rows: MatrixModel[];
  shownAxes: FleetMatrix["axes"];
  sort: SortKey;
  onSortAxis: (axis: string) => void;
  boardAxisByName: Map<string, GspcAxis>;
  compositeOn: boolean;
  compositeByModel: Map<string, import("@/lib/gspcFleet").CompositeRow>;
  compare: Set<string>;
  onToggleCompare: (id: string) => void;
  onOpenProfile: (id: string) => void;
  onVerifyCell: (cell: MatrixCell) => void;
}) {
  const { grid, rows, shownAxes, sort, onSortAxis, compositeOn, compositeByModel, compare, onToggleCompare, onOpenProfile, onVerifyCell, boardAxisByName } = props;

  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-emerald-500/15">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-[#04170f]">
            <th className="sticky left-0 z-20 min-w-[220px] bg-[#04170f] px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-emerald-300/70">
              Model
            </th>
            {compositeOn && (
              <th className="min-w-[92px] border-l border-emerald-500/10 px-2 py-2 text-center font-mono text-[10px] uppercase tracking-wider text-amber-200/80">
                Composite
              </th>
            )}
            {shownAxes.map((a) => {
              const meta = axisMeta(a.id);
              const active = sort.type === "axis" && sort.axis === a.id;
              const twin = meta.boardTwin ? boardAxisByName.get(meta.boardTwin.toLowerCase()) : undefined;
              return (
                <th
                  key={a.id}
                  className={`min-w-[92px] cursor-pointer border-l border-emerald-500/10 px-2 py-2 text-center align-bottom transition-colors hover:bg-emerald-500/10 ${active ? "bg-emerald-500/15" : ""}`}
                  onClick={() => onSortAxis(a.id)}
                  title={`${meta.blurb}\n\nClick to rank the fleet by this axis.${twin ? `\nGovernance twin: ${twin.axis} (n=${twin.n ?? "—"}).` : ""}`}
                >
                  <div className={`font-bold leading-tight ${active ? "text-emerald-200" : "text-emerald-100/85"}`}>{meta.label}</div>
                  <AxisStat axisId={a.id} matrix={props.matrix} twin={twin} />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={1 + (compositeOn ? 1 : 0) + shownAxes.length}
                className="px-4 py-10 text-center text-[12px] text-emerald-200/55"
              >
                No model matches that filter. Clear the search to see every measured row.
              </td>
            </tr>
          )}
          {rows.map((m, i) => {
            const comp = compositeByModel.get(m.id);
            const selected = compare.has(m.id);
            return (
              <tr key={m.id} className={`border-t border-emerald-500/8 ${i % 2 ? "bg-white/[0.012]" : ""} ${selected ? "bg-emerald-500/[0.07]" : ""} hover:bg-emerald-500/[0.05]`}>
                <th className={`sticky left-0 z-10 min-w-[220px] px-3 py-1.5 text-left font-normal ${selected ? "bg-[#08251a]" : "bg-[#04140d]"}`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleCompare(m.id)}
                      title="Add to head-to-head compare"
                      aria-label={`Add ${m.id} to head-to-head compare`}
                      className="shrink-0"
                    />
                    <button
                      onClick={() => onOpenProfile(m.id)}
                      className="truncate text-left font-mono text-[12px] text-emerald-100 hover:text-emerald-300 hover:underline"
                      title={`${m.id}\nMeasured on ${m.cards} of the measures. Open governance profile.`}
                    >
                      {m.id}
                    </button>
                    {!m.name_published && (
                      <span title="A retired internal brand was withheld; the measured work is kept and counted, only the label is neutralised. The name still lives in the card body, under the signature." className="shrink-0 rounded bg-slate-500/20 px-1 text-[9px] uppercase text-slate-300">
                        name withheld
                      </span>
                    )}
                  </div>
                </th>

                {compositeOn && (
                  <td className="border-l border-emerald-500/10 px-2 py-1.5 text-center">
                    {comp ? (
                      <div>
                        <span className="font-mono font-bold tabular-nums text-amber-200">{pct(comp.mean)}</span>
                        <div className="text-[9px] text-amber-200/50">{comp.measuredOn}/{comp.outOf} axes</div>
                      </div>
                    ) : (
                      <span className="text-emerald-200/25">—</span>
                    )}
                  </td>
                )}

                {shownAxes.map((a) => {
                  const cell = cellFor(grid, m.id, a.id);
                  return (
                    <td key={a.id} className="border-l border-emerald-500/8 px-1 py-1 text-center">
                      {cell ? (
                        <button
                          onClick={() => onVerifyCell(cell)}
                          title={`${m.id} · ${axisMeta(a.id).label}\naccuracy ${pct(cell.accuracy)}\ncard ${cell.card}\n${cell.signed ? "signed — click to verify" : "unsigned"}`}
                          className={`inline-flex w-full items-center justify-center gap-1 rounded px-1.5 py-1 font-mono tabular-nums hover:bg-emerald-500/15 ${accColour(cell.accuracy)}`}
                        >
                          {pct(cell.accuracy)}
                          {cell.signed && <span className="text-emerald-500/70" aria-label="signed">◈</span>}
                        </button>
                      ) : (
                        <span className="text-emerald-200/20" title="Never measured — this is not a zero. An empty cell is the honest part of the picture.">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-emerald-500/10 bg-[#04140d] px-3 py-2 text-[11px] text-emerald-200/55">
        ◈ = a signed cell; click it to recompute its Ed25519 card in your browser. Row order is presentation, not a
        separation claim — two adjacent rows may be statistically indistinguishable. Whether a lead is real is the
        governance board&rsquo;s separation test, below, not a column sort.
      </p>
    </div>
  );
}

/** The small stat under an axis header: leader interval where an n is real, else honest silence. */
function AxisStat({ axisId, matrix, twin }: { axisId: string; matrix: FleetMatrix; twin?: GspcAxis }) {
  const axis = matrix.axes.find((a) => a.id === axisId);
  if (!axis) return null;
  // Prefer the governance board's published interval + n for the twin; else the
  // *-30 family's declared n; else say nothing rather than invent an interval.
  const boardInterval = twin?.interval;
  const boardN = typeof twin?.n === "number" ? twin!.n : null;
  const parsedN = axisBankN(axisId);
  const w = boardInterval
    ? { lo: boardInterval[0], hi: boardInterval[1], n: boardN ?? 0, nSource: "governance board" }
    : wilson(axis.best_accuracy, boardN ?? parsedN, boardN ? "governance board n" : "axis id declares n");
  return (
    <div className="mt-1 space-y-0.5">
      <div className="text-[9px] text-emerald-300/50" title="Best measured figure on this axis across the fleet.">
        best {pct(axis.best_accuracy)}
      </div>
      {w ? (
        <div className="text-[9px] text-emerald-300/40" title={`Wilson 95% interval on the leader, n=${w.n} (${w.nSource}).`}>
          95% {pct(w.lo)}–{pct(w.hi)}
        </div>
      ) : (
        <div className="text-[9px] text-emerald-300/25" title="A compact card carries accuracy but not a per-cell n, and no governance twin publishes one — so no interval is shown rather than a fabricated one.">
          n on frozen bank
        </div>
      )}
      <div className="text-[9px] text-emerald-300/30">{axis.models} models</div>
    </div>
  );
}

/* ── two-instrument note ─────────────────────────────────────────────────── */

function TwoInstrumentNote({ matrix, board }: { matrix: FleetMatrix; board: any }) {
  return (
    <div className="mt-6 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-5 text-[13px] leading-relaxed text-emerald-100/80">
      <h2 className="text-[13px] font-bold uppercase tracking-wide text-emerald-300/80">Two instruments, never summed</h2>
      <p className="mt-2">
        This grid is the <strong>benchmark card corpus</strong>: {matrix.models.length} models measured on{" "}
        {matrix.axes.length} benchmark axes, one signed card per cell. The{" "}
        <Link href="/board" className="text-emerald-300 underline">governance board</Link>{" "}
        (<span className="font-mono">/api/gspc</span>
        {board?.totals?.axes ? `, ${board.totals.axes} slots` : ""}) is a <strong>different instrument</strong> measuring
        governance axes, and it is the authority on axis-level statistics — n, Wilson intervals, and the separation test.
        {" "}The two axis sets are different on purpose and are never added together. Where a benchmark axis has a
        governance twin, its column header borrows the board&rsquo;s interval and links across — it does not fuse the two
        counts. {matrix.not_the_board ? `“${matrix.not_the_board}”` : ""}
      </p>
    </div>
  );
}

/* ── methodology (persistent) ────────────────────────────────────────────── */

function Methodology({ matrix }: { matrix: FleetMatrix }) {
  return (
    <section className="mt-6 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-5">
      <h2 className="text-base font-bold text-emerald-100">How this is graded — and what it does <span className="underline">not</span> establish</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <ul className="space-y-2 text-[13px] text-emerald-100/80">
          <li><strong className="text-emerald-300">Deterministic grading.</strong> Gold labels on frozen banks. A cell is a proportion correct, graded by exact rule — no model judges another model.</li>
          <li><strong className="text-emerald-300">Every number recomputable.</strong> Each cell is one signed card whose sha256 <em>is</em> its id; the whole matrix is derived by reading those cards, never typed.</li>
          <li><strong className="text-emerald-300">Absence is shown.</strong> An unmeasured pair is empty, not zero. {matrix.counts.possible_cells ? `${matrix.cells.length} of ${matrix.counts.possible_cells} possible pairs are measured.` : ""}</li>
        </ul>
        <ul className="space-y-2 text-[13px] text-emerald-100/80">
          <li><strong className="text-rose-300">Not a certification.</strong> A cell is one score on one small bank on one date. It does not establish that a model is good, safe, legal, or better than another.</li>
          <li><strong className="text-rose-300">A sort is not a verdict.</strong> Ordering the fleet by an axis does not mean the top row beat the second — separation is tested by the governance board, not implied by rank.</li>
          <li><strong className="text-rose-300">Small banks.</strong> Several axes are read on ~30 frozen items. Treat a single cell as a signal, not a certificate.</li>
        </ul>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-[12px]">
        <Link href="/gspc-verify" className="rounded-md border border-emerald-500/30 px-3 py-1.5 text-emerald-200 hover:bg-emerald-500/10">Verify the chain yourself →</Link>
        <a href="/signed/HOW-TO-VERIFY.md" className="rounded-md border border-emerald-500/30 px-3 py-1.5 text-emerald-200 hover:bg-emerald-500/10">HOW-TO-VERIFY →</a>
        <a href="/signed/card-matrix.json" className="rounded-md border border-emerald-500/30 px-3 py-1.5 text-emerald-200 hover:bg-emerald-500/10">The signed matrix (JSON) →</a>
        <Link href="/methodology" className="rounded-md border border-emerald-500/30 px-3 py-1.5 text-emerald-200 hover:bg-emerald-500/10">Full methodology →</Link>
      </div>
    </section>
  );
}

/* ── self-audit (lead by example) ────────────────────────────────────────── */

function SelfAudit({ matrix, counts, board }: { matrix: FleetMatrix; counts: ReturnType<typeof deriveCounts>; board: any }) {
  // Which axes rest on a small fleet — derived, not judged by hand.
  const thin = [...matrix.axes].filter((a) => a.models < 10).sort((a, b) => a.models - b.models);
  const cov = counts.coverage;
  return (
    <section className="mt-6 rounded-xl border border-amber-400/25 bg-amber-400/[0.04] p-5">
      <h2 className="text-base font-bold text-amber-100">The board audits itself</h2>
      <p className="mt-1 text-[12.5px] text-amber-100/75">A governance board that will not state its own limits is not governing anything. Here are ours, derived live.</p>
      <ul className="mt-3 grid gap-2 text-[13px] text-amber-50/85 md:grid-cols-2">
        <li>
          <strong>Coverage is partial by design.</strong>{" "}
          {cov !== null ? `Only ${(cov * 100).toFixed(0)}% of possible model×axis pairs are measured (${counts.measuredCells} of ${counts.possibleCells}).` : ""}{" "}
          The empty cells are shown, not hidden.
        </li>
        <li>
          <strong>Some axes have small n.</strong>{" "}
          {thin.length
            ? `${thin.length} of the measures rest on fewer than 10 models each: ${thin.slice(0, 4).map((a) => `${axisMeta(a.id).label} (${a.models})`).join(", ")}${thin.length > 4 ? "…" : ""}.`
            : "Every axis carries at least 10 models."}
        </li>
        <li>
          <strong>Per-cell n is not on the compact card.</strong> Cards carry accuracy, not the bank size, so most inline
          Wilson intervals come from the governance twin or the axis&rsquo;s declared bank — and where neither exists we
          show none rather than invent one.
        </li>
        <li>
          <strong>The living stamp is UNCHECKABLE by a stranger.</strong> The signed cards are verifiable; the claim that
          this corpus is the <em>current</em> one rests on the board&rsquo;s attestation, not on cryptography a visitor can
          re-run. See the{" "}
          <Link href="/refutation-ledger" className="underline">corrections ledger</Link>.
        </li>
        {counts.withheldNames > 0 && (
          <li>
            <strong>{counts.withheldNames} model names are withheld.</strong> A retired internal brand is indexed under a
            neutral key; the measured work is kept and counted, and the real name still lives in the card body under the
            signature.
          </li>
        )}
        {board?.totals?.axes && (
          <li>
            <strong>The board is a different instrument.</strong> Its {board.totals.axes}-slot governance count is not this
            grid&rsquo;s {matrix.axes.length}-axis count, and the two are never summed.
          </li>
        )}
      </ul>
    </section>
  );
}

/* ── SHA-paste verify box ────────────────────────────────────────────────── */

function ShaVerifyBox({ pinnedKey }: { pinnedKey: Uint8Array | null }) {
  const [sha, setSha] = useState("");
  const [busy, setBusy] = useState(false);
  const [verdict, setVerdict] = useState<CardVerdict | null>(null);

  async function run() {
    const id = sha.trim().replace(/^.*\//, "").replace(/\.json$/i, "");
    if (!/^[0-9a-f]{64}$/i.test(id)) {
      setVerdict({ state: "UNCHECKABLE", reason: "Paste a 64-hex card sha (or a /signed/cards/…json URL)." });
      return;
    }
    setBusy(true);
    setVerdict(null);
    try {
      const card = await fetchCardByUrl(`/signed/cards/${id}.json`);
      setVerdict(await verifyCard(card, pinnedKey));
    } catch (e: any) {
      setVerdict({ state: "UNCHECKABLE", reason: `Could not fetch that card: ${e?.message ?? e}.` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
      <h2 className="text-base font-bold text-emerald-100">Paste a card SHA → verify it here</h2>
      <p className="mt-1 text-[12.5px] text-emerald-100/70">
        Recomputes the card&rsquo;s sha256 and checks the Ed25519 signature against the key in{" "}
        <span className="font-mono">did:web:csoai.org#card-attestation-1</span>, in your browser. Nothing is sent.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={sha}
          onChange={(e) => setSha(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="paste a 64-hex card sha…"
          className="min-h-[42px] flex-1 rounded-md border border-emerald-500/25 bg-[#052018] px-3 font-mono text-[12px] text-emerald-50 placeholder:text-emerald-200/40"
        />
        <button
          onClick={run}
          disabled={busy}
          className="min-h-[42px] rounded-md border border-amber-400/60 bg-emerald-500 px-5 font-bold text-[#03110b] hover:bg-emerald-400 disabled:opacity-50"
        >
          {busy ? "Verifying…" : "Verify"}
        </button>
      </div>
      {verdict && <VerdictLine verdict={verdict} />}
    </section>
  );
}

function VerdictLine({ verdict }: { verdict: CardVerdict }) {
  const tone =
    verdict.state === "VALID" ? "border-emerald-500/40 bg-emerald-500/12 text-emerald-100"
      : verdict.state === "INVALID" ? "border-rose-500/40 bg-rose-500/12 text-rose-100"
        : "border-slate-500/40 bg-slate-500/12 text-slate-200";
  return (
    <div className={`mt-3 rounded-lg border px-4 py-3 text-[13px] ${tone}`}>
      <div className="font-mono font-bold">{verdict.state}{verdict.axis ? ` · ${verdict.axis}` : ""}</div>
      <div className="mt-1 opacity-90">{verdict.reason}</div>
      {verdict.digest && <div className="mt-1 font-mono text-[11px] opacity-60">sha256 {shortSha(verdict.digest)}</div>}
    </div>
  );
}

/* ── per-cell verify modal ───────────────────────────────────────────────── */

function VerifyModal({ cell, pinnedKey, onClose }: { cell: MatrixCell; pinnedKey: Uint8Array | null; onClose: () => void }) {
  const [verdict, setVerdict] = useState<CardVerdict | null>(null);
  const [busy, setBusy] = useState(true);
  const [body, setBody] = useState<any>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const card = await fetchCardByUrl(cell.card_url);
        if (live) setBody((card as any)?.body ?? null);
        const v = await verifyCard(card, pinnedKey);
        if (live) setVerdict(v);
      } catch (e: any) {
        if (live) setVerdict({ state: "UNCHECKABLE", reason: `Could not fetch the card: ${e?.message ?? e}.` });
      } finally {
        if (live) setBusy(false);
      }
    })();
    return () => { live = false; };
  }, [cell, pinnedKey]);

  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-emerald-500/25 bg-[#04170f] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[12px] text-emerald-100">{cell.model}</div>
            <div className="text-[12px] text-emerald-300/70">{axisMeta(cell.axis).label} · <span className="font-mono">{pct(cell.accuracy)}</span></div>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="text-emerald-300/60 hover:text-emerald-200">✕</button>
        </div>
        <div className="mt-3 rounded bg-black/30 p-2 font-mono text-[11px] text-emerald-200/70">
          card {shortSha(cell.card)}
          <br />
          <a href={cell.card_url} className="text-emerald-300 underline">{cell.card_url}</a>
        </div>
        {busy ? (
          <div className="mt-3 font-mono text-[12px] text-emerald-300/70">LOADING — recomputing in your browser…</div>
        ) : verdict ? (
          <VerdictLine verdict={verdict} />
        ) : null}
        {body && (
          <details className="mt-3">
            <summary className="cursor-pointer text-[12px] text-emerald-300/70">signed card body</summary>
            <pre className="mt-2 max-h-52 overflow-auto rounded bg-black/40 p-3 text-[11px] text-emerald-100/80">{JSON.stringify(body, null, 2)}</pre>
          </details>
        )}
        <div className="mt-3 text-[11px] text-emerald-200/50">
          Prefer the full verifier? <Link href="/gspc-verify" className="underline">/gspc-verify</Link>.
        </div>
      </div>
    </Overlay>
  );
}

/* ── head-to-head compare ────────────────────────────────────────────────── */

function HeadToHead({ matrix, grid, models, shownAxes, onClose }: { matrix: FleetMatrix; grid: FleetGrid; models: string[]; shownAxes: FleetMatrix["axes"]; onClose: () => void }) {
  return (
    <section className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-400/[0.05] p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-emerald-100">Head-to-head · {models.length} models, every axis, tradeoffs explicit</h2>
        <button onClick={onClose} className="text-[12px] text-emerald-300/60 hover:text-emerald-200">clear</button>
      </div>
      <p className="mt-1 text-[12px] text-emerald-100/70">
        No overall winner is declared. Each axis shows who leads <em>there</em>; a blank means that model was never
        measured on that axis. A close gap is a close gap — not a tested separation.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-[#04170f]">
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase text-emerald-300/70">Axis</th>
              {models.map((m) => (
                <th key={m} className="border-l border-emerald-500/10 px-3 py-2 text-center font-mono text-[11px] text-emerald-100">{m}</th>
              ))}
              <th className="border-l border-emerald-500/10 px-3 py-2 text-center font-mono text-[10px] uppercase text-emerald-300/70">Leads here</th>
            </tr>
          </thead>
          <tbody>
            {shownAxes.map((a) => {
              const vals = models.map((m) => ({ m, cell: cellFor(grid, m, a.id) }));
              const measured = vals.filter((v) => v.cell);
              const best = measured.length ? Math.max(...measured.map((v) => v.cell!.accuracy)) : null;
              const leaders = measured.filter((v) => v.cell!.accuracy === best).map((v) => v.m);
              const tie = leaders.length > 1;
              return (
                <tr key={a.id} className="border-t border-emerald-500/8">
                  <td className="px-3 py-1.5 text-emerald-100/85" title={axisMeta(a.id).blurb}>{axisMeta(a.id).label}</td>
                  {vals.map((v) => (
                    <td key={v.m} className={`border-l border-emerald-500/8 px-3 py-1.5 text-center font-mono tabular-nums ${v.cell ? (best !== null && v.cell.accuracy === best ? "font-bold text-emerald-300" : accColour(v.cell.accuracy)) : "text-emerald-200/20"}`}>
                      {v.cell ? pct(v.cell.accuracy) : "—"}
                    </td>
                  ))}
                  <td className="border-l border-emerald-500/8 px-3 py-1.5 text-center text-[11px]">
                    {best === null ? <span className="text-emerald-200/30">neither measured</span>
                      : tie ? <span className="text-amber-300">tie — no winner</span>
                        : <span className="text-emerald-300">{leaders[0].length > 16 ? leaders[0].slice(0, 14) + "…" : leaders[0]}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ── model governance-profile drawer ─────────────────────────────────────── */

function ModelProfileDrawer(props: {
  matrix: FleetMatrix;
  grid: FleetGrid;
  modelId: string;
  boardAxisByName: Map<string, GspcAxis>;
  pinnedKey: Uint8Array | null;
  onClose: () => void;
  onVerifyCell: (cell: MatrixCell) => void;
}) {
  const { matrix, grid, modelId, onClose, onVerifyCell } = props;
  const model = matrix.models.find((m) => m.id === modelId);
  const rows = matrix.axes.map((a) => ({ axis: a, cell: cellFor(grid, modelId, a.id) }));
  const measured = rows.filter((r) => r.cell) as { axis: FleetMatrix["axes"][number]; cell: MatrixCell }[];
  const best = [...measured].sort((a, b) => b.cell.accuracy - a.cell.accuracy).slice(0, 3);
  const worst = [...measured].sort((a, b) => a.cell.accuracy - b.cell.accuracy).slice(0, 3);
  const unmeasured = rows.filter((r) => !r.cell);

  return (
    <Overlay onClose={onClose}>
      <div className="ml-auto h-full w-full max-w-2xl overflow-y-auto border-l border-emerald-500/25 bg-[#04170f] p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-300/60">Governance profile</div>
            <h2 className="mt-1 font-mono text-lg font-bold text-emerald-100">{modelId}</h2>
            {model && (
              <div className="mt-1 text-[12px] text-emerald-200/70">
                measured on {model.cards} axes · mean {pct(model.mean_accuracy)} · best {pct(model.best_accuracy)}
                {!model.name_published && <span className="ml-2 rounded bg-slate-500/20 px-1 text-[10px] text-slate-300">name withheld</span>}
              </div>
            )}
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="text-emerald-300/60 hover:text-emerald-200">✕</button>
        </div>

        <p className="mt-3 text-[12px] text-emerald-100/70">
          Strengths and weaknesses are both shown — that is the point. A profile that hides where a model is weak is the
          malpractice this board corrects.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ProfileList title="Strongest axes" tone="emerald" rows={best} onVerifyCell={onVerifyCell} />
          <ProfileList title="Weakest axes (shown, not hidden)" tone="rose" rows={worst} onVerifyCell={onVerifyCell} />
        </div>

        <h3 className="mt-5 text-[12px] font-bold uppercase tracking-wide text-emerald-300/70">Every axis</h3>
        <div className="mt-2 divide-y divide-emerald-500/10 rounded-lg border border-emerald-500/15">
          {rows.map(({ axis, cell }) => {
            const meta = axisMeta(axis.id);
            const regs = REGIMES.map((r) => ({ r, p: regulationForAxis(axis.id, r.id) })).filter((x) => x.p);
            return (
              <div key={axis.id} className="flex items-start justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-emerald-100">{meta.label}</div>
                  <div className="truncate text-[11px] text-emerald-200/55">{meta.blurb}</div>
                  {regs.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {regs.map(({ r, p }) => (
                        <span key={r.id} title={`${p!.ref} — ${p!.why} (pointer, not a legal determination)`} className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[9px] text-sky-200">
                          {r.label}: {p!.ref}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {cell ? (
                    <button onClick={() => onVerifyCell(cell)} className={`font-mono text-[13px] font-bold hover:underline ${accColour(cell.accuracy)}`} title="Verify this cell's signed card">
                      {pct(cell.accuracy)} <span className="text-emerald-500/70">◈</span>
                    </button>
                  ) : (
                    <span className="text-[12px] text-emerald-200/25" title="Never measured — not a zero.">— unmeasured</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-emerald-200/50">
          {measured.length} measured, {unmeasured.length} unmeasured. The regulation chips are research pointers to where
          an axis is relevant under a regime — never a finding of conformity or legality.
        </p>
      </div>
    </Overlay>
  );
}

function ProfileList({ title, tone, rows, onVerifyCell }: { title: string; tone: "emerald" | "rose"; rows: { axis: FleetMatrix["axes"][number]; cell: MatrixCell }[]; onVerifyCell: (c: MatrixCell) => void }) {
  const head = tone === "emerald" ? "text-emerald-300" : "text-rose-300";
  return (
    <div className="rounded-lg border border-emerald-500/15 p-3">
      <div className={`text-[11px] font-bold uppercase tracking-wide ${head}`}>{title}</div>
      <ul className="mt-2 space-y-1">
        {rows.length ? rows.map(({ axis, cell }) => (
          <li key={axis.id} className="flex items-center justify-between gap-2 text-[12px]">
            <span className="truncate text-emerald-100/80">{axisMeta(axis.id).label}</span>
            <button onClick={() => onVerifyCell(cell)} className={`shrink-0 font-mono ${accColour(cell.accuracy)} hover:underline`}>{pct(cell.accuracy)} ◈</button>
          </li>
        )) : <li className="text-[12px] text-emerald-200/40">none</li>}
      </ul>
    </div>
  );
}

/* ── overlay shell ───────────────────────────────────────────────────────── */

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === ref.current) onClose(); }}
    >
      {children}
    </div>
  );
}

/* ── footer ──────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <div className="border-t border-emerald-500/15">
      <div className="mx-auto max-w-[1400px] px-5 py-8 text-[12px] text-emerald-200/50">
        Council of AI measures AI systems against the rules that govern them and signs the result. It issues no
        conformity marks and no certification. Verification is free forever; a grade is never sold.
      </div>
    </div>
  );
}
