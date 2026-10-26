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

/** The OTS-stamped snapshot of 2026-09. Its bytes are frozen; later readiness files are versions. */
export const MILL_RECEIPT_SNAPSHOT = "/interop/mill-receipt-readiness.json";
/**
 * Unsigned discovery pointer to the stamped readiness version whose content matches the signed mill
 * cards (scripts/build-mill-receipt-readiness.mjs --version). Read this, not the snapshot: a stamped
 * file is never rewritten, so a receipt that moves to a newer card appears only in a new
 * mill-receipt-readiness-<date>-<hex12>.json.
 */
export const MILL_RECEIPT_POINTER = "/interop/mill-receipt-readiness-latest.json";
export const MILL_RECEIPT_POINTER_SCHEMA = "csoai.mill-receipt-readiness-pointer/1";
const MILL_RECEIPT_VERSION = /^\/interop\/mill-receipt-readiness(?:-\d{4}-\d{2}-\d{2}-[0-9a-f]{12})?\.json$/;

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

/**
 * Which stamped readiness file is current, and the sha256 its bytes must have. A missing pointer (a
 * deploy from before versioning) falls back to the snapshot; a pointer that is present but malformed
 * or names anything outside the versioned set is an error, never the snapshot.
 */
export async function resolveMillReceiptReadiness(fetcher: typeof fetch = fetch): Promise<{ path: string; sha256: string | null }> {
  const res = await fetcher(MILL_RECEIPT_POINTER);
  if (res.status === 404) return { path: MILL_RECEIPT_SNAPSHOT, sha256: null };
  if (!res.ok) throw new Error(`pointer HTTP ${res.status}`);
  let p: { schema?: unknown; index_url?: unknown; index_sha256?: unknown };
  try { p = await res.json(); } catch { throw new Error("pointer is not JSON"); }
  if (p?.schema !== MILL_RECEIPT_POINTER_SCHEMA || typeof p.index_url !== "string" || !MILL_RECEIPT_VERSION.test(p.index_url) ||
      typeof p.index_sha256 !== "string" || !/^[0-9a-f]{64}$/.test(p.index_sha256)) throw new Error("pointer is malformed");
  return { path: p.index_url, sha256: p.index_sha256 };
}

/** Load the readiness file the pointer selects: only its exact bytes, and only a valid truth contract. */
export async function loadMillReceiptReadiness(fetcher: typeof fetch = fetch): Promise<MillReceiptReadiness> {
  const current = await resolveMillReceiptReadiness(fetcher);
  const res = await fetcher(current.path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const raw = await res.arrayBuffer();
  // The pointer names exact bytes; a file that is not those bytes is not the one it selected.
  if (current.sha256 !== null && hex(await crypto.subtle.digest("SHA-256", raw)) !== current.sha256) {
    throw new Error("readiness bytes do not match the pointer's sha256");
  }
  let value: unknown;
  try { value = JSON.parse(new TextDecoder().decode(raw)); } catch { throw new Error("readiness is not JSON"); }
  if (!isMillReceiptReadiness(value)) throw new Error("invalid truth contract");
  return value;
}

export const regulationLabel = (row: MillReceipt) =>
  row.regulatory_linkage.regulation_score_eligible ? "linked evidence; scoring eligible" : "unlinked; no regulation score";

/** Text colour for an outer-signature state: only VALID reads green. */
export const outerStateClass = (state: OuterSignatureState) =>
  state === "VALID" ? "text-emerald-700" : state === "INVALID" ? "text-red-700" : "text-amber-800";
