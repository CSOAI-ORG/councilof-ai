/** Project the existing unsigned check ledger; never run or reschedule a read. */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const COMPLETED = new Set(["UNCHANGED", "READ_NOT_COMPARABLE", "CHANGED_CONFIRMED"]);
const OUTCOMES = new Set([...COMPLETED, "FETCH_FAILED", "UNCONFIRMED"]);
const HASH = /^[0-9a-f]{64}$/;
const SCHEMAS = new Set(["csoai.claim-maintenance-check/0.1", "csoai.claim-maintenance-check/0.2"]);

// These are the ledger's existing wire profiles, not a permissive Date.parse.
// Validate real Gregorian dates without normalizing an invalid observation.
function validDay(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1];
}
function validInstant(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)) return false;
  return validDay(value.slice(0, 10)) && Number(value.slice(11, 13)) <= 23 &&
    Number(value.slice(14, 16)) <= 59 && Number(value.slice(17, 19)) <= 59;
}
function validClock(value) {
  // The register producer deliberately accepts a UTC date or whole-second instant.
  return validDay(value) || validInstant(value);
}

// maintenance_due.py hashes Python json.dumps(sort_keys=True, ensure_ascii=True).
// All schema keys are ASCII and all numeric ledger fields are integers.
export function ledgerCanonical(value) {
  const walk = (v) => {
    if (v === null || typeof v === "boolean" || typeof v === "string") return JSON.stringify(v);
    if (typeof v === "number") {
      if (!Number.isSafeInteger(v)) throw new Error("non-integer ledger number");
      return String(v);
    }
    if (Array.isArray(v)) return `[${v.map(walk).join(",")}]`;
    if (!v || typeof v !== "object") throw new Error("invalid ledger value");
    return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${walk(v[k])}`).join(",")}}`;
  };
  return walk(value).replace(/[\u0080-\uffff]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

export function verifyOutcomes(raw, capture) {
  if (capture?.schema !== "csoai.claim-maintenance-public-capture/0.1" ||
      capture?.file !== "outcomes.jsonl" ||
      !/^[0-9a-f]{40}$/.test(capture?.source_revision ?? "")) throw new Error("invalid check capture");
  const source = `https://huggingface.co/datasets/csoai/councilof-ai-evidence/resolve/${capture.source_revision}/public/interop/claim-maintenance/outcomes.jsonl`;
  if (capture.source_url !== source || digest(raw) !== capture.bytes_sha256) throw new Error("check capture bytes or source pin mismatch");
  const rows = raw.toString("utf8").split(/\r?\n/).filter((line) => line.trim()).map((line) => JSON.parse(line));
  let prev = "0".repeat(64);
  for (const [seq, row] of rows.entries()) {
    const { row_sha256, ...body } = row;
    if (!SCHEMAS.has(row.schema) || row.seq !== seq || row.prev_hash !== prev ||
        !HASH.test(row_sha256 ?? "") || digest(ledgerCanonical(body)) !== row_sha256 ||
        typeof row.registry_id !== "string" || typeof row.registry_url !== "string" ||
        !validDay(row.due) ||
        !validInstant(row.checked_at) ||
        !OUTCOMES.has(row.outcome) || !Array.isArray(row.claim_ids_read) ||
        !Array.isArray(row.claims_fetch_failed) || !Array.isArray(row.claims_unconfirmed)) {
      throw new Error(`invalid check chain/schema at seq ${seq}`);
    }
    prev = row_sha256;
  }
  if (capture.entries !== rows.length || capture.outcomes_head_sha256 !== (rows.length ? prev : null)) throw new Error("check capture head/count mismatch");
  return { rows, capture };
}

export function readOutcomes(dir) {
  const path = join(dir, "outcomes.jsonl");
  const capturePath = join(dir, "capture.json");
  if (!existsSync(path) && !existsSync(capturePath)) return { rows: [], capture: null };
  if (!existsSync(path) || !existsSync(capturePath)) throw new Error("check ledger requires its byte-pinned capture");
  return verifyOutcomes(readFileSync(path), JSON.parse(readFileSync(capturePath, "utf8")));
}

export function scheduledReadState({ next, asOf, registry, claimIds, ledger }) {
  if (!validClock(asOf)) throw new Error("invalid maintenance asOf clock");
  if (next === null || next === undefined || next === "") return { state: "UNSCHEDULED", evidence: null };
  if (!validClock(next)) throw new Error("invalid maintenance next clock");
  // Defense at the consumer boundary also covers callers with retained row objects.
  // This is time validation only; it does not re-verify a ledger hash or signature.
  if (!ledger || !Array.isArray(ledger.rows) || ledger.rows.some((row) =>
      !validDay(row?.due) || !validInstant(row?.checked_at))) {
    throw new Error("invalid maintenance ledger clock");
  }
  if (next > asOf) return { state: "SCHEDULED", evidence: null };
  const matches = ledger.rows.filter((row) => row.registry_id === registry.id && row.registry_url === registry.url &&
    row.registry_sha256 === registry.sha256 && row.check === "scheduled-read" && row.due <= next.slice(0, 10) &&
    row.checked_at >= next && row.checked_at <= asOf && claimIds.length &&
    claimIds.every((id) => row.claim_ids_read.includes(id)));
  const row = matches.at(-1);
  if (!row) return { state: "DUE_EXECUTION_UNVERIFIED", evidence: null };
  const complete = COMPLETED.has(row.outcome) && !row.claims_fetch_failed.length && !row.claims_unconfirmed.length;
  return {
    state: complete ? "COMPLETED" : "RETRY_REQUIRED",
    evidence: {
      outcome: row.outcome, checked_at: row.checked_at, row_sha256: row.row_sha256,
      registry_sha256: row.registry_sha256, claim_ids: claimIds,
      failed_claim_ids: row.claims_fetch_failed, unconfirmed_claim_ids: row.claims_unconfirmed,
      source: ledger.capture.source_url, captured_at: ledger.capture.captured_at,
      ledger_bytes_sha256: ledger.capture.bytes_sha256,
      boundary: "Unsigned producer report with a verified local hash chain; not independent source truth, signature verification or Bitcoin inclusion.",
    },
  };
}
