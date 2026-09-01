/**
 * boardCsv — CSV export of the live board (B3, CSOAI_FRONTEND_REACH_AGENTS).
 *
 * Columns are FIXED to the A1 parquet schema, byte-for-byte:
 *   axis,bench,status,n,accuracy,interval_lo,interval_hi,separation,fleet_mean,dataset,as_of
 *
 * Honesty rules:
 *   - Rows come from the /api/gspc payload the caller fetched — never typed.
 *   - An absent value is an EMPTY CELL. Never 0, never 0.000, never interpolated.
 *     A financial (deterministic-facts) axis has no accuracy, no interval, no
 *     separation and no fleet mean — those cells stay empty for it.
 *   - as_of is filled only from the payload's own measured_on.date, and only for
 *     rows in the family that date describes. No date is invented per row.
 */

export const BOARD_CSV_COLUMNS = [
  "axis",
  "bench",
  "status",
  "n",
  "accuracy",
  "interval_lo",
  "interval_hi",
  "separation",
  "fleet_mean",
  "dataset",
  "as_of",
] as const;

type AxisRow = {
  axis?: string;
  bench?: string;
  status?: string;
  n?: number;
  accuracy?: number;
  interval?: [number, number];
  separation?: string;
  fleet_mean?: number;
  family?: string;
  dataset?: string;
  dataset_url?: string;
};

type GspcPayload = {
  axes?: AxisRow[];
  measured_on?: { date?: string };
};

const cell = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function boardCsvFromPayload(payload: GspcPayload): string {
  const rows = Array.isArray(payload.axes) ? payload.axes : [];
  const boardDate = payload.measured_on?.date ?? "";
  const lines = [BOARD_CSV_COLUMNS.join(",")];
  for (const a of rows) {
    const isComparison = a.family !== "financial";
    lines.push(
      [
        cell(a.axis),
        cell(a.bench),
        cell(a.status),
        cell(typeof a.n === "number" ? a.n : ""),
        cell(typeof a.accuracy === "number" ? a.accuracy : ""),
        cell(Array.isArray(a.interval) && typeof a.interval[0] === "number" ? a.interval[0] : ""),
        cell(Array.isArray(a.interval) && typeof a.interval[1] === "number" ? a.interval[1] : ""),
        cell(a.separation ?? ""),
        cell(typeof a.fleet_mean === "number" ? a.fleet_mean : ""),
        cell(a.dataset_url ?? a.dataset ?? ""),
        // The payload's own board date describes the behavioural runs; financial
        // rows carry their dates in prose only, so their as_of stays empty.
        cell(isComparison ? boardDate : ""),
      ].join(","),
    );
  }
  return lines.join("\n") + "\n";
}

/** Trigger a client-side download of the CSV built from a live payload. */
export function downloadBoardCsv(payload: GspcPayload): void {
  const blob = new Blob([boardCsvFromPayload(payload)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gspc-board.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
