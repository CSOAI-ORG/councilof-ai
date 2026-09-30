/**
 * bank_exposure — the honest label for a card on a board axis (instrument guard, 27 Sep 2026).
 *
 * The PRODUCER is harness/instrument-guard/build_exposure_labels.py: it looks up each signed mill
 * card's pinned bank_sha256 in the signed bank-commitments records and writes
 * /interop/instrument-guard/bank-exposure-labels.json, signed (board DID) as
 * bank-exposure-labels.signed.json, whose payload carries the per-axis counts read here.
 * The sentences below are the producer's `values[label].plain_language`, byte for byte;
 * bankExposure.test.ts fails if the two ever differ. No count is typed here.
 */
export const EXPOSURE_LABELS_URL = "/interop/instrument-guard/bank-exposure-labels.signed.json";

export const PLAIN_LANGUAGE: Record<string, string> = {
  PUBLIC_BANK:
    "Measured on a public benchmark. Every item in the bank behind this number is publicly readable, so a model could have been trained on it. Read it as a score on a public test, not on unseen items; no held-out slice backs it.",
  PARTLY_PUBLIC_BANK:
    "Measured on a partly public bank. Some of its items are publicly readable, so part of this number may reflect items a model could have trained on.",
  PRIVATE_BANK:
    "Measured on a bank whose items have not been published. That lowers, but does not remove, the chance that a model trained on them.",
  UNASSESSED:
    "Bank exposure not measured: the bank this card pins is not in any signed bank-commitments record yet.",
  UNPINNED:
    "This card does not pin its bank by digest, so whether its items were public cannot be checked.",
};

export type AxisExposure = { live_cards: number } & Record<string, number>;

export interface ExposureLine {
  /** The one label every live card on the axis carries, or null when they differ. */
  label: string | null;
  sentence: string | null;
  counts: [string, number][];
  liveCards: number;
}

/** Read one axis out of the signed labels payload. Absent is null, never a clean result. */
export function exposureLine(signed: unknown, axis: string): ExposureLine | null {
  const payload = (signed as { payload?: { schema?: string; by_axis?: Record<string, AxisExposure> } })?.payload;
  if (!payload || payload.schema !== "csoai.bank-exposure-labels-signed/0.1") return null;
  const row = payload.by_axis?.[axis];
  if (!row || typeof row.live_cards !== "number" || row.live_cards <= 0) return null;
  const counts = Object.entries(row)
    .filter(([k, v]) => k !== "live_cards" && typeof v === "number" && v > 0)
    .sort((a, b) => b[1] - a[1]) as [string, number][];
  const label = counts.length === 1 && counts[0][1] === row.live_cards ? counts[0][0] : null;
  return { label, sentence: label ? PLAIN_LANGUAGE[label] ?? null : null, counts, liveCards: row.live_cards };
}
