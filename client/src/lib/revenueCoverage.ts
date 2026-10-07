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
  const storageComplete = coverage?.complete === true;
  const legacyMeasured = one?.status === "MEASURED" && one.coverage === undefined;
  if (!(storageComplete || legacyMeasured) ||
      (one?.status !== "MEASURED" && one?.status !== "PARTIAL")) return null;

  const payers = integer(one.all_time), settlements = integer(one.settlements);
  const recorded = storageComplete ? integer(one.settled_usdc_atomic) : null;
  const independentlyMeasured = amount?.status === "MEASURED" ? integer(amount.count) : null;
  // Preserve the old MEASURED shape only when it supplied no amount status.
  const legacyAmount = legacyMeasured && amount?.status === undefined ? integer(amount?.count) : null;
  if (recorded !== null && independentlyMeasured !== null && recorded !== independentlyMeasured) return null;
  const atomic = storageComplete ? recorded : independentlyMeasured ?? legacyAmount;
  if (payers === null || settlements === null || atomic === null) return null;
  return { state: one.status === "PARTIAL" ? "partial" : "measured", payers, settlements, atomic };
}
