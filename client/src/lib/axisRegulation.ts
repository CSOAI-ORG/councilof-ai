/**
 * axisRegulation — human labels for the benchmark axes, the governance-board twin
 * each one links to, and a POINTER-ONLY map from axis to regulatory regime.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS FILE MAKES NO LEGAL DETERMINATION.
 *
 * A regulator-lens entry says "this axis measures behaviour that is RELEVANT to
 * reasoning about regime X" — it is a research pointer, not a finding of
 * conformity or non-conformity, and it never establishes that a model is legal,
 * compliant, high-risk, or safe under any law. Council of AI measures; it does
 * not certify, and it does not adjudicate legal status. The lens exists so a
 * reader working under a given regime can find WHICH axes bear on it, then read
 * the primary law themselves.
 *
 * THE CLEAN HOOK.
 * When the regulation-findings lane lands its structured layer, replace the body
 * of `regulationForAxis()` with a read of that layer, keyed by axis id, and keep
 * this file's TYPES as the contract. Nothing else in the leaderboard imports the
 * table directly — they all go through `regulationForAxis()` and
 * `axisMeta()` — so the swap is one function, no call-site churn.
 */

export type Regime = "eu-ai-act" | "nist-ai-rmf" | "owasp";

export interface RegimeInfo {
  id: Regime;
  label: string;
  short: string;
}

export const REGIMES: RegimeInfo[] = [
  { id: "eu-ai-act", label: "EU AI Act", short: "EU AI Act — pointers to Articles / Annex III where an axis is relevant." },
  { id: "nist-ai-rmf", label: "NIST AI RMF", short: "NIST AI Risk Management Framework — the GOVERN/MAP/MEASURE/MANAGE function an axis informs." },
  { id: "owasp", label: "OWASP (LLM/ASI)", short: "OWASP Top-10 for LLM Applications — the risk an axis probes." },
];

/** One pointer: which clause of a regime, and why this axis bears on it. Never a verdict. */
export interface RegPointer {
  /** e.g. "Art. 15", "Annex III", "MEASURE 2.7", "LLM01". Free text; it is a citation, not a schema key. */
  ref: string;
  /** One sentence: why this axis is relevant to that clause. Framed as relevance, never as compliance. */
  why: string;
}

export interface AxisMeta {
  id: string;
  label: string;
  blurb: string;
  /** The governance-board slot this benchmark axis links to, if any. NOT a merge — a link. */
  boardTwin?: string;
}

/* ── labels + board twins ────────────────────────────────────────────────── */

const META: Record<string, AxisMeta> = {
  "gspc-governance": { id: "gspc-governance", label: "Governance", blurb: "Does the model follow declared governance rules and escalation paths?", boardTwin: "governance" },
  "gspc-safety": { id: "gspc-safety", label: "Safety", blurb: "Refusal and safe-completion behaviour on a frozen safety bank.", boardTwin: "safety" },
  "gspc-provenance": { id: "gspc-provenance", label: "Provenance", blurb: "Does the model preserve and report the origin of what it produces?", boardTwin: "provenance" },
  "gspc-openness": { id: "gspc-openness", label: "Openness", blurb: "Transparency of reasoning, sources, and disclosed limits.", boardTwin: "openness" },
  "gspc-continuity": { id: "gspc-continuity", label: "Continuity", blurb: "Behavioural stability under adversarial continuation and pressure.", boardTwin: "continuity" },
  "gspc-conformance": { id: "gspc-conformance", label: "Conformance", blurb: "Adherence to a declared machine-readable conformance contract.", boardTwin: "conformance" },
  "care-refusal-help": { id: "care-refusal-help", label: "Care · help", blurb: "Helps where help is the caring answer — the false-refusal side of care.", boardTwin: "care" },
  "care-refusal-protect": { id: "care-refusal-protect", label: "Care · protect", blurb: "Protects where protection is the caring answer — the false-help side of care.", boardTwin: "care" },
  care: { id: "care", label: "Care (bank)", blurb: "The combined care bank read on the full fleet.", boardTwin: "care" },
  gov: { id: "gov", label: "Gov (bank)", blurb: "The governance-instruction bank read on the full fleet.", boardTwin: "governance" },
  "jail-escape-detection": { id: "jail-escape-detection", label: "Jailbreak resistance", blurb: "Detects and resists jailbreak / escape attempts.", boardTwin: "jail" },
  "swarm-candidates": { id: "swarm-candidates", label: "Swarm robustness", blurb: "Behaviour under multi-agent / swarm pressure.", boardTwin: "swarm" },
  "arc-30": { id: "arc-30", label: "ARC (n=30)", blurb: "Abstraction & reasoning bank, 30 frozen items.", },
  "gsm8k-30": { id: "gsm8k-30", label: "GSM8K (n=30)", blurb: "Grade-school math word problems, 30 frozen items." },
  "mmlu-30": { id: "mmlu-30", label: "MMLU (n=30)", blurb: "Multitask knowledge, 30 frozen items." },
  "swag-30": { id: "swag-30", label: "SWAG (n=30)", blurb: "Commonsense next-event inference, 30 frozen items." },
};

export function axisMeta(axisId: string): AxisMeta {
  return META[axisId] ?? { id: axisId, label: prettifyAxis(axisId), blurb: "A signed benchmark axis in the card corpus." };
}

function prettifyAxis(id: string): string {
  return id.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── the pointer table (swap for the regulation-findings layer when it lands) ─ */

const POINTERS: Record<string, Partial<Record<Regime, RegPointer>>> = {
  "gspc-safety": {
    "eu-ai-act": { ref: "Art. 15 · Annex III", why: "Accuracy, robustness and safety are relevant to high-risk system obligations." },
    "nist-ai-rmf": { ref: "MEASURE 2.6/2.7", why: "Safety and security evaluation of AI system behaviour." },
    owasp: { ref: "LLM01 / LLM09", why: "Probes prompt-injection and overreliance failure surfaces." },
  },
  "gspc-provenance": {
    "eu-ai-act": { ref: "Art. 50", why: "Transparency and disclosure of AI-generated or manipulated content." },
    "nist-ai-rmf": { ref: "MAP 1 / MEASURE 2.8", why: "Traceability and content provenance of system outputs." },
    owasp: { ref: "LLM05", why: "Bears on improper output handling and unattributed content." },
  },
  "gspc-governance": {
    "eu-ai-act": { ref: "Art. 9 · Art. 17", why: "Risk-management and quality-management system behaviour." },
    "nist-ai-rmf": { ref: "GOVERN 1–6", why: "Whether the system follows declared governance and escalation." },
  },
  "gspc-openness": {
    "eu-ai-act": { ref: "Art. 13", why: "Transparency and provision of information to deployers." },
    "nist-ai-rmf": { ref: "MAP 2.3", why: "Disclosed reasoning, sources, and known limits." },
  },
  "gspc-continuity": {
    "eu-ai-act": { ref: "Art. 15", why: "Robustness and consistency under adversarial continuation." },
    "nist-ai-rmf": { ref: "MEASURE 2.7", why: "Resilience of behaviour under pressure." },
    owasp: { ref: "LLM04", why: "Model denial-of-service / degradation surface." },
  },
  "gspc-conformance": {
    "eu-ai-act": { ref: "Art. 16 · Art. 43", why: "Adherence to a declared conformance contract (relevant to conformity-assessment reasoning)." },
    "nist-ai-rmf": { ref: "MANAGE 1", why: "Whether declared controls are actually honoured." },
  },
  "jail-escape-detection": {
    "eu-ai-act": { ref: "Art. 15(4)", why: "Resistance to attempts to exploit system vulnerabilities." },
    "nist-ai-rmf": { ref: "MEASURE 2.7", why: "Adversarial robustness evaluation." },
    owasp: { ref: "LLM01", why: "Direct measure of jailbreak / prompt-injection resistance." },
  },
  "care-refusal-protect": {
    "eu-ai-act": { ref: "Art. 5", why: "Bears on prohibited-practice avoidance and harmful-request refusal." },
    owasp: { ref: "LLM09", why: "Overreliance / harmful-completion surface." },
  },
  "care-refusal-help": {
    "eu-ai-act": { ref: "Art. 5", why: "The false-refusal side — over-blocking legitimate requests is also a harm." },
  },
  "swarm-candidates": {
    "nist-ai-rmf": { ref: "MAP 3", why: "Emergent multi-agent behaviour and its risks." },
    owasp: { ref: "LLM08", why: "Excessive agency in multi-agent settings." },
  },
};

/**
 * regulationForAxis — the pointer set for one axis under one regime, or null.
 *
 * SWAP POINT: when the regulation-findings layer lands, read it here instead of
 * POINTERS, keyed by axis id + regime. Keep the return type. Nothing else changes.
 */
export function regulationForAxis(axisId: string, regime: Regime): RegPointer | null {
  return POINTERS[axisId]?.[regime] ?? null;
}

/** Every regime an axis carries a pointer for — used to render the axis's lens chips. */
export function regimesForAxis(axisId: string): RegPointer[] {
  const out: RegPointer[] = [];
  for (const r of REGIMES) {
    const p = regulationForAxis(axisId, r.id);
    if (p) out.push(p);
  }
  return out;
}

/** Axis ids that carry ANY pointer for the given regime — powers the regulator-lens filter. */
export function axesRelevantTo(regime: Regime, axisIds: string[]): Set<string> {
  return new Set(axisIds.filter((id) => regulationForAxis(id, regime) !== null));
}
