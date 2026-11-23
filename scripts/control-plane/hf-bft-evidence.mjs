// SPDX-License-Identifier: MIT
// Historical Hugging Face BFT capability record verifier.
//
// Important separation:
// 1. Exact source hash + a verifiable Ed25519 signature proves historical bytes.
// 2. An embedded key does not authenticate institutional custodian or DID binding.
// 3. Successful fault-injection accuracy does not prove a Byzantine agreement protocol.
// 4. No GSPC measurements, legal mappings or human authority are changed by this module.
import { createHash, createPublicKey, verify } from "node:crypto";

export const HISTORICAL_BFT_EVIDENCE = Object.freeze({
  repository: "csoai/gspc-master",
  file: "capability-records/meok-bft-council-of-referees.json",
  url: "https://huggingface.co/datasets/csoai/gspc-master/blob/main/capability-records/meok-bft-council-of-referees.json",
  checked_as_of: "2026-11-22",
  source_sha256: "2b727f6b4051ddae0200aaca924599d53706e2dea01f46c28d5795d6d68859c7",
  embedded_signer_spki_sha256: "29b7ea31d834532f20468ac53b8b2b48570bf929bad3086ecf8d5c0b8d4aff00",
});
const SHA = /^[0-9a-f]{64}$/;
const hash = b => createHash("sha256").update(b).digest("hex");
const assert = (condition,why) => {if (!condition) throw new Error(why)};
function parsedCount(value) { return typeof value==="string" && /^\d+\/\d+$/.test(value) ? value.split("/").map(Number) : null; }

export function reviewBftCapabilityEvidence(raw, pins = HISTORICAL_BFT_EVIDENCE) {
  assert(raw instanceof Uint8Array || typeof raw==="string","exact source bytes required");
  const bytes=typeof raw==="string"?Buffer.from(raw,"utf8"):Buffer.from(raw);
  assert(bytes.length>0 && bytes.length<=65536,"bounded signed record required");
  assert(SHA.test(pins?.source_sha256??"") && SHA.test(pins?.embedded_signer_spki_sha256??""),"two independent pins required");
  const digest=hash(bytes);
  assert(digest===pins.source_sha256,"source bytes changed: review a new revision rather than updating pins");
  const record=JSON.parse(bytes.toString("utf8"));
  assert(record.schema==="csoai.capability-verdict/0.1" &&
    record.axis==="bft-council-of-referees-and-12around1","unexpected capability schema");
  assert(record.signature?.alg==="Ed25519" && typeof record.signature.public_key_pem==="string", "unexpected signature");
  const signature=Buffer.from(record.signature.value_b64??"","base64");
  assert(signature.length===64 && record.signature.value_b64===signature.toString("base64"),"invalid signature bytes");
  const key=createPublicKey(record.signature.public_key_pem);
  assert(key.asymmetricKeyType==="ed25519","expected Ed25519 public key");
  const signerFingerprint=hash(key.export({format:"der",type:"spki"}));
  assert(signerFingerprint===pins.embedded_signer_spki_sha256,"signer identity changed");
  const unsigned={...record};
  delete unsigned.signature;
  // Observed historic producer used insertion-order compact JSON.
  // Do not reserialise with another canonicalisation and call it the same proof.
  assert(verify(null,Buffer.from(JSON.stringify(unsigned),"utf8"),key,signature),
    "signature does not verify over specified historic producer encoding");

  const t1=record.track1_all_13_corpora;
  const t2=record.track2_bft_fault_sweep;
  const t3=record.track3_heldout_72;
  const t4=record.track4_live_frontier_shootout;
  assert(t1?.total_distinct_items===782 && t2?.council_voter_seats_n===12 &&
    t2?.referee_council_seats_n===5 && t3?.n===72 && t4?.items_n===24,
    "historic record topology differs from reviewed reference");
  const rows=t4.per_item_comparison;
  assert(Array.isArray(rows)&&rows.length===t4.items_n,"missing item-level comparison rows");
  const validRows=rows.filter(x=>x?.meok_full_bft_council_of_referees===x.expected).length;
  const declared=t4.architecture_leaderboard.find(x=>x.architecture_id==="meok-full-12around1-bft-council-of-referees");
  const stated=parsedCount(declared?.score);
  assert(stated && stated[0]===validRows && stated[1]===rows.length,
    "published architecture result differs from contained per-item rows");
  const sweep=t2.fault_sweep_matrix;
  assert(Array.isArray(sweep)&&sweep.length===18,"fault-sweep rows missing");
  const minIntersection=2*3-5; // 3-of-5 overlap: one voter; could be the faulty one.
  return {
    schema:"csoai.historical-bft-evidence-review/0.1",
    source_sha256:digest, evaluated_at:record.evaluated_at,
    integrity:"SIGNED_RECORD_VALID_AGAINST_PINNED_EMBEDDED_KEY",
    institutional_signer_binding:"NOT_ESTABLISHED_BY_THIS_ARTIFACT",
    council_independence:"NOT_DEMONSTRATED_BY_THIS_ARTIFACT",
    model_implementation_reproduction:"NOT_PERFORMED",
    track1_reported:record.summary.track1_all_13_corpora_score,
    track2_reported:record.summary.track2_bft_fref1_fseats3_score,
    track3_reported:record.summary.track3_heldout_72_score,
    track4_reported:record.summary.track4_live_frontier_full_stack_score,
    track4_per_item_recount:{correct:validRows,total:rows.length},
    frontier_http:{declared_calls:t4.total_live_http_calls,successful_calls:t4.successful_live_http_calls},
    declared_topology:{voter_seats:t2.council_voter_seats_n,referee_seats:t2.referee_council_seats_n,
      referee_threshold:"3-of-5 as stated in report"},
    quorum_intersection:{
      quorum_size:3,replicas:5,minimal_overlap:minIntersection,
      single_byzantine_can_control_intersection:minIntersection<=1,
      result:"THRESHOLD_ALONE_DOES_NOT_PROVE_BFT_SAFETY",
    },
    external_did_key_binding:"REQUIRES_SEPARATE_TRUSTED_ISSUER_EVIDENCE",
    change_controls:{
      gspc_scores_changed:false, human_authority_granted:false, bft_proven:false,
      tokens_issued:false, external_groups_contacted:false,
    },
    limitations:[
      "A valid signature binds bytes to an embedded key; no automatic DID or organisational authority is inferred.",
      "Self-reported experimental outcomes require independent replay and ground-truth methodology review.",
      "3-of-5 alone has a one-member quorum intersection, which a single Byzantine voter could control; additional protocol state may matter.",
      "The historical report records 185 successful calls of 192 requested frontier HTTP calls.",
      "No raw 782-answer proof is reconstructed from the aggregate fields in this capability record.",
    ],
  };
}
