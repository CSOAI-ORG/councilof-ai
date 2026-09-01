import { Fragment, useEffect, useMemo, useState } from "react";

/**
 * GspcTerminal — the interactive GSPC board, the one dashboard centrepiece.
 *
 * One board, every surface a window onto it. This reads the LIVE sources and
 * never types a count or a score:
 *   · GET /api/gspc              — the 22-axis board (leader, n, interval, separation, status)
 *   · GET /arena/elo_reference.json — signed per-axis model rankings (Ed25519, content_id)
 *   · GET /signed/card_index.json   — signed measurement cards, for verify links
 *
 * Honesty is built in: UNMEASURED / declared slots stay UNMEASURED — never 0.000.
 * A TIE never crowns a winner. Measurement, not certification. Nothing is written here.
 */

const GSPC_URL = "/api/gspc";
const ELO_URL = "/arena/elo_reference.json";
const CARD_INDEX_URL = "/signed/card_index.json";
const NPX_LINE = "npx -y csoai-gspc-mcp";

/** Board axis id → per-axis Elo key. Only these board axes carry a per-model ranking. */
const AXIS_TO_ELO: Record<string, string> = {
  governance: "gov",
  safety: "safety",
  provenance: "provenance",
  continuity: "continuity",
  affect: "affect",
  care: "care",
  jail: "jail",
};

/** Card-index axis-group name for a board axis (for the per-axis verify link). */
const AXIS_TO_CARDGROUP: Record<string, string[]> = {
  governance: ["gspc-governance", "gov"],
  safety: ["gspc-safety"],
  provenance: ["gspc-provenance"],
  continuity: ["gspc-continuity"],
  conformance: ["gspc-conformance"],
  openness: ["gspc-openness"],
  care: ["care", "care-refusal-help", "care-refusal-protect"],
  jail: ["jail-escape-detection"],
  swarm: ["swarm-candidates"],
};

type Axis = {
  axis: string;
  family?: string;
  kind?: string;
  bench?: string;
  task?: string;
  n?: number;
  accuracy?: number;
  leader?: string;
  separation?: string;
  separation_p?: number;
  interval?: number[];
  fleet_mean?: number;
  status?: string;
  note?: string;
  dataset_url?: string;
};

type Totals = { public_count?: string; count_grammar?: string; axes?: number; measured_axes?: number };
type Board = { axes?: Axis[]; totals?: Totals };

type EloRow = { model: string; elo: number; winrate: number; ci?: number[]; games: number; axis?: string };
type Elo = {
  per_axis?: Record<string, EloRow[]>;
  leaderboard?: EloRow[];
  models?: number;
  generated?: string;
  content_id?: string;
  method?: string;
  register?: string;
  signature?: { alg?: string; pubkey?: string; sig?: string; content_id?: string };
};

type CardIndex = { cards?: { axis?: string; card?: string; card_url?: string; signed?: boolean }[]; n_cards?: number };

type Load<T> = { state: "loading" | "ok" | "error"; data?: T; err?: string };

function useJson<T>(url: string): Load<T> {
  const [v, setV] = useState<Load<T>>({ state: "loading" });
  useEffect(() => {
    const ac = new AbortController();
    fetch(url, { signal: ac.signal, headers: { accept: "application/json" } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as T;
      })
      .then((data) => setV({ state: "ok", data }))
      .catch((e) => {
        if (ac.signal.aborted) return;
        setV({ state: "error", err: String(e?.message || e) });
      });
    return () => ac.abort();
  }, [url]);
  return v;
}

const pct = (x: number | undefined): string =>
  typeof x === "number" && Number.isFinite(x) ? `${(x * 100).toFixed(1)}%` : "—";

const ivText = (iv: number[] | undefined): string =>
  Array.isArray(iv) && iv.length === 2 && iv.every((n) => Number.isFinite(n))
    ? `${(iv[0] * 100).toFixed(0)}–${(iv[1] * 100).toFixed(0)}%`
    : "no interval";

const isMeasuredModelAxis = (a: Axis): boolean =>
  a.status === "MEASURED" && a.kind === "model-comparison" && typeof a.accuracy === "number";

const isFacts = (a: Axis): boolean =>
  a.status === "MEASURED" && a.kind !== "model-comparison";

function StatusChip({ a }: { a: Axis }) {
  const sep = a.separation;
  if (isMeasuredModelAxis(a)) {
    const tone =
      sep === "SEPARATED"
        ? "bg-emerald-100 text-emerald-800"
        : sep === "TIE"
          ? "bg-slate-100 text-slate-600"
          : "bg-amber-100 text-amber-800";
    return (
      <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${tone}`}>
        {sep === "SEPARATED" ? "SEPARATED" : sep === "TIE" ? "TIE" : sep || "MEASURED"}
      </span>
    );
  }
  if (isFacts(a)) {
    return (
      <span className="rounded bg-sky-100 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-sky-800">
        FACTS
      </span>
    );
  }
  return (
    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-slate-500">
      {a.status || "UNMEASURED"}
    </span>
  );
}

/** The board figure for a row — never 0.000 for an unmeasured slot. */
function figure(a: Axis): string {
  if (isMeasuredModelAxis(a)) return pct(a.accuracy);
  if (isFacts(a)) return "facts";
  return "UNMEASURED";
}

function ModelRankings({ axis, rows }: { axis: Axis; rows: EloRow[] }) {
  const separated = axis.separation === "SEPARATED";
  const top = [...rows].sort((x, y) => y.elo - x.elo).slice(0, 9);
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-slate-500">
          Top models · signed Elo reference
        </span>
        {separated ? (
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-emerald-800">
            separated leader
          </span>
        ) : (
          <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-slate-700">
            no separated winner · ranked by point estimate
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 font-mono text-[9px] uppercase tracking-wider text-slate-400">
              <th className="py-1 pr-2 font-medium">#</th>
              <th className="py-1 pr-2 font-medium">Model</th>
              <th className="py-1 pr-2 text-right font-medium">Win-rate</th>
              <th className="py-1 pr-2 text-right font-medium">95% CI</th>
              <th className="py-1 pr-2 text-right font-medium">n (games)</th>
              <th className="py-1 pr-2 text-right font-medium">Elo</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[11px] tabular-nums text-slate-700">
            {top.map((m, i) => (
              <tr key={m.model} className="border-b border-slate-100 last:border-0">
                <td className="py-1 pr-2 text-slate-400">{i + 1}</td>
                <td className="py-1 pr-2 font-sans text-[11px] font-medium text-slate-900">
                  {m.model}
                  {i === 0 && separated && (
                    <span className="ml-1 text-emerald-700" title="separated leader">
                      ★
                    </span>
                  )}
                </td>
                <td className="py-1 pr-2 text-right">{pct(m.winrate)}</td>
                <td className="py-1 pr-2 text-right text-slate-500">{ivText(m.ci)}</td>
                <td className="py-1 pr-2 text-right">{m.games}</td>
                <td className="py-1 pr-2 text-right text-slate-500">{Math.round(m.elo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!separated && (
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          Ordering is the point estimate, not a declared winner: on this axis the lead is a TIE
          (McNemar not separated). A row can top the list and still carry no measured advantage.
        </p>
      )}
    </div>
  );
}

function AxisDrilldown({
  a,
  elo,
  cardIndex,
}: {
  a: Axis;
  elo: Load<Elo>;
  cardIndex: Load<CardIndex>;
}) {
  const eloKey = AXIS_TO_ELO[a.axis];
  const rows = eloKey && elo.state === "ok" ? elo.data?.per_axis?.[eloKey] : undefined;

  const groups = AXIS_TO_CARDGROUP[a.axis] || [a.axis];
  const cardCount =
    cardIndex.state === "ok"
      ? (cardIndex.data?.cards || []).filter((c) => c.axis && groups.includes(c.axis)).length
      : 0;

  return (
    <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-4">
      {/* Board-level facts for this axis — always shown, straight from /api/gspc */}
      <div className="mb-3 grid gap-x-6 gap-y-1 text-[11px] sm:grid-cols-2">
        {a.leader && (
          <div>
            <span className="font-mono uppercase tracking-wide text-slate-400">Leader </span>
            <span className="font-medium text-slate-900">{a.leader}</span>
          </div>
        )}
        {typeof a.n === "number" && (
          <div>
            <span className="font-mono uppercase tracking-wide text-slate-400">n </span>
            <span className="font-mono tabular-nums text-slate-700">{a.n}</span>
            {Array.isArray(a.interval) && (
              <span className="ml-2 font-mono text-slate-500">{ivText(a.interval)}</span>
            )}
          </div>
        )}
        {typeof a.fleet_mean === "number" && (
          <div>
            <span className="font-mono uppercase tracking-wide text-slate-400">Fleet mean </span>
            <span className="font-mono tabular-nums text-slate-700">{pct(a.fleet_mean)}</span>
          </div>
        )}
        {a.separation && (
          <div>
            <span className="font-mono uppercase tracking-wide text-slate-400">Separation </span>
            <span className="font-mono text-slate-700">
              {a.separation}
              {typeof a.separation_p === "number" ? ` (p=${a.separation_p})` : ""}
            </span>
          </div>
        )}
      </div>

      {a.note && <p className="mb-3 text-[11px] leading-relaxed text-slate-600">{a.note}</p>}

      {/* Per-model ranking where a signed reference exists; honest absence otherwise */}
      {rows && rows.length > 0 ? (
        <ModelRankings axis={a} rows={rows} />
      ) : isFacts(a) ? (
        <p className="text-[11px] leading-relaxed text-slate-500">
          Deterministic-facts axis — a coverage read over its own declared universe, with no model
          fleet and therefore no leader, accuracy or separation. It is measured; it is not a contest.
        </p>
      ) : a.status !== "MEASURED" ? (
        <p className="text-[11px] leading-relaxed text-slate-500">
          Declared slot — published so the gap is visible. UNMEASURED is a first-class status: no run
          stands behind it yet, and a zero would be a fabricated measurement.
        </p>
      ) : (
        <p className="text-[11px] leading-relaxed text-slate-500">
          Per-model ranking is not published for this axis — the board carries the leader, its
          interval and the fleet mean above. No fabricated ladder is shown.
        </p>
      )}

      {/* Verify — every figure recomputable */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px]">
        <a href="/gspc-verify" className="font-mono font-semibold text-emerald-700 hover:underline">
          Verify signed cards →
        </a>
        {cardCount > 0 && (
          <span className="font-mono text-slate-400">
            {cardCount} signed card{cardCount === 1 ? "" : "s"} for this axis
          </span>
        )}
        {a.dataset_url && (
          <a href={a.dataset_url} className="font-mono text-slate-500 hover:underline" target="_blank" rel="noreferrer">
            dataset ↗
          </a>
        )}
      </div>
    </div>
  );
}

export default function GspcTerminal({ className }: { className?: string }) {
  const board = useJson<Board>(GSPC_URL);
  const elo = useJson<Elo>(ELO_URL);
  const cardIndex = useJson<CardIndex>(CARD_INDEX_URL);
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const axes = board.state === "ok" ? board.data?.axes || [] : [];
  const totals = board.state === "ok" ? board.data?.totals : undefined;

  // Search matches an axis by its own text OR by a model name inside its ranking.
  const query = q.trim().toLowerCase();
  const modelMatch = useMemo(() => {
    if (!query || elo.state !== "ok") return new Set<string>();
    const hit = new Set<string>();
    for (const [board_axis, eloKey] of Object.entries(AXIS_TO_ELO)) {
      const rows = elo.data?.per_axis?.[eloKey] || [];
      if (rows.some((r) => r.model.toLowerCase().includes(query))) hit.add(board_axis);
    }
    return hit;
  }, [query, elo]);

  const filtered = axes.filter((a) => {
    if (!query) return true;
    const hay = `${a.axis} ${a.bench || ""} ${a.task || ""} ${a.leader || ""}`.toLowerCase();
    return hay.includes(query) || modelMatch.has(a.axis);
  });

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white ${className || ""}`} aria-label="GSPC board terminal">
      {/* Terminal header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-slate-900 px-4 py-3 text-white rounded-t-2xl">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
            GSPC terminal · one board
          </p>
          <p className="mt-1 font-mono text-[12px] text-slate-300">
            {board.state === "loading" && "Reading GET /api/gspc…"}
            {board.state === "error" && "GET /api/gspc UNREACHABLE — the board is not shown rather than shown stale."}
            {board.state === "ok" && (totals?.public_count || "Live from GET /api/gspc")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {/* Dynamic, live badge — the count is the endpoint's, never typed */}
          <img src="/api/badge" alt="GSPC live badge" height={20} className="h-5" />
          <code className="rounded bg-black/40 px-2 py-1 font-mono text-[10px] text-emerald-300">{NPX_LINE}</code>
        </div>
      </div>

      {/* Search / explore */}
      <div className="border-b border-slate-200 px-4 py-2.5">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search axis or model — e.g. governance, mistral, qwen…"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          aria-label="Search the GSPC board by axis or model"
        />
      </div>

      {/* Board table */}
      {board.state === "error" ? (
        <div className="px-4 py-10 text-center font-mono text-[12px] text-slate-500">
          GET /api/gspc UNREACHABLE. One board — when it cannot be read, nothing is shown in its place.
        </div>
      ) : board.state === "loading" ? (
        <div className="px-4 py-10 text-center font-mono text-[12px] text-slate-400">LOADING · GET /api/gspc</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 font-mono text-[9px] uppercase tracking-wider text-slate-400">
                <th className="px-4 py-2 font-medium">Axis</th>
                <th className="px-2 py-2 font-medium">Bench</th>
                <th className="px-2 py-2 text-right font-medium">Figure</th>
                <th className="px-2 py-2 text-right font-medium">n</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium" aria-hidden />
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const isOpen = open === a.axis;
                const canDrill = true;
                return (
                  <Fragment key={a.axis}>
                    <tr
                      onClick={() => setOpen(isOpen ? null : a.axis)}
                      className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-emerald-50/50 ${isOpen ? "bg-emerald-50/60" : ""}`}
                    >
                      <td className="px-4 py-2.5 text-[12px] font-semibold text-slate-900">{a.axis}</td>
                      <td className="px-2 py-2.5 text-[11px] text-slate-500">{a.bench || a.task || "—"}</td>
                      <td className="px-2 py-2.5 text-right font-mono text-[12px] tabular-nums">
                        {isMeasuredModelAxis(a) ? (
                          <span className="font-semibold text-emerald-800">{figure(a)}</span>
                        ) : isFacts(a) ? (
                          <span className="text-sky-700">facts</span>
                        ) : (
                          <span className="text-slate-400">UNMEASURED</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono text-[11px] tabular-nums text-slate-600">
                        {typeof a.n === "number" && a.n > 0 ? a.n : "—"}
                      </td>
                      <td className="px-2 py-2.5">
                        <StatusChip a={a} />
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[10px] text-slate-400">
                        {canDrill ? (isOpen ? "▾" : "▸") : ""}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <AxisDrilldown a={a} elo={elo} cardIndex={cardIndex} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center font-mono text-[11px] text-slate-400">
                    No axis or model matches “{q}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Terminal footer — provenance + register */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-2.5 text-[10px] text-slate-500">
        <span className="font-mono">
          Measurement, not certification · empty cells stay empty · nothing is written here.
        </span>
        <span className="font-mono">
          {elo.state === "ok" && elo.data?.content_id
            ? `Elo reference signed · content_id ${elo.data.content_id.slice(0, 10)}…`
            : elo.state === "error"
              ? "Elo reference UNREACHABLE"
              : "Elo reference LOADING…"}
        </span>
      </div>
    </section>
  );
}
