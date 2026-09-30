/**
 * The board's run-dates line: `measured_on.date`, completed with the runs it does not name.
 *
 * `measured_on.date` is a string inside the SIGNED board payload (GET /api/gspc, site_attestation
 * under #board-attestation-1). It names the behavioural, jail and financial-fact runs. Slot 23,
 * effect-binding, was measured on its own run on 2026-09-22 and is not in it, so the line read as
 * if the newest run on the board did not exist (audit 2026-09-28 #18). Editing the string would
 * change signed bytes and needs a re-sign, so the line is completed here from the axes themselves:
 * every MEASURED axis in the model family ("gspc") that is a deterministic-facts run rather than a
 * fleet comparison, whose name the line does not already carry, with the date read from that
 * axis. Nothing is typed; an axis whose date cannot be read is left out, never guessed.
 */
type AxisLike = {
  axis?: unknown;
  family?: unknown;
  kind?: unknown;
  status?: unknown;
  facts_as_of?: unknown;
  note?: unknown;
  evidence_url?: unknown;
};
type BoardLike = { measured_on?: unknown; axes?: unknown } | null | undefined;

const ISO_DAY = /^(\d{4}-\d{2}-\d{2})/;

/** The run date an axis carries about itself: its producer stamp, else its note, else its evidence file name. */
export function axisRunDate(a: AxisLike): string | null {
  if (typeof a.facts_as_of === "string") {
    const m = ISO_DAY.exec(a.facts_as_of);
    if (m) return m[1];
  }
  if (typeof a.note === "string") {
    const m = /\bMEASURED (\d{4}-\d{2}-\d{2})\b/.exec(a.note);
    if (m) return m[1];
  }
  if (typeof a.evidence_url === "string") {
    const m = /(\d{4}-\d{2}-\d{2})/.exec(a.evidence_url);
    if (m) return m[1];
  }
  return null;
}

export function boardRunDates(data: BoardLike): string | null {
  const mo = data?.measured_on;
  const raw = mo && typeof mo === "object" ? (mo as { date?: unknown }).date : undefined;
  const base = typeof raw === "string" ? raw.trim() : "";
  const extras: string[] = [];
  const axes = Array.isArray(data?.axes) ? (data!.axes as AxisLike[]) : [];
  for (const a of axes) {
    if (!a || typeof a !== "object") continue;
    if (a.status !== "MEASURED" || a.family !== "gspc" || a.kind !== "deterministic-facts") continue;
    if (typeof a.axis !== "string" || a.axis === "" || base.includes(a.axis)) continue;
    const day = axisRunDate(a);
    if (day) extras.push(`${a.axis} ${day}`);
  }
  const parts = [base, ...extras].filter((p) => p !== "");
  return parts.length ? parts.join(" · ") : null;
}
