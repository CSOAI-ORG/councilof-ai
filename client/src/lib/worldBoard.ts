/**
 * Read-only GSPC axis presentation for the spatial operations room.
 * Never derive model superiority from point-estimate rank, colour, simulation,
 * absent tests or a fact-axis measurement.
 */
export type WorldAxis = {
  id: string;
  label: string;
  family: string;
  kind: "model-comparison" | "fact";
  status: "MEASURED" | "UNMEASURED" | "UNREACHABLE";
  separation: "SEPARATED" | "TIE" | "UNTESTED" | null;
  n: number | null;
  method: string | null;
  detail: string;
  path: string;
};

export type WorldBoard = {
  axes: WorldAxis[];
  nMeasured: number;
  nModelComparison: number;
  nSeparated: number;
  nTie: number;
  nUntested: number;
  countLine: string;
  separationLine: string;
};

type Obj = Record<string, unknown>;
const obj = (x: unknown): Obj | null =>
  x !== null && typeof x === "object" && !Array.isArray(x) ? x as Obj : null;
const s = (x: unknown, limit = 300): string | null =>
  typeof x === "string" && x.trim() ? x.trim().slice(0, limit) : null;
const n = (x: unknown): number | null =>
  typeof x === "number" && Number.isSafeInteger(x) && x >= 0 && x <= 10_000_000 ? x : null;
const safeAxis = (x: string): boolean => /^[a-z0-9][a-z0-9._-]{0,95}$/.test(x);

export function parseWorldBoard(raw: unknown): WorldBoard {
  const d = obj(raw), totals = obj(d?.totals), items = d?.axes;
  if (d?.schema !== "csoai.gspc-axes/0.5" || !totals || !Array.isArray(items) ||
      items.length > 100 || n(totals.axes) !== items.length) {
    throw new Error("WORLD_BOARD_UNCHECKABLE");
  }
  const axes = items.map((v: unknown): WorldAxis => {
    const a = obj(v), id = s(a?.axis, 96), status = a?.status, kind = a?.kind;
    if (!a || !id || !safeAxis(id) ||
        !["MEASURED", "UNMEASURED", "UNREACHABLE"].includes(String(status)) ||
        typeof kind !== "string") throw new Error("WORLD_AXIS_UNCHECKABLE");
    const model = kind === "model-comparison";
    const sep = model ? a.separation : null;
    if (model && !["TIE", "SEPARATED", "UNTESTED"].includes(String(sep))) {
      throw new Error("WORLD_MODEL_SEPARATION_UNCHECKABLE");
    }
    const isFact = !model;
    const rawN = a.n === null || a.n === undefined ? null : n(a.n);
    if (a.n !== null && a.n !== undefined && rawN === null) throw new Error("WORLD_AXIS_SAMPLE_UNCHECKABLE");
    return {
      id, label: id.replace(/[-_]/g, " "), family: s(a.family, 80) ?? "unclassified",
      kind: isFact ? "fact" : "model-comparison",
      status: status as WorldAxis["status"],
      separation: model ? sep as WorldAxis["separation"] : null,
      n: rawN, method: s(a.method_status, 200), detail: s(a.limit, 250) ?? s(a.task, 250) ?? "No scope text supplied.",
      path: "/gspc/" + encodeURIComponent(id),
    };
  });
  if (new Set(axes.map((a) => a.id)).size !== axes.length) throw new Error("WORLD_AXIS_DUPLICATE");
  const nMeasured = axes.filter((a) => a.status === "MEASURED").length;
  const model = axes.filter((a) => a.kind === "model-comparison");
  const nSeparated = model.filter((a) => a.separation === "SEPARATED").length;
  const nTie = model.filter((a) => a.separation === "TIE").length;
  const nUntested = model.filter((a) => a.separation === "UNTESTED").length;
  // Counts must be derivable from the SAME set of visible cards: no stale labels.
  if (n(totals.measured_axes) !== nMeasured ||
      n(totals.separated_leads) !== nSeparated ||
      n(totals.ties) !== nTie ||
      n(totals.untested_separations) !== nUntested) throw new Error("WORLD_BOARD_TOTALS_DISAGREE");
  return {
    axes, nMeasured, nModelComparison: model.length, nSeparated, nTie, nUntested,
    countLine: s(totals.public_count) ?? String(axes.length) + " axes · " + nMeasured + " measured",
    separationLine: s(totals.separation_public_count) ??
      nSeparated + " separated · " + nTie + " TIE · " + nUntested + " UNTESTED",
  };
}
