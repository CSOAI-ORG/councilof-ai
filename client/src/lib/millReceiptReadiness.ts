export type MillReceipt = {
  id: string;
  card_url: string;
  model: string;
  axis: string;
  measured_at: string | null;
  outer_signature: { state: "VALID" | "INVALID" | "UNCHECKABLE"; alg: string | null; key: string | null };
  declared_lifecycle: string;
  regulatory_linkage: { state: "LINKED" | "UNLINKED"; source_state: string; refs: string[]; regulation_score_eligible: boolean };
};

export type MillReceiptReadiness = {
  schema: "csoai.mill-receipt-readiness/v1";
  truth_rule: string;
  counts: Record<string, number>;
  receipts: MillReceipt[];
};

export function isMillReceiptReadiness(value: unknown): value is MillReceiptReadiness {
  const data = value as MillReceiptReadiness;
  if (data?.schema !== "csoai.mill-receipt-readiness/v1" || !Array.isArray(data.receipts)) return false;
  return data.receipts.every((row) =>
    row.outer_signature?.state === "VALID" &&
    row.declared_lifecycle === "STAGED_UNSIGNED" &&
    (row.regulatory_linkage?.state === "LINKED" || row.regulatory_linkage?.state === "UNLINKED") &&
    row.regulatory_linkage.regulation_score_eligible === (row.regulatory_linkage.state === "LINKED")
  );
}

export const regulationLabel = (row: MillReceipt) =>
  row.regulatory_linkage.regulation_score_eligible ? "linked evidence; scoring eligible" : "unlinked; no regulation score";
