/**
 * Art50ReadinessPanel — per-axis Article 50 readiness rows, derived from the
 * live GET /api/gspc axis payload.
 *
 * THE RULE IS THE SAME AS EVERYWHERE ELSE ON THE BOARD: a row shows MEASURED
 * only when the payload itself publishes a measured reading for it
 * (`art50_readiness.<key>.status === "MEASURED"`). If the axis carries no such
 * fields — the case today — every row renders UNMEASURED and says why. Empty
 * stays empty; nothing here invents a value.
 */

export interface Art50ReadinessRow {
  key: string;
  label: string;
  state: "MEASURED" | "UNMEASURED";
  /** The reading as published — only present when state is MEASURED. */
  reading?: string;
  note?: string;
}

export const ART50_READINESS_KEYS = [
  { key: "marking_detected", label: "Marking detected?" },
  { key: "machine_readable", label: "Machine-readable?" },
  { key: "interop_format", label: "Interop format?" },
] as const;

/** Loose axis shape: anything the board (or its offline snapshot) serves. */
export interface Art50AxisLike {
  axis?: string;
  art50_readiness?: unknown;
}

/**
 * Read the three Art 50 readiness rows off an axis payload. Never throws,
 * never fabricates: an absent field, a wrong shape, or a non-MEASURED status
 * all resolve to UNMEASURED.
 */
export function readArt50Readiness(axis: Art50AxisLike | null | undefined): Art50ReadinessRow[] {
  const source =
    axis && typeof axis.art50_readiness === "object" && axis.art50_readiness !== null
      ? (axis.art50_readiness as Record<string, unknown>)
      : {};
  return ART50_READINESS_KEYS.map(({ key, label }) => {
    const raw = source[key];
    if (raw && typeof raw === "object") {
      const entry = raw as Record<string, unknown>;
      if (entry.status === "MEASURED") {
        return {
          key,
          label,
          state: "MEASURED",
          reading:
            typeof entry.reading === "string"
              ? entry.reading
              : typeof entry.value === "boolean"
                ? entry.value
                  ? "yes"
                  : "no"
                : undefined,
          note: typeof entry.note === "string" ? entry.note : undefined,
        };
      }
    }
    return { key, label, state: "UNMEASURED" };
  });
}

const CHIP = {
  MEASURED: "border-emerald-300 bg-emerald-50 text-emerald-700",
  UNMEASURED: "border-slate-300 bg-slate-100 text-slate-500",
} as const;

export default function Art50ReadinessPanel({
  axis,
  heading = "Article 50 readiness",
}: {
  axis: Art50AxisLike | null | undefined;
  heading?: string;
}) {
  const rows = readArt50Readiness(axis);
  const allUnmeasured = rows.every((r) => r.state === "UNMEASURED");
  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-4"
      data-testid="art50-readiness-panel"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-800">{heading}</h3>
        <span className="font-mono text-[10px] uppercase tracking-wide text-slate-500">
          derived from GET /api/gspc — never typed
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li
            key={r.key}
            className="flex flex-wrap items-center justify-between gap-2"
            data-testid={`art50-readiness-${r.key}`}
          >
            <span className="text-[13px] font-medium text-slate-700">{r.label}</span>
            <span className="flex items-center gap-2">
              {r.state === "MEASURED" && r.reading && (
                <span className="text-[12px] text-slate-600">{r.reading}</span>
              )}
              <span
                className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${CHIP[r.state]}`}
              >
                {r.state}
              </span>
            </span>
            {r.note && <span className="w-full text-[11px] text-slate-500">{r.note}</span>}
          </li>
        ))}
      </ul>
      {allUnmeasured && (
        <p className="mt-3 text-[11px] leading-snug text-slate-500">
          The live axis payload publishes no <code>art50_readiness</code> fields for this axis, so
          every row stays UNMEASURED. Empty stays empty — a row earns MEASURED only when the board
          publishes the reading.
        </p>
      )}
    </div>
  );
}
