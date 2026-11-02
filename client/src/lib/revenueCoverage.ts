export type AllTimeRevenue = {
  state: "measured" | "partial";
  payers: number;
  settlements: number;
  atomic: number;
};

const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
const integer = (value: unknown): number | null =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;

/** All-time site-ledger observations. Window counts and observed subsets never substitute. */
export function readAllTimeRevenue(value: unknown): AllTimeRevenue | null {
  const body = record(value), one = record(body?.one_number);
  const coverage = record(one?.coverage), amount = record(body?.settled_usdc);
  if (coverage?.complete !== true ||
      (one?.status !== "MEASURED" && one?.status !== "PARTIAL")) return null;

  const payers = integer(one.all_time), settlements = integer(one.settlements);
  const atomic = integer(one.settled_usdc_atomic);
  if (payers === null || settlements === null || atomic === null) return null;
  // A supplied aggregate must agree; neither nulls nor missing coverage imply a complete scan.
  if (amount !== null &&
      (amount.status !== "MEASURED" || integer(amount.count) !== atomic)) return null;
  return { state: one.status === "PARTIAL" ? "partial" : "measured", payers, settlements, atomic };
}
