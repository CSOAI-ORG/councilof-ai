/** A free byte contract for the SAME rows the existing population door delivers.
 * No payment, key, signature, score or Bitcoin-verification assertion is created here.
 */
import { canonicalBytes, sha256Hex } from "../_lib/cardSign";
import type { PopulationEntry, Reading } from "./_population";

export const MANIFEST_SCHEMA = "csoai.population-delivery-manifest/0.1";
export const EXPECTED_ROWS_HEADER = "x-csoai-expected-rows-sha256";
export function deliveryReadFailure(r: Reading): string | null {
  if (r.state === "UNMEASURED" || r.state === "UNCHECKABLE" || r.rows === undefined)
    return r.reason || `Population read is ${r.state} or has no deliverable rows`;
  if (r.state !== "INDEXED" && r.state !== "MEASURED") return "Unrecognised population state";
  return null;
}
export function expectedDigest(request: Request): string | null {
  const value = request.headers.get(EXPECTED_ROWS_HEADER);
  if (value === null) return null;
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error("Expected rows digest must be 64 lowercase hexadecimal characters");
  return value;
}
export async function rowCommitment(r: Reading) {
  const failure = deliveryReadFailure(r);
  if (failure) throw new Error(failure);
  const bytes = canonicalBytes(r.rows);
  return { rows_sha256: await sha256Hex(bytes), rows_bytes: bytes.byteLength };
}
export async function makeDeliveryManifest(entry: PopulationEntry, r: Reading, origin: string) {
  const commitment = await rowCommitment(r);
  return {
    schema: MANIFEST_SCHEMA,
    id: entry.id,
    resource: `${origin}/api/pop/${entry.id}`,
    manifest_url: `${origin}/api/pop/${entry.id}/manifest`,
    coverage: { population: entry.population, record_count: r.n, unit: r.n_unit, source_state: r.state, gaps: r.unmeasured, source: r.source },
    freshness: {
      as_of: r.as_of,
      as_of_basis: "The source artifact timestamp; not request time or publication time",
      max_age_hours: null,
      policy: "SOURCE_DATED_SNAPSHOT_NO_SERVICE_FRESHNESS_LIMIT_DECLARED",
      note: "A dated or frozen artifact is not automatically a current observation. Consumers set a freshness requirement; this manifest invents none.",
    },
    evidence: {
      ...commitment,
      canonicalization: "Exactly canonicalBytes(payload.rows) from the existing card-v0 serializer, not JSON.stringify(payload), not the entire response envelope",
      digest_algorithm: "SHA-256",
      hash_covers: "payload.rows",
      signature: { state: "NOT_CREATED_BY_MANIFEST", note: "The paid response's separate attestation describes its own signature state; verify that signature independently." },
      merkle_root: null,
      bitcoin_chain_verified: false,
      note: "No Merkle root or Bitcoin attestation is asserted for these assembled rows. Other capture roots must not be substituted.",
    },
    pinning: {
      request_header: EXPECTED_ROWS_HEADER,
      value: commitment.rows_sha256,
      mismatch_http_status: 409,
      effect: "A mismatched expected digest is rejected before signing or facilitator verification/settlement.",
      optional_for_legacy_clients: true,
    },
    claim_boundary: {
      proves: ["A digest of the exact assembled population rows returned by this read", "Source population, timestamp and declared gaps remain explicit"],
      does_not_prove: ["Source statements are true", "Population rows are a complete fresh census", "Reserves, solvency, certification or customer delivery", "This read was paid, signed or Bitcoin verified"],
    },
    free: true,
    settlement_attempted: false,
  };
}
