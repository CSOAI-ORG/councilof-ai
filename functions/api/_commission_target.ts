/**
 * Typed commission target classification — shared by request-attestation + /api/commissions.
 * Ambiguous subjects must be rejected BEFORE payment admit.
 * payai-wrapper / SKU → UNFULFILLABLE (receipt OK, never model mill).
 */
export type SubjectKind = "ollama_model" | "hub_model" | "sku_wrapper" | "ambiguous";
export type Fulfillment = "QUEUED" | "UNFULFILLABLE" | "RETRIEVABLE";

export type CommissionTarget = {
  subject_kind: SubjectKind;
  model: string | null;
  bank: string | null;
  fulfillment: Fulfillment;
  admit: boolean; // false → reject before verify/settle
  reason: string;
};

export function classifyCommissionTarget(subject: string): CommissionTarget {
  const s = subject.trim();
  if (!s) {
    return {
      subject_kind: "ambiguous",
      model: null,
      bank: null,
      fulfillment: "UNFULFILLABLE",
      admit: false,
      reason: "empty subject",
    };
  }
  if (/^payai-wrapper/i.test(s) || /^sku:/i.test(s) || /^wrapper-/i.test(s) || /wrapper-\d/i.test(s)) {
    return {
      subject_kind: "sku_wrapper",
      model: null,
      bank: null,
      fulfillment: "UNFULFILLABLE",
      admit: true,
      reason: "SKU/wrapper — receipt OK, not a model mill target",
    };
  }
  // Ollama tag name:tag
  if (/^[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$/.test(s)) {
    return {
      subject_kind: "ollama_model",
      model: s,
      bank: null,
      fulfillment: "QUEUED",
      admit: true,
      reason: "ollama-shaped model tag",
    };
  }
  // HF org/name
  if (/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+/.test(s)) {
    return {
      subject_kind: "hub_model",
      model: s,
      bank: null,
      fulfillment: "QUEUED",
      admit: true,
      reason: "hub-shaped model id",
    };
  }
  // Bare id — ollama candidate when model-shaped (digit, hyphen, or dot). Plain words stay ambiguous.
  if (/^[a-zA-Z0-9._-]+$/.test(s) && s.length <= 64 && (/[0-9]/.test(s) || /[-.]/.test(s))) {
    return {
      subject_kind: "ollama_model",
      model: s,
      bank: null,
      fulfillment: "QUEUED",
      admit: true,
      reason: "bare model-like id",
    };
  }
  return {
    subject_kind: "ambiguous",
    model: null,
    bank: null,
    fulfillment: "UNFULFILLABLE",
    admit: false,
    reason: "ambiguous subject — pass an ollama tag (name:tag), hub id (org/name), or sku/payai-wrapper; rejected before payment",
  };
}
