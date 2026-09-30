/**
 * /verify-server — per-server evidence, read and re-derived in the browser.
 *
 * Every call below goes through functions/_lib/measurementCapsule.ts, the SAME module the MCP tools
 * (server_evidence, verify_capsule) and the A2A skills run, so the page, the tools and the skills can
 * never disagree about a capsule. Nothing is computed server-side for this page: the browser
 * normalises the URL, hashes it (SHA-256, WebCrypto), fetches the static shard, and — on "verify" —
 * recomputes the capsule id from the capsule's exact bytes and folds its Merkle audit path back to the
 * batch root that the board-signed index names.
 *
 * Doctrine: measurement, not endorsement. States and proofs only; no score, verdict or ranking. An
 * endpoint with no capsule is NOT_MEASURED — never "clean".
 */
import {
  DOCTRINE,
  normaliseEndpoint,
  serverEvidence,
  verifyCapsule,
} from "../../../functions/_lib/measurementCapsule";

export { DOCTRINE, normaliseEndpoint };

export type Json = Record<string, unknown>;

/** One capsule as a per-endpoint shard carries it (scripts/measurement_capsule_layout.py entry_for). */
export type ShardCapsule = {
  capsule_id: string;
  adapter: string;
  kind: string | null;
  schema: string | null;
  subject_id: string | null;
  claim: Json;
  measurement_state: string | null;
  observed_at: string | null;
  correction_pointer: unknown;
  limitations: string[];
  batch: { adapter: string; slug?: string; merkle_root: string; rule?: unknown; version: string };
  inclusion: { leaves: string; capsules: string; record: string; verify_with?: string };
  capsule_json?: string;
};

export type Lookup = {
  state: "MEASURED" | "NOT_MEASURED" | "NOT_PUBLISHED" | "UNREACHABLE" | "UNCHECKABLE";
  endpoint: string | null;
  key: string | null;
  shard_url: string | null;
  as_of: string | null;
  index_root: string | null;
  capsules: ShardCapsule[];
  siblings: string[];
  reason: string | null;
};

export async function lookupServer(origin: string, raw: string): Promise<Lookup> {
  const r = await serverEvidence(origin, raw);
  const state = String(r.state) as Lookup["state"];
  return {
    state,
    endpoint: typeof r.endpoint === "string" ? r.endpoint : null,
    key: typeof r.key === "string" ? r.key : null,
    shard_url: typeof r.shard_url === "string" ? r.shard_url : typeof r.source === "string" ? r.source : null,
    as_of: typeof r.as_of === "string" ? r.as_of : null,
    index_root: typeof r.index_root === "string" ? r.index_root : null,
    capsules: Array.isArray(r.capsules) ? (r.capsules as ShardCapsule[]) : [],
    siblings: Array.isArray(r.other_endpoints_measured_at_this_origin)
      ? (r.other_endpoints_measured_at_this_origin as unknown[]).filter((x): x is string => typeof x === "string")
      : [],
    reason: typeof r.reason === "string" ? r.reason : null,
  };
}

/** The outcome of re-deriving one capsule. PASS / FAIL are about BYTES, never about the server. */
export type Check = {
  outcome: "PASS" | "FAIL" | "UNCHECKABLE";
  state: string;
  why: string;
  recomputed_id: string | null;
  claimed_id: string | null;
  leaf_index: number | null;
  tree_size: number | null;
  batch_root: string | null;
  recomputed_root: string | null;
  signature: string | null;
};

/**
 * Re-derive one capsule: its id from its exact text, its inclusion under the batch root the signed
 * index names, and the index signature under the pinned board key.
 *   PASS         the id recomputes, it is a leaf of the batch, the path folds to the published root,
 *                and the index that names that root verifies under the pinned key;
 *   FAIL         the bytes do not hash to their id (or to the id the listing gave), the id is not in
 *                the batch, or the index signature fails — something was altered;
 *   UNCHECKABLE  this browser could not complete the check (nothing published, unreachable, or no
 *                Ed25519 in this WebCrypto) — a different claim from FAIL.
 */
export async function verifyCapsuleText(origin: string, capsuleText: string, listedId?: string): Promise<Check> {
  const r = await verifyCapsule(origin, capsuleText);
  const id = (r.capsule_id ?? {}) as Json;
  const inc = (r.inclusion ?? {}) as Json;
  const batch = (r.batch ?? {}) as Json;
  const sig = (r.index_signature ?? {}) as Json;
  const state = String(r.state);
  const recomputed = typeof id.recomputed === "string" ? id.recomputed : null;
  const base = {
    state,
    recomputed_id: recomputed,
    claimed_id: typeof id.claimed === "string" ? id.claimed : null,
    leaf_index: typeof inc.leaf_index === "number" ? inc.leaf_index : null,
    tree_size: typeof inc.tree_size === "number" ? inc.tree_size : null,
    batch_root: typeof batch.merkle_root === "string" ? batch.merkle_root : null,
    recomputed_root: typeof inc.recomputed_root === "string" ? inc.recomputed_root : null,
    signature: typeof sig.state === "string" ? sig.state : null,
  };
  if (listedId && recomputed && recomputed !== listedId)
    return { ...base, outcome: "FAIL", why: "These bytes do not hash to the capsule id this listing gave for them: the capsule text was altered." };
  if (state === "ID_MISMATCH")
    return { ...base, outcome: "FAIL", why: "The capsule's bytes do not hash to the capsule_id it carries: the text was altered after it was sealed." };
  if (state === "NOT_INCLUDED")
    return { ...base, outcome: "FAIL", why: String(r.reason ?? "The capsule id is not a leaf of any published batch of its kind.") };
  if (state === "INCLUDED") {
    if (base.signature === "VERIFIES")
      return {
        ...base,
        outcome: "PASS",
        why: "The bytes hash to the capsule id, the id is a leaf of its batch, the audit path folds to the batch root, and that root is named by an index signed under the pinned board key.",
      };
    if (base.signature === "FAILS")
      return { ...base, outcome: "FAIL", why: `Inclusion recomputes, but the index that names the batch root does not verify: ${String(sig.reason ?? "signature fails")}.` };
    return {
      ...base,
      outcome: "UNCHECKABLE",
      why: `Inclusion recomputes, but the index signature could not be checked here (${String(sig.reason ?? base.signature ?? "no signature state")}).`,
    };
  }
  return { ...base, outcome: "UNCHECKABLE", why: String(r.reason ?? `The check stopped at state ${state}.`) };
}

/** Plain-language meaning of each measurement_state the published batches use. */
export const STATE_MEANING: Record<string, string> = {
  CONSISTENT: "What the server's public descriptions declare matched what the live server answered, on this dimension, at observed_at.",
  INCONSISTENT: "Two public statements about this server disagreed on this dimension. It says they differ — not which one is true.",
  UNCHECKABLE: "We could not observe enough to compare (no answer, no declaration, or an unreadable one). Not a finding either way.",
  VERIFIED: "The agent card's signature verified under the key the card references.",
  FAILED: "The agent card's signature did not verify under the key the card references.",
  NOT_LISTED: "The door was not listed on the surface this cell reads, so there was nothing to compare.",
  NOT_DECLARED: "The surface this cell reads declares nothing for this field.",
  UNCHANGED_AT_NAME_GRANULARITY: "The tool names the server listed did not change between the two reads. Descriptions and schemas were not compared.",
  MEASURED: "A measurement was taken and recorded.",
  PARTIAL: "Only part of the measurement completed; the capsule's limitations say which part.",
};

export const LOOKUP_MEANING: Record<Lookup["state"], string> = {
  MEASURED: "At least one signed capsule is keyed to this URL. That means a measurement exists — not that the server passed anything.",
  NOT_MEASURED: "No signed capsule is keyed to this URL. That is not a finding about the server: nothing here says it is clean or unclean.",
  NOT_PUBLISHED: "No measurement index is published on this origin, so nothing could be looked up.",
  UNREACHABLE: "The published index could not be fetched just now. Nothing was concluded; try again.",
  UNCHECKABLE: "The published files could not be read as expected. Nothing was concluded.",
};

/** declared / observed / differential from the capsule's own bytes (the shard keeps the exact line). */
export function capsuleBody(c: ShardCapsule): { declared: unknown; observed: unknown; differential: unknown } | null {
  if (!c.capsule_json) return null;
  try {
    const o = JSON.parse(c.capsule_json) as Json;
    return { declared: o.declared ?? null, observed: o.observed ?? null, differential: o.differential ?? null };
  } catch {
    return null;
  }
}
