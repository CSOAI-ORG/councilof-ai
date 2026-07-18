'use strict';
function buildSystemCard(opts) {
  // Mirrors the 6 DAIC/ATI sections. Synthetic data only.
  const now = opts.issued_at || new Date().toISOString();
  return {
    spec: 'defoneos.systemcard/v1 · DAIC/ATI template',
    classification: 'UNCLASSIFIED · SYNTHETIC DEMONSTRATION',
    senior_responsible_owner: 'SRO (synthetic)',
    issued: now.slice(0, 10),
    framework: opts.framework || "jsp936",
    overview: {
      name: "Synthetic Defence AI (DEMO) — " + opts.framework,
      supplier: "Illustrative Prime Ltd (synthetic)",
      summary: "Synthetic, signed for CLI demo. Real primes sign their own.",
      mission_risk: "high-impact, human-in-the-loop",
    },
    concept_of_use: {
      intended_use: "Cue an analyst to items of interest.",
      out_of_scope: ["No autonomous targeting", "Not a sole basis for any lethal decision"],
      human_override: "Operator in the loop. Final decision is human.",
    },
    system_detail: {
      architecture: "Modular ensemble (synthetic). Real primes replace this with their own.",
      data: "Synthetic trainer dataset. Real primes replace with theirs.",
      model: "Synthetic. Real primes replace with theirs.",
      performance: { f1: "synthetic", precision: "synthetic", recall: "synthetic" },
    },
    security: {
      adversarial_robustness: "Tested under red-team conditions.",
      supply_chain: "All dependencies SBOM-listed.",
      threat_model: "Includes insider threat and prompt-injection.",
    },
    safety: {
      care_floor: "0.95",
      bft: "12-around-1",
      incident_response: "Automated jailbreak / Demeter-veto pipeline, fallback to human review.",
    },
    iterative_requirements: {
      revision_log: [
        { rev: "1.0.0", date: now.slice(0, 10), change: "Synthetic CLI demo card issued." },
      ],
    },
  };
}

function buildModelCard(opts) {
  const now = opts.issued_at || new Date().toISOString();
  return {
    spec: 'defoneos.modelcard/v1 · NeurIPS 2025 template (10 sections)',
    classification: 'UNCLASSIFIED · SYNTHETIC DEMONSTRATION',
    senior_responsible_owner: 'SRO (synthetic)',
    issued: now.slice(0, 10),
    framework: opts.framework || "neurips2025",
    model_details: { developer: "CSOAI Synthetic", date: now.slice(0, 10), type: "ensemble (synthetic)" },
    intended_use: { purpose: "CLI demo card for sovereign signing CLI.", out_of_scope: "None beyond demo." },
    factors: { relevant: "Synthetic evaluation.", evaluation: "Synthetic." },
    metrics: { decision_metrics: ["synthetic"], reliability: "synthetic", safety: "synthetic" },
    evaluation_data: { datasets: "Synthetic demo dataset." },
    training_data: { datasets: "Synthetic demo dataset." },
    quantitative_analysis: { unit: "synthetic", population: "synthetic" },
    ethical_considerations: { notes: "Demo only — no real people, no real decisions." },
    caveats_and_recommendations: { caveats: "Synthetic — do not use for production decisions." },
    ownership_governance: { owner: "CSOAI Ltd (UK 16939677)" },
  };
}

module.exports = { buildSystemCard, buildModelCard };
