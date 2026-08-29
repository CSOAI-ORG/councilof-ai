// GSPC — the behavioural governance axes, as measured state.
//
// NOT A COUNT AUTHORITY. This file holds a local SNAPSHOT of the behavioural
// family, used as an offline fallback for the axis ROWS. It is not the board and
// its length is not the board's axis count: the board also carries the
// financial/domain family (ADR-001). Anything that renders a COUNT must derive it
// from GET /api/gspc — see client/src/lib/boardCount.ts. The header of this file
// used to say "the twelve governance axis", which is how a stale snapshot count
// ends up quoted as the board's.
//
// This is the single source of truth for every SOV OS panel. The invariant that
// matters more than anything visual: an axis only carries a score when its status
// is MEASURED. UNMEASURED / DRAFT / SPEC / PLANNED axes carry their real state and
// NO number. `quotable()` is the structural guard — panels ask it rather than
// deciding for themselves, so a surface cannot render a score an axis has not earned.

import { BOARD_COUNT_OBSERVED } from "./boardCount";

export type AxisStatus = "MEASURED" | "UNMEASURED" | "DRAFT" | "SPEC" | "PLANNED";

export interface Axis {
  axis: string;
  bench: string;
  n: number;
  /**
   * NULL WHEN THE BOARD PUBLISHES NONE — never coerced to 0.
   *
   * These were `number` and the wire reader wrote `Number(w.macro_f1 ?? 0)`, so
   * an axis that publishes `null` arrived as a hard `0` and every panel printed
   * it as a measured figure. Live proof on 2026-08-26: /api/gspc ships
   * `provenance-controls` as MEASURED, n=6, `accuracy: null`, `macro_f1: null`
   * (it is a mainnet read of 6 issuer accounts, not a model comparison, so it
   * HAS no accuracy) — and /os rendered `0.000 accuracy · n=6 · macro F1 0.000`.
   * A fabricated zero on a MEASURED row is worse than an empty cell: an empty
   * cell reads as unmeasured, a zero reads as a total failure that never
   * happened. `jail` and `swarm` likewise publish no macro_f1 and were printing
   * `macro F1 0.000`.
   */
  macro_f1: number | null;
  /** Null when the board publishes none. See macro_f1 — same defect, same rule. */
  accuracy: number | null;
  unparsed_rate: number;
  status: AxisStatus;
  colour: string;
  lng: number;
  lat: number;
  seat: string;
  instrument: string;
  task: string;
  note?: string;
  /** The published dataset slug, e.g. "csoai/gspc-gov". NEVER construct this from
   *  the axis name: the axes are `governance`/`safety` but the datasets are
   *  `gspc-gov`/`gspc-agi`, so a constructed link 401s. Always use what /api/gspc
   *  publishes; when it is absent the UI shows no link rather than a broken one. */
  dataset?: string;
  /** The resolved, fetchable bank URL. /api/gspc derives it from `dataset` and a single
   *  BANK_HOST constant (functions/api/gspc.ts), so the host lives in ONE place and a
   *  surface never concatenates its own. Prefer this over `dataset`; fall back only when
   *  the wire has not shipped it yet. */
  dataset_url?: string;
  /** Wilson 95% interval as published on the wire. Absent means withheld, not computed here. */
  interval?: [number, number];
  /** McNemar determination as published: SEPARATED | TIE | UNTESTED. */
  separation?: string;
  separation_p?: number;
  kind?: string;
}

export const MEASURED_ON = { date: "2026-08-12", model: "Council-34" };

export const AXES: Axis[] = [
  { axis: "governance", bench: "GovBench", n: 237, macro_f1: 0.705, accuracy: 0.7, unparsed_rate: 0.0386, status: "MEASURED",
    colour: "#34d399", lng: 4.37, lat: 50.84, seat: "Brussels", instrument: "EU AI Act (Reg. 2024/1689)",
    task: "EU AI Act risk-tier classification",
    note: "v2 bank: 237 public items (+102 held back privately), imported 2026-08-05 from the AI Act Evaluation Benchmark (NCSR 'Demokritos', arXiv:2603.09435, CC-BY-4.0). The tuned governance specialist leads AND the lead is separ", dataset: "csoai/gspc-gov" },
  { axis: "safety", bench: "DefBench", n: 36, macro_f1: 0.944, accuracy: 0.944, unparsed_rate: 0.0541, status: "MEASURED",
    colour: "#f87171", lng: -0.12, lat: 51.5, seat: "London", instrument: "UK AI Safety Institute",
    task: "calibrated refusal on paired requests",
    note: "A base model holds the point lead but the lead is a TIE (McNemar p=0.69 vs qwen2.5:3b). Honestly reported: the tuned specialists do not own this axis.", dataset: "csoai/gspc-agi" },
  { axis: "provenance", bench: "ProvBench", n: 32, macro_f1: 0.776, accuracy: 0.781, unparsed_rate: 0.148, status: "MEASURED",
    colour: "#60a5fa", lng: -122.42, lat: 37.77, seat: "San Francisco", instrument: "C2PA Specification 2.4",
    task: "Article 50 marking survival by validity",
    note: "v3 bank (validity principle: a manifest present but whose binding no longer validates has NOT survived). The tuned specialist leads on points; TIE vs llama3.2:3b (p=0.77).", dataset: "csoai/gspc-prv" },
  { axis: "continuity", bench: "PQCBench", n: 33, macro_f1: 0.512, accuracy: 0.606, unparsed_rate: 0.0463, status: "MEASURED",
    colour: "#c084fc", lng: -77.27, lat: 39.14, seat: "Gaithersburg", instrument: "NIST FIPS 204 / ML-DSA",
    task: "post-quantum status of a cryptographic assumption",
    note: "The axis designed to discriminate across frontier models. The tuned specialist leads on points; flat TIE vs gemma3:12b (p=1.0).", dataset: "csoai/gspc-asi" },
  { axis: "conformance", bench: "MCPBench", n: 35, macro_f1: 0.735, accuracy: 0.743, unparsed_rate: 0.1338, status: "MEASURED",
    colour: "#fbbf24", lng: -122.33, lat: 47.61, seat: "Seattle", instrument: "Model Context Protocol 2026-07-28",
    task: "MCP tool conformance",
    note: "Canonical bank count 35 (supersedes the stale 11 in older matrices — registry v2). The tuned specialist leads on points; flat TIE vs mistral:7b (p=1.0).", dataset: "csoai/gspc-mcp" },
  { axis: "openness", bench: "OSSBench", n: 32, macro_f1: 0.875, accuracy: 0.875, unparsed_rate: 0.0493, status: "MEASURED",
    colour: "#2dd4bf", lng: -122.68, lat: 45.52, seat: "Portland", instrument: "OSI licence set",
    task: "licence reasoning versus intended use",
    note: "v2 bank (AGPL network trigger, directional compatibility, SSPL/ELv2/BSL service clauses). Canonical count 32 (supersedes stale 16). The tuned specialist leads on points; flat TIE vs gemma3:12b.", dataset: "csoai/gspc-oss" },
  { axis: "machinery-conformity", bench: "MachBench", n: 33, macro_f1: 0.465, accuracy: 0.545, unparsed_rate: 0.0558, status: "MEASURED",
    colour: "#fb923c", lng: 12.57, lat: 55.68, seat: "Copenhagen", instrument: "Machinery Reg (EU) 2023/1230 Annex I Part A — 14 Jan 2027",
    task: "Machinery Reg self-evolving safety-function classification (PART_A / OUT_OF_SCOPE / NOT_SAFETY_FUNCTION)",
    note: "A base model leads on points; TIE. Anchor: Machinery Reg (EU) 2023/1230 Annex I Part A items 5-6, applies 14 Jan 2027. Gold labels remain under legal review — measurement, not a conformity verdict.", dataset: "csoai/gspc-mach" },
  { axis: "care", bench: "CareBench", n: 199, macro_f1: 0.528, accuracy: 0.535, unparsed_rate: 0.1742, status: "MEASURED",
    colour: "#f472b6", lng: -3.19, lat: 55.95, seat: "Edinburgh", instrument: "paired protection / over-refusal design",
    task: "care-cost (protect × help) under paired conduct scenarios",
    note: "SEPARATED vs the best base (p=0.036) but NOT clear of the majority-class baseline — quote it only as 'separated from base models'. The fleet mean is 0.293 and the worst 5% of items carry harm 0.990 (CVaR, n=199): calibra", dataset: "csoai/gspc-care" },
  { axis: "cross-reality", bench: "XRAIV", n: 32, macro_f1: 0.803, accuracy: 0.812, unparsed_rate: 0.0247, status: "MEASURED",
    colour: "#a78bfa", lng: -1.26, lat: 51.75, seat: "Oxford", instrument: "EU AI Act, applied to agent conduct",
    task: "autonomous agent action authority (PROCEED / CONFIRM / REFUSE)",
    note: "A base model leads on points; TIE (p=0.065 — the closest near-miss on the board, still not separated at p<0.05). Bank: 32 scored (public + held-out split per the bank card).", dataset: "csoai/gspc-xr" },
  { axis: "detector-interop", bench: "DetBench", n: 33, macro_f1: 0.855, accuracy: 0.879, unparsed_rate: 0.1754, status: "MEASURED",
    colour: "#38bdf8", lng: 4.9, lat: 50.85, seat: "Brussels", instrument: "EU Code of Practice — interoperability due 2 Feb 2027",
    task: "cross-detector watermark interoperability matrix",
    note: "A base model leads on points; TIE, and NOT clear of the majority baseline. Methodology: POAI detector-interop. Code-of-Practice target 2 Feb 2027.", dataset: "csoai/gspc-det" },
  { axis: "art5-safeguard", bench: "Art5Bench", n: 36, macro_f1: 0.972, accuracy: 0.972, unparsed_rate: 0.0117, status: "MEASURED",
    colour: "#fb7185", lng: -77.04, lat: 38.9, seat: "Washington DC", instrument: "EU AI Act Art 5 — prohibited practices",
    task: "EU AI Act Article 5 prohibited-practice trip",
    note: "The tuned specialist leads on points at 0.972; TIE vs gemma3:12b (p=1.0) — the whole fleet is strong here (fleet mean 0.830). The NCII/CSAM corpus is never handled by CSOAI.", dataset: "csoai/gspc-art5" },
  { axis: "swarm", bench: "SwarmBench", n: 40, macro_f1: 0.494, accuracy: 0.975, unparsed_rate: 0.1868, status: "MEASURED",
    colour: "#94a3b8", lng: 139.69, lat: 35.68, seat: "Tokyo", instrument: "multi-agent coordination safety",
    task: "multi-agent coordination safety",
    note: "The honesty-clause gold template. Raw CIs on this bank LOOK disjoint but the paired test says p=1.0 (low-discrimination prompts) — the exact case the McNemar-primary rule exists for. TIE, and the interval is withheld by ", dataset: "csoai/gspc-swarm" },
  { axis: "affect", bench: "AffectBench", n: 41, macro_f1: 0.864, accuracy: 0.878, unparsed_rate: 0.0642, status: "MEASURED",
    colour: "#ec4899", lng: 4.35, lat: 50.85, seat: "Brussels", instrument: "EU AI Act Art 5(1)(a)/(b)/(f) + Art 50 — emotional & manipulation safety",
    task: "emotional & embodied safety (manipulation / disclosure / vulnerability)",
    note: "COUNSEL-PENDING: the legal gold labels and 1-5 severity bases await counsel review; this is a measurement of model behaviour against a counsel-pending key, NOT a legal verdict. The cleanest separation on the board: tuned", dataset: "csoai/gspc-affect" },
];

/**
 * The structural guard: only a MEASURED axis that ACTUALLY CARRIES A NUMBER may
 * show one, ever.
 *
 * The `typeof a.accuracy === "number"` clause is the fix for the fabricated
 * zero described on the Axis interface. Status and n alone are not enough:
 * `provenance-controls` is MEASURED with n=6 and no accuracy at all, and every
 * panel asks this function rather than deciding for itself — so adding the
 * clause here closes the hole on the OS board, /os, the Council OS home desktop
 * and the home page in one edit, and closes it for any panel written later.
 */
export const quotable = (a: Axis): boolean =>
  a.status === "MEASURED" && a.n > 0 && typeof a.accuracy === "number" && Number.isFinite(a.accuracy);

/** A macro F1 exists only when the board published one. Never a substituted 0. */
export const hasMacroF1 = (a: Axis): boolean =>
  typeof a.macro_f1 === "number" && Number.isFinite(a.macro_f1);

/** True when THIS axis published a Wilson pair. Never computed locally for display. */
export function publishedInterval(a: { interval?: [number, number] | null }): [number, number] | null {
  const iv = a.interval;
  if (!iv || iv.length !== 2) return null;
  const lo = iv[0], hi = iv[1];
  if (typeof lo !== "number" || typeof hi !== "number" || !Number.isFinite(lo) || !Number.isFinite(hi)) return null;
  return [lo, hi];
}

export function formatPublishedInterval(iv: [number, number]): string {
  return `${iv[0].toFixed(3)}–${iv[1].toFixed(3)}`;
}

export type SeparationMark = "SEPARATED" | "TIE" | "UNTESTED";

export function publishedSeparation(a: { separation?: string | null }): SeparationMark | null {
  const s = String(a.separation || "").toUpperCase();
  if (s === "SEPARATED" || s === "TIE" || s === "UNTESTED") return s;
  return null;
}

/** Legacy n≥30 heuristic. Prefer publishedInterval for anything a reader sees. */
export const hasInterval = (a: Axis): boolean => quotable(a) && a.n * (1 - a.unparsed_rate) >= 30;

/** Wilson 95% interval — the same arithmetic the published boards use. */
export function wilson(acc: number, n: number): [number, number] {
  if (!n) return [0, 0];
  const z = 1.959964, p = acc, d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
}

/** How much we actually know: items, discounted by the answers we could not read. */
export const confidence = (a: Axis): number =>
  Math.max(0.12, Math.min(1, a.n / 30) * (1 - (a.unparsed_rate || 0)));

export const STATUS_TONE: Record<AxisStatus, string> = {
  MEASURED: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  UNMEASURED: "text-sky-300 border-sky-400/30 bg-sky-400/10",
  DRAFT: "text-amber-300 border-amber-400/30 bg-amber-400/10",
  SPEC: "text-violet-300 border-violet-400/30 bg-violet-400/10",
  PLANNED: "text-slate-400 border-slate-400/25 bg-slate-400/10",
};

export const COUNTS = {
  total: AXES.length,
  measured: AXES.filter(quotable).length,
  withInterval: AXES.filter(hasInterval).length,
};

/* ── live wire ────────────────────────────────────────────────────────────
 * The board above is a snapshot committed to the bundle. /api/gspc is the
 * authoritative published measurement (it carries the issuer and DOI). Read the
 * wire and merge it over the snapshot, keeping the geography the API does not
 * publish (lng/lat/seat/instrument).
 *
 * The source is always reported. A surface that silently falls back to a stale
 * snapshot while looking live is the same defect as reporting an unearned score.
 */

export type AxesSource = "wire" | "snapshot";

/** In-lane measurements are published beside the board, never as board rows. */
export interface InLaneAxis {
  axis: string;
  bench: string;
  task: string;
  n: number;
  /** Null when the row publishes none — same rule as Axis.accuracy, no `?? 0`. */
  accuracy: number | null;
  status: string;
  note?: string;
  leader?: string;
  separation?: string;
  fleet_mean?: number | null;
  dataset?: string;
  /** Own specialist as published under per_model['council-safe'], if present. */
  specialist?: { name: string; rate: number; n: number } | null;
}

function pair(v: unknown): [number, number] | undefined {
  if (!Array.isArray(v) || v.length !== 2) return undefined;
  const lo = num(v[0]);
  const hi = num(v[1]);
  if (lo === undefined || hi === undefined) return undefined;
  return [lo, hi];
}

function specialistFrom(w: unknown): InLaneAxis["specialist"] {
  if (!w || typeof w !== "object") return null;
  const pm = (w as { per_model?: unknown }).per_model;
  if (!pm || typeof pm !== "object") return null;
  const cs = (pm as Record<string, unknown>)["council-safe"];
  if (!cs || typeof cs !== "object") return null;
  const row = cs as Record<string, unknown>;
  const rate = num(row.alignment_rate) ?? num(row.honesty_rate);
  if (rate === undefined) return null;
  return { name: "council-safe", rate, n: Number(row.n ?? 0) };
}

/** Honest in-lane lines from published fields only. Leader 1.0 does not hide council-safe 0.25. */
export function inLaneFacts(row: InLaneAxis): {
  separation: SeparationMark | null;
  specialistLine: string | null;
  fleetLine: string | null;
  leaderLine: string | null;
  nLine: string;
  datasetLine: string | null;
} {
  const sep = publishedSeparation(row);
  const specialistLine = row.specialist
    ? `${row.specialist.name} ${row.specialist.rate} (n=${row.specialist.n})`
    : null;
  const fleetLine =
    typeof row.fleet_mean === "number" && Number.isFinite(row.fleet_mean)
      ? `fleet mean ${row.fleet_mean}`
      : null;
  const leaderLine =
    typeof row.accuracy === "number" && Number.isFinite(row.accuracy) && row.leader
      ? `leader ${row.leader} ${row.accuracy}`
      : typeof row.accuracy === "number" && Number.isFinite(row.accuracy)
        ? `leader ${row.accuracy}`
        : null;
  return {
    separation: sep,
    specialistLine,
    fleetLine,
    leaderLine,
    nLine: `n=${row.n}`,
    datasetLine: row.dataset ? row.dataset : null,
  };
}

export interface AxesState {
  axes: Axis[];
  source: AxesSource;
  measuredOn: string;
  issuer?: string;
  doi?: string;
  /** Living-board sentence from totals.public_count — never typed in chrome. */
  publicCount?: string;
  /** slot15 / human-vs-ai etc. Shown as in-lane, not mixed into board counts. */
  inLane: InLaneAxis[];
  /** From totals.separated_leads / ties / untested_separations. Absent if the wire omitted them. */
  separationTally?: { separated: number; ties: number; untested: number };
  error?: string;
  loading: boolean;
}

export function tallyFromTotals(totals: unknown): { separated: number; ties: number; untested: number } | undefined {
  if (!totals || typeof totals !== "object") return undefined;
  const t = totals as Record<string, unknown>;
  const separated = num(t.separated_leads);
  const ties = num(t.ties);
  if (separated === undefined || ties === undefined) return undefined;
  return { separated, ties, untested: num(t.untested_separations) ?? 0 };
}

/** First line a harness reads. Built only from published totals, never from a local recount. */
export function separationHeadline(t: { separated: number; ties: number; untested: number }): string {
  const parts = [`${t.separated} SEPARATED`, `${t.ties} TIE`];
  if (t.untested > 0) parts.push(`${t.untested} UNTESTED`);
  return parts.join(" · ");
}

/** A real finite number, or undefined. Null, "", NaN and absent all mean absent. */
const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

async function readGspcJson(signal?: AbortSignal): Promise<any> {
  const r = await fetch("/api/gspc", { signal, headers: { accept: "application/json" } });
  const ct = (r.headers.get("content-type") || "").toLowerCase();
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  if (ct.includes("text/html")) throw new Error("HTML instead of JSON");
  const j: any = await r.json();
  if (!j || typeof j !== "object" || Array.isArray(j?.axes) === false) {
    throw new Error("not a GSPC payload");
  }
  return j;
}

export async function fetchAxes(signal?: AbortSignal): Promise<Omit<AxesState, "loading">> {
  try {
    let j: any;
    try {
      j = await readGspcJson(signal);
    } catch (first) {
      if (signal?.aborted) throw first;
      await new Promise((res) => setTimeout(res, 350));
      j = await readGspcJson(signal);
    }
    const live: any[] = Array.isArray(j?.axes) ? j.axes : [];
    if (!live.length) throw new Error("no axis in payload");

    const bySlug = new Map(AXES.map((a) => [a.axis, a]));
    const merged: Axis[] = live.map((w) => {
      const base = bySlug.get(w.axis);
      return {
        ...(base ?? ({} as Axis)),
        axis: w.axis,
        bench: w.bench ?? base?.bench ?? "",
        n: Number(w.n ?? base?.n ?? 0),
        // `?? 0` here is what published the fabricated zeros. An absent figure
        // stays absent, and `quotable()` / `hasMacroF1()` keep it off the page.
        macro_f1: num(w.macro_f1) ?? null,
        accuracy: num(w.accuracy) ?? null,
        unparsed_rate: num(w.unparsed_rate) ?? 0,
        status: (w.status ?? base?.status ?? "UNMEASURED") as AxisStatus,
        colour: w.colour ?? base?.colour ?? "#94a3b8",
        // geography is not published by the API — keep the snapshot's, or park it at 0,0
        lng: base?.lng ?? 0, lat: base?.lat ?? 0,
        seat: base?.seat ?? "—",
        instrument: base?.instrument ?? w.instrument ?? "—",
        task: w.task ?? base?.task ?? "",
        note: w.note ?? base?.note,
        dataset: w.dataset ?? base?.dataset,
        dataset_url: typeof w.dataset_url === "string" ? w.dataset_url : undefined,
        interval: pair(w.interval),
        separation: typeof w.separation === "string" ? w.separation : undefined,
        separation_p: num(w.separation_p),
        kind: typeof w.kind === "string" ? w.kind : undefined,
      };
    });

    const rawLane: any[] = Array.isArray(j?.measured_in_lane) ? j.measured_in_lane : [];
    const inLane: InLaneAxis[] = rawLane
      .filter((w) => w && typeof w.axis === "string")
      .map((w) => ({
        axis: String(w.axis),
        bench: String(w.bench ?? ""),
        task: String(w.task ?? ""),
        n: Number(w.n ?? 0),
        accuracy: num(w.accuracy) ?? null,
        status: String(w.status ?? "UNMEASURED"),
        note: w.note ? String(w.note) : undefined,
        leader: w.leader ? String(w.leader) : undefined,
        separation: typeof w.separation === "string" ? w.separation : undefined,
        fleet_mean: num(w.fleet_mean) ?? null,
        dataset: typeof w.dataset === "string" ? w.dataset : undefined,
        specialist: specialistFrom(w),
      }));

    const publicCount = typeof j?.totals?.public_count === "string"
      ? j.totals.public_count.trim()
      : "";

    return {
      axes: merged,
      source: "wire",
      measuredOn: j?.measured_on?.date ?? j?.measured_on ?? MEASURED_ON.date,
      issuer: j?.issuer,
      doi: j?.doi,
      publicCount: publicCount || undefined,
      inLane,
      separationTally: tallyFromTotals(j?.totals),
    };
  } catch (e: any) {
    return {
      axes: AXES,
      source: "snapshot",
      measuredOn: MEASURED_ON.date,
      inLane: [],
      error: String(e?.message ?? e),
    };
  }
}

/**
 * Caption for living-board chrome. Prefer the API sentence; never invent a count.
 *
 * The `measured`/`total` arguments are IGNORED for the caption and kept only so
 * existing call sites compile. They are counted from the local snapshot in this
 * file, which is the BEHAVIOURAL family — not the board — so formatting them as
 * the board's caption published a family count as though it were the whole board,
 * in the retired "<measured> measured of <total>" grammar that hid the unmeasured
 * slots entirely. The fallback is now the dated observation of the real board
 * (client/src/lib/boardCount.ts -> BOARD_COUNT_OBSERVED, itself read out of
 * facts.json), so both of the board's numbers travel even before the fetch lands.
 */
export function publicCaption(publicCount?: string, _measured?: number, _total?: number): string {
  if (publicCount && publicCount.trim()) return publicCount.trim();
  const observed = BOARD_COUNT_OBSERVED.public_count;
  return observed && observed.trim() ? observed.trim() : "Counts from GET /api/gspc";
}

export const countOf = (axes: Axis[]) => ({
  total: axes.length,
  measured: axes.filter(quotable).length,
  withInterval: axes.filter(hasInterval).length,
});
