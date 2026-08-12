// GSPC — the twelve governance axes, as measured state.
//
// This is the single source of truth for every SOV OS panel. The invariant that
// matters more than anything visual: an axis only carries a score when its status
// is MEASURED. UNMEASURED / DRAFT / SPEC / PLANNED axes carry their real state and
// NO number. `quotable()` is the structural guard — panels ask it rather than
// deciding for themselves, so a surface cannot render a score an axis has not earned.

export type AxisStatus = "MEASURED" | "UNMEASURED" | "DRAFT" | "SPEC" | "PLANNED";

export interface Axis {
  axis: string;
  bench: string;
  n: number;
  macro_f1: number;
  accuracy: number;
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
}

export const MEASURED_ON = { date: "2026-08-05", model: "sov34" };

export const AXES: Axis[] = [
  { axis: "governance", bench: "GovBench", n: 237, macro_f1: 0.381, accuracy: 0.515, unparsed_rate: 0.0, status: "MEASURED",
    colour: "#34d399", lng: 4.37, lat: 50.84, seat: "Brussels", instrument: "EU AI Act (Reg. 2024/1689)",
    task: "EU AI Act risk-tier classification",
    note: "The first axis over usable_n>=30, so the first with an interval: sov34 accuracy 0.515, Wilson 95% [0.451, 0.578], n=237. Rented frontier models cluster 0.66–0.74 with overlapping intervals — no model is clearly best at EU AI Act tiering." },
  { axis: "safety", bench: "DefBench", n: 14, macro_f1: 0.653, accuracy: 0.643, unparsed_rate: 0.071, status: "MEASURED",
    colour: "#f87171", lng: -0.12, lat: 51.50, seat: "London", instrument: "UK AI Safety Institute",
    task: "calibrated refusal on paired requests" },
  { axis: "provenance", bench: "ProvBench", n: 16, macro_f1: 0, accuracy: 0, unparsed_rate: 0, status: "UNMEASURED",
    colour: "#60a5fa", lng: -122.42, lat: 37.77, seat: "San Francisco", instrument: "C2PA Specification 2.4",
    task: "Article 50 marking survival under transforms",
    note: "v3 bank live 2026-08-05. Awaiting a clean multi-model board — no score shown until then." },
  { axis: "continuity", bench: "PQCBench", n: 33, macro_f1: 0, accuracy: 0, unparsed_rate: 0, status: "UNMEASURED",
    colour: "#c084fc", lng: -77.27, lat: 39.14, seat: "Gaithersburg", instrument: "NIST FIPS 204 / ML-DSA",
    task: "post-quantum signing agility",
    note: "Bank grown to n=33 so it can carry its first interval — awaiting the clean board to publish it." },
  { axis: "conformance", bench: "MCPBench", n: 11, macro_f1: 0.667, accuracy: 0.636, unparsed_rate: 0.091, status: "MEASURED",
    colour: "#fbbf24", lng: -122.33, lat: 47.61, seat: "Seattle", instrument: "Model Context Protocol 2026-07-28",
    task: "tool declaration versus observed behaviour" },
  { axis: "openness", bench: "OSSBench", n: 16, macro_f1: 0, accuracy: 0, unparsed_rate: 0, status: "UNMEASURED",
    colour: "#2dd4bf", lng: -122.68, lat: 45.52, seat: "Portland", instrument: "OSI licence set",
    task: "licence versus intended use",
    note: "v2 bank live 2026-08-05. Awaiting a clean multi-model board — no score shown until then." },
  { axis: "machinery-conformity", bench: "MachBench", n: 16, macro_f1: 0, accuracy: 0, unparsed_rate: 0, status: "DRAFT",
    colour: "#fb923c", lng: 12.57, lat: 55.68, seat: "Copenhagen", instrument: "Machinery Reg (EU) 2023/1230 Annex I Part A — 14 Jan 2027",
    task: "self-evolving ML safety-function classification",
    note: "DRAFT — awaiting legal review of the gold labels. Not quotable." },
  { axis: "care", bench: "CareBench", n: 0, macro_f1: 0, accuracy: 0, unparsed_rate: 0, status: "DRAFT",
    colour: "#f472b6", lng: -3.19, lat: 55.95, seat: "Edinburgh", instrument: "paired protection / over-refusal design",
    task: "care-cost — protect and help, measured jointly",
    note: "DRAFT — no item bank yet (n=0); not quoted." },
  { axis: "cross-reality", bench: "XRAIV", n: 16, macro_f1: 0, accuracy: 0, unparsed_rate: 0, status: "UNMEASURED",
    colour: "#a78bfa", lng: -1.26, lat: 51.75, seat: "Oxford", instrument: "EU AI Act, applied to agent conduct",
    task: "validate an agent by what it DOES against the law",
    note: "v0 bank published 2026-08-05. n<30 so no interval; clean board in progress." },
  { axis: "detector-interop", bench: "DetBench", n: 0, macro_f1: 0, accuracy: 0, unparsed_rate: 0, status: "SPEC",
    colour: "#38bdf8", lng: 4.90, lat: 50.85, seat: "Brussels", instrument: "EU Code of Practice — interoperability due 2 Feb 2027",
    task: "can one producer's watermark be read by another's detector",
    note: "SPEC — methodology published; Code-of-Practice target 2 Feb 2027." },
  { axis: "art5-safeguard", bench: "Art5Bench", n: 16, macro_f1: 0, accuracy: 0, unparsed_rate: 0, status: "UNMEASURED",
    colour: "#fb7185", lng: -77.04, lat: 38.90, seat: "Washington DC", instrument: "EU AI Act Art 5 — prohibited practices",
    task: "safeguard effectiveness against prohibited generation",
    note: "v0 bank published 2026-08-05. n<30 so no interval; clean multi-model board in progress." },
  { axis: "swarm", bench: "SwarmBench", n: 0, macro_f1: 0, accuracy: 0, unparsed_rate: 0, status: "PLANNED",
    colour: "#94a3b8", lng: 139.69, lat: 35.68, seat: "Tokyo", instrument: "multi-agent coordination safety",
    task: "named and dated, no item bank yet — deliberately empty",
    note: "PLANNED — repo exists but has no item bank yet." },
  { axis: "affect", bench: "AffectBench", n: 34, macro_f1: 0, accuracy: 0, unparsed_rate: 0, status: "UNMEASURED",
    colour: "#f472b6", lng: 4.35, lat: 50.85, seat: "Brussels", instrument: "EU AI Act Art 5(1)(a)/(b)/(f) + Art 50 — emotional & manipulation safety",
    task: "must not manipulate you — grade the emotional duty of care",
    note: "gspc-affect bank published 2026-08-12 (34 public items, csoai-authored). The DISCLOSE class grades Art 50 transparency — no other axis does. n>=30 but no multi-model board yet, so UNMEASURED: no score shown." },
];

/** The structural guard: only a MEASURED axis may show a number, ever. */
export const quotable = (a: Axis): boolean => a.status === "MEASURED" && a.n > 0;

/** An interval needs usable_n >= 30. Below that we say so instead of drawing one. */
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

/* ── live wire ──────────────────────────────────────────────────────────────
 * The board above is a snapshot committed to the bundle. /api/gspc is the
 * authoritative published measurement (it carries the issuer and DOI). Read the
 * wire and merge it over the snapshot, keeping the geography the API does not
 * publish (lng/lat/seat/instrument).
 *
 * The source is always reported. A surface that silently falls back to a stale
 * snapshot while looking live is the same defect as reporting an unearned score.
 */

export type AxesSource = "wire" | "snapshot";

export interface AxesState {
  axes: Axis[];
  source: AxesSource;
  measuredOn: string;
  issuer?: string;
  doi?: string;
  error?: string;
  loading: boolean;
}

export async function fetchAxes(signal?: AbortSignal): Promise<Omit<AxesState, "loading">> {
  try {
    const r = await fetch("/api/gspc", { signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j: any = await r.json();
    const live: any[] = Array.isArray(j?.axes) ? j.axes : [];
    if (!live.length) throw new Error("no axes in payload");

    const bySlug = new Map(AXES.map((a) => [a.axis, a]));
    const merged: Axis[] = live.map((w) => {
      const base = bySlug.get(w.axis);
      return {
        ...(base ?? ({} as Axis)),
        axis: w.axis,
        bench: w.bench ?? base?.bench ?? "",
        n: Number(w.n ?? base?.n ?? 0),
        macro_f1: Number(w.macro_f1 ?? 0),
        accuracy: Number(w.accuracy ?? 0),
        unparsed_rate: Number(w.unparsed_rate ?? 0),
        status: (w.status ?? base?.status ?? "UNMEASURED") as AxisStatus,
        colour: w.colour ?? base?.colour ?? "#94a3b8",
        // geography is not published by the API — keep the snapshot's, or park it at 0,0
        lng: base?.lng ?? 0, lat: base?.lat ?? 0,
        seat: base?.seat ?? "—",
        instrument: base?.instrument ?? w.instrument ?? "—",
        task: w.task ?? base?.task ?? "",
        note: w.note ?? base?.note,
        dataset: w.dataset ?? base?.dataset,
      };
    });

    return {
      axes: merged,
      source: "wire",
      measuredOn: j?.measured_on?.date ?? j?.measured_on ?? MEASURED_ON.date,
      issuer: j?.issuer,
      doi: j?.doi,
    };
  } catch (e: any) {
    return {
      axes: AXES,
      source: "snapshot",
      measuredOn: MEASURED_ON.date,
      error: String(e?.message ?? e),
    };
  }
}

export const countOf = (axes: Axis[]) => ({
  total: axes.length,
  measured: axes.filter(quotable).length,
  withInterval: axes.filter(hasInterval).length,
});
