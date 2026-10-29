/** Read-only projection. Parsing a receipt does not verify its signature or grant authority. */
export type PublicHitlReceipt = {
  schema: "csoai.hitl-oversight-receipt/0.1";
  at: string;
  operator: string;
  axis: string | null;
  decision: "APPROVED" | "HOLD" | "REJECTED";
  note: string;
  challenge: { id: string; subject: string; proposed_action: string };
  signature: {
    value_hex: string | null;
    did?: string | null;
    unsigned_reason?: string | null;
  };
};
export type PublicHitlRecord = {
  schema: "csoai.hitl-record/0.1";
  store_bound: boolean;
  count: number;
  receipts: PublicHitlReceipt[];
};
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export function parseHitlRecord(text: string): PublicHitlRecord {
  const value: unknown = JSON.parse(text);
  if (
    !object(value) ||
    value.schema !== "csoai.hitl-record/0.1" ||
    typeof value.store_bound !== "boolean" ||
    !Array.isArray(value.receipts) ||
    !Number.isSafeInteger(value.count) ||
    value.count !== value.receipts.length
  ) {
    throw new Error(
      "The decision record is incomplete or has an unsupported format.",
    );
  }
  for (const r of value.receipts) {
    if (
      !object(r) ||
      r.schema !== "csoai.hitl-oversight-receipt/0.1" ||
      !["APPROVED", "HOLD", "REJECTED"].includes(String(r.decision)) ||
      typeof r.at !== "string" ||
      !Number.isFinite(Date.parse(r.at)) ||
      typeof r.operator !== "string" ||
      typeof r.note !== "string" ||
      !(r.axis === null || typeof r.axis === "string") ||
      !object(r.challenge) ||
      typeof r.challenge.id !== "string" ||
      !r.challenge.id ||
      typeof r.challenge.subject !== "string" ||
      typeof r.challenge.proposed_action !== "string" ||
      !object(r.signature) ||
      !(
        r.signature.value_hex === null ||
        typeof r.signature.value_hex === "string"
      ) ||
      !(r.signature.did == null || typeof r.signature.did === "string") ||
      !(
        r.signature.unsigned_reason == null ||
        typeof r.signature.unsigned_reason === "string"
      )
    ) {
      throw new Error(
        "A decision entry is unreadable. No entries have been silently omitted.",
      );
    }
  }
  return value as unknown as PublicHitlRecord;
}

export function filterHitlReceipts(
  receipts: PublicHitlReceipt[],
  query: string,
): PublicHitlReceipt[] {
  const q = query.trim().toLowerCase();
  return receipts.filter((r) =>
    [r.challenge.id, r.challenge.subject, r.decision, r.axis ?? "", r.at].some(
      (value) => value.toLowerCase().includes(q),
    ),
  );
}
