/**
 * The read contract for public/interop/mill-receipt-readiness.json.
 *
 * v2 (schema `csoai.mill-receipt-readiness/v2`) resolves each of the original
 * STAGED_UNSIGNED wrappers through public/interop/mill-cards-signed/SUPERSEDED.jsonl
 * to its terminal signed replacement, so every published row is declared SIGNED and
 * the generator pins declared_staged_unsigned at 0. v1 read the staged wrappers
 * directly and required the opposite lifecycle; a v1 reader therefore rejects every
 * v2 row, which is how this panel came to render its error state instead of the
 * receipts.
 *
 * measured_at is read off the signed bytes and is never supplied by the generator.
 * Where it is null the artifact states why, in `measured_at_absence`, because an
 * UNMEASURED card having no date is not the same defect as a MEASURED card that was
 * signed without one. This reader fails closed on a bare null: a row with no date
 * and no stated reason for the absence is rejected, exactly as an invalid signature
 * would be.
 */

export type MillReceiptStatus = "MEASURED" | "UNMEASURED";
export type OuterSignatureState = "VALID" | "INVALID" | "UNCHECKABLE";
export type RegulatoryLinkageState = "LINKED" | "UNLINKED";

export type MillReceipt = {
  id: string;
  card_url: string;
  supersedes_staged_id?: string;
  model: string;
  axis: string;
  status: MillReceiptStatus;
  unmeasured: string[];
  measured_at: string | null;
  measured_at_absence: string | null;
  outer_signature: { state: OuterSignatureState; alg: string | null; key: string | null };
  declared_lifecycle: string;
  regulatory_linkage: {
    state: RegulatoryLinkageState;
    source_state: string;
    refs: string[];
    regulation_score_eligible: boolean;
  };
};

export type MillReceiptReadiness = {
  schema: "csoai.mill-receipt-readiness/v2";
  derived_from?: string;
  truth_rule: string;
  counts: Record<string, number>;
  receipts: MillReceipt[];
};

export const MILL_RECEIPT_READINESS_SCHEMA = "csoai.mill-receipt-readiness/v2";

/**
 * Counts the artifact has published since the first v2 revision. A missing one is a
 * broken contract. The measured_at_* counts arrived later, so they are checked when
 * present and never required — every row already carries its own status and absence,
 * and the panel derives what it displays from the rows rather than from these.
 */
const REQUIRED_COUNTS = [
  "receipts",
  "outer_signature_valid",
  "declared_staged_unsigned",
  "declared_signed",
  "regulatory_linked",
  "regulatory_unlinked",
  "regulation_score_eligible",
] as const;

const isSentence = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";

const isStringList = (value: unknown): value is string[] => Array.isArray(value) && value.every(isSentence);

const isAbsent = (value: unknown) => value === null || value === undefined;

function isMillReceipt(row: MillReceipt): boolean {
  if (!isSentence(row?.id) || !isSentence(row.card_url) || !isSentence(row.model) || !isSentence(row.axis)) return false;

  // Outer cryptography and the inner declared lifecycle stay independent states.
  if (row.outer_signature?.state !== "VALID") return false;
  if (row.declared_lifecycle !== "SIGNED") return false;

  // MEASURED carries no reasons; UNMEASURED must say why it is unmeasured.
  if (row.status !== "MEASURED" && row.status !== "UNMEASURED") return false;
  if (!isStringList(row.unmeasured)) return false;
  if ((row.status === "UNMEASURED") !== (row.unmeasured.length > 0)) return false;

  // A date, or a sentence saying why there is none. Never a bare null.
  const dated = isSentence(row.measured_at);
  if (!dated && row.measured_at !== null) return false;
  if (dated && !isAbsent(row.measured_at_absence)) return false;
  if (!dated && !isSentence(row.measured_at_absence)) return false;

  const linkage = row.regulatory_linkage;
  if (linkage?.state !== "LINKED" && linkage?.state !== "UNLINKED") return false;
  if (!isSentence(linkage.source_state) || !isStringList(linkage.refs)) return false;
  // A linked receipt must name what it is linked to, and only a linked receipt is scored.
  if (linkage.state === "LINKED" && linkage.refs.length === 0) return false;
  if (linkage.regulation_score_eligible !== (linkage.state === "LINKED")) return false;

  return true;
}

/** Every number the panel shows, derived from the rows it has just validated. */
export function summariseReceipts(rows: MillReceipt[]) {
  const dated = rows.filter((row) => row.measured_at !== null);
  const undated = rows.filter((row) => row.measured_at === null);
  return {
    receipts: rows.length,
    outer_signature_valid: rows.filter((row) => row.outer_signature.state === "VALID").length,
    declared_staged_unsigned: rows.filter((row) => row.declared_lifecycle === "STAGED_UNSIGNED").length,
    declared_signed: rows.filter((row) => row.declared_lifecycle === "SIGNED").length,
    regulatory_linked: rows.filter((row) => row.regulatory_linkage.state === "LINKED").length,
    regulatory_unlinked: rows.filter((row) => row.regulatory_linkage.state === "UNLINKED").length,
    regulation_score_eligible: rows.filter((row) => row.regulatory_linkage.regulation_score_eligible).length,
    measured_at_recorded: dated.length,
    measured_at_absent_unmeasured_card: undated.filter((row) => row.status === "UNMEASURED").length,
    measured_at_absent_dateless_card: undated.filter((row) => row.status === "MEASURED").length,
    status_unmeasured: rows.filter((row) => row.status === "UNMEASURED").length,
  };
}

function countsAgree(counts: Record<string, number>, rows: MillReceipt[]): boolean {
  if (!counts || typeof counts !== "object") return false;
  if (REQUIRED_COUNTS.some((key) => typeof counts[key] !== "number")) return false;
  const derived = summariseReceipts(rows);
  return Object.entries(derived).every(([key, value]) => counts[key] === undefined || counts[key] === value);
}

export function isMillReceiptReadiness(value: unknown): value is MillReceiptReadiness {
  const data = value as MillReceiptReadiness;
  if (data?.schema !== MILL_RECEIPT_READINESS_SCHEMA) return false;
  if (!isSentence(data.truth_rule)) return false;
  if (!Array.isArray(data.receipts) || data.receipts.length === 0) return false;
  if (!data.receipts.every(isMillReceipt)) return false;
  return countsAgree(data.counts, data.receipts);
}

export const regulationLabel = (row: MillReceipt) =>
  row.regulatory_linkage.regulation_score_eligible ? "linked evidence; scoring eligible" : "unlinked; no regulation score";

export type MeasurementReading = {
  /** DATED, or which of the two absences this is — they are never one rendering. */
  kind: "DATED" | "UNMEASURED" | "SIGNED_WITHOUT_DATE";
  label: string;
  detail: string | null;
};

/**
 * What the measurement column says. Every branch returns words: a null date is
 * rendered as the state that produced it, never as an em dash.
 */
export function measurementReading(row: MillReceipt): MeasurementReading {
  if (row.measured_at !== null) return { kind: "DATED", label: row.measured_at, detail: null };
  const detail = row.measured_at_absence;
  if (row.status === "UNMEASURED") {
    return { kind: "UNMEASURED", label: `UNMEASURED · ${row.unmeasured.join("; ")}`, detail };
  }
  return { kind: "SIGNED_WITHOUT_DATE", label: "MEASURED · signed without a date", detail };
}
