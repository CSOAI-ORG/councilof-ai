export type OuterSignatureState = "VALID" | "INVALID" | "UNCHECKABLE";
export type DeclaredLifecycle = "STAGED_UNSIGNED" | "SIGNED";

export type MillReceipt = {
  id: string;
  card_url: string;
  model: string;
  axis: string;
  measured_at: string | null;
  outer_signature: { state: OuterSignatureState; alg: string | null; key: string | null };
  declared_lifecycle: DeclaredLifecycle;
  regulatory_linkage: { state: "LINKED" | "UNLINKED"; source_state: string; refs: string[]; regulation_score_eligible: boolean };
};

/**
 * v1 (staged, unsigned receipts) and v2 (the same receipts after signing, 2026-09) are both read.
 * The producer is scripts/build-mill-receipt-readiness.mjs. Until 6 Oct 2026 this reader accepted
 * only v1, so the live v2 file was rejected whole and /board/models printed the raw validator
 * error ("invalid truth contract") to the public.
 */
export const MILL_RECEIPT_SCHEMAS = ["csoai.mill-receipt-readiness/v1", "csoai.mill-receipt-readiness/v2"] as const;

export type MillReceiptReadiness = {
  schema: (typeof MILL_RECEIPT_SCHEMAS)[number];
  truth_rule: string;
  counts: Record<string, number>;
  receipts: MillReceipt[];
};

const OUTER_STATES: readonly string[] = ["VALID", "INVALID", "UNCHECKABLE"];
const LIFECYCLES: readonly string[] = ["STAGED_UNSIGNED", "SIGNED"];

export function isMillReceiptReadiness(value: unknown): value is MillReceiptReadiness {
  const data = value as MillReceiptReadiness;
  if (!(MILL_RECEIPT_SCHEMAS as readonly string[]).includes(data?.schema) || !Array.isArray(data.receipts)) return false;
  // An INVALID or UNCHECKABLE outer signature is a state to DISPLAY, not a reason to hide the file.
  // What still rejects the file: an unknown state, or a receipt that claims regulation-score
  // eligibility without a regulatory link.
  return data.receipts.every((row) =>
    OUTER_STATES.includes(row.outer_signature?.state) &&
    LIFECYCLES.includes(row.declared_lifecycle) &&
    (row.regulatory_linkage?.state === "LINKED" || row.regulatory_linkage?.state === "UNLINKED") &&
    row.regulatory_linkage.regulation_score_eligible === (row.regulatory_linkage.state === "LINKED")
  );
}

export const regulationLabel = (row: MillReceipt) =>
  row.regulatory_linkage.regulation_score_eligible ? "linked evidence; scoring eligible" : "unlinked; no regulation score";

/** Text colour for an outer-signature state: only VALID reads green. */
export const outerStateClass = (state: OuterSignatureState) =>
  state === "VALID" ? "text-emerald-700" : state === "INVALID" ? "text-red-700" : "text-amber-800";
