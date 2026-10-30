/** Council's Message-only A2A adapter for an unsigned local evidence declaration.
 * Validation covers the declared envelope, digest shape/divergence and named MEOK
 * H.I.M. review. Source bytes are neither received nor re-hashed: this is not GSPC
 * measurement, independent verification, certification, signing, anchoring or storage. */

type Json = Record<string, unknown>;
const record = (value: unknown): Json | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : null;
const nonEmpty = (value: unknown, minimum = 1): value is string =>
  typeof value === "string" && value.trim().length >= minimum;
const hex64 = (value: unknown) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const exactKeys = (value: Json, keys: string[]) => {
  const allowed = new Set(keys);
  return keys.every((key) => Object.prototype.hasOwnProperty.call(value, key)) &&
    Object.keys(value).every((key) => allowed.has(key));
};

const CLAIM_STATES: Record<string, string> = {
  approve: "LOCAL_DRAFT_REVIEWED",
  changes: "LOCAL_DRAFT_CHANGES_REQUIRED",
  reject: "LOCAL_DRAFT_REJECTED",
};

export function validateEvidenceDeliveryInput(raw: unknown): string | null {
  const input = record(raw);
  if (!input || !exactKeys(input, ["draft"])) return "input requires exactly draft";
  const draft = record(input.draft);
  if (!draft) return "input.draft must be an object";
  if (draft.schema !== "csoai.local-evidence-draft/1.2" || draft.artifact_state !== "UNSIGNED_LOCAL_DRAFT") {
    return "Unsupported draft schema or artifact state";
  }
  if (draft.certification !== false) return "Local evidence cannot assert certification";
  if (draft.measurement_state !== "LOCAL_OBSERVATION_NOT_INDEPENDENT_MEASUREMENT") {
    return "Local evidence cannot assert independent measurement";
  }
  if (!nonEmpty(draft.receipt_id) || !nonEmpty(draft.claim_state)) return "Receipt id and local claim state are required";

  const evidence = record(draft.evidence);
  const him = record(draft.meok_him);
  const subject = record(draft.subject);
  const method = record(draft.method);
  const boundary = record(draft.claim_boundary);
  if (!nonEmpty(subject?.id, 3) || !hex64(evidence?.input_sha256) || !hex64(evidence?.negative_control_sha256)) {
    return "Subject and two SHA-256 digests are required";
  }
  if (evidence?.input_sha256 === evidence?.negative_control_sha256 || evidence?.negative_control_result !== "DIVERGENT") {
    return "Negative control must diverge";
  }
  if (method?.digest_algorithm !== "SHA-256") return "The declared digest algorithm must be SHA-256";
  if (!nonEmpty(evidence?.observed_state, 8) || !nonEmpty(evidence?.limitations, 8) ||
      !nonEmpty(evidence?.incidents_or_near_misses, 2) || !nonEmpty(evidence?.intervention_point, 8)) {
    return "Observations, limitations, incidents and an intervention point are required";
  }
  if (boundary?.current_local_evidence_only !== true || boundary?.capture_is_not_a_finding !== true || boundary?.continuous_watch !== false) {
    return "The local-only, non-finding and no-continuous-watch boundaries are required";
  }
  if (him?.human_in_loop !== true || !nonEmpty(him.reviewer, 2)) return "Named MEOK H.I.M. review is required";
  const decision = String(him.review_decision);
  if (!Object.prototype.hasOwnProperty.call(CLAIM_STATES, decision)) return "Unknown human review decision";
  if (!nonEmpty(him.review_notes, 8) || !["not-required", "available", "performed", "blocked"].includes(String(him.intervention_status))) {
    return "Human review notes and intervention status are required";
  }
  if (draft.claim_state !== CLAIM_STATES[decision]) return "Local claim state does not match the human review decision";
  return null;
}

export function evidenceDeliveryMessage(input: unknown, messageId: string, contextId: string) {
  const invalid = validateEvidenceDeliveryInput(input);
  if (invalid) throw new Error(invalid);
  const draft = (input as Json).draft as Json;
  const him = draft.meok_him as Json;
  return {
    message: {
      messageId,
      contextId,
      role: "ROLE_AGENT",
      parts: [
        {
          text: "Unsigned local evidence declaration received. Envelope checks passed; source bytes were not received or re-hashed. This is not GSPC measurement, independent verification, certification, signing, anchoring or durable storage.",
          mediaType: "text/plain",
        },
        {
          data: {
            schema: "council-os.evidence-delivery-result/1.0",
            receipt_id: draft.receipt_id,
            local_claim_state: draft.claim_state,
            human_review_decision: him.review_decision,
            council_measurement_performed: false,
            source_digest_recomputed: false,
            signed: false,
            anchored: false,
            certification: false,
            adapter_storage_performed: false,
            source_bytes_received: false,
            evidence: draft,
          },
          mediaType: "application/json",
        },
      ],
    },
  };
}
