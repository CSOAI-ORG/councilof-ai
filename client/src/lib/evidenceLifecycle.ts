/**
 * One public vocabulary for how user activity may become GSPC evidence.
 *
 * These are gates, not a workflow engine. The frontend never advances a state;
 * it only explains the independently evidenced transitions required elsewhere.
 */

export type EvidenceIntakeState = "OBSERVATION" | "REPORTED";
export type EvidenceAdmissionState =
  "CANDIDATE_FINDING" | "REPRODUCED" | "MEASURED" | "SIGNED" | "ROOT_INCLUDED";

export const EVIDENCE_INTAKES = [
  {
    id: "game",
    label: "Game or quest",
    state: "OBSERVATION" as const,
    href: "/dashboard?tab=play",
    detail:
      "A result stays local unless the user explicitly creates a candidate from a frozen instrument.",
  },
  {
    id: "report",
    label: "Incident report",
    state: "REPORTED" as const,
    href: "/dashboard?tab=watchdog",
    detail:
      "A digest-bound intake still needs triage and evidence collection before it can become a candidate finding.",
  },
] as const;

export const EVIDENCE_CANDIDATE_INTAKE = {
  method: "POST",
  endpoint: "/api/evidence-intake",
  effect: "REVIEWED_WRITE",
  state_on_accept: "CANDIDATE_FINDING",
  requires_explicit_opt_in: true,
  verifies_candidate_envelope: true,
  stores_only_when_bound: true,
  writes_board: false,
  model_training: false,
  public_release: false,
  execution_proof: false,
  worker_started: false,
  detail:
    "If accepted, the receipt records candidate intake only. It is not proof that a measurement worker ran and it does not advance the candidate to MEASURED.",
} as const;

export const EVIDENCE_ADMISSION_STAGES = [
  {
    state: "CANDIDATE_FINDING" as const,
    title: "Candidate",
    gate: "Explicit opt-in or completed triage, exact subject digest and frozen instrument. Accepted intake stays CANDIDATE_FINDING.",
    public_board: "NO" as const,
  },
  {
    state: "REPRODUCED" as const,
    title: "Reproduced",
    gate: "A separate rerun preserves item I/O, trace, seed, environment and method version.",
    public_board: "NO" as const,
  },
  {
    state: "MEASURED" as const,
    title: "Measured",
    gate: "The evidence bundle and method are reviewed under a separate admission decision.",
    public_board: "NO" as const,
  },
  {
    state: "SIGNED" as const,
    title: "Council signed",
    gate: "The Council key signs the exact admitted MEASURED body; signing never promotes a candidate.",
    public_board: "ELIGIBLE" as const,
  },
  {
    state: "ROOT_INCLUDED" as const,
    title: "GSPC published",
    gate: "The canonical publisher includes the signed card in the public Merkle root and board index.",
    public_board: "PUBLISHED" as const,
  },
] as const;

export const EVIDENCE_WITNESS_RULE = {
  state: "WITNESSED",
  separate: true,
  automatic: false,
  proves_claim: false,
  channels: ["OpenTimestamps", "Rekor", "EAS", "XRPL"],
  detail:
    "A witness can evidence that a digest existed at a time. It does not reproduce, measure, sign, or prove the underlying claim.",
} as const;

export const EVIDENCE_LIFECYCLE_STATES = [
  ...EVIDENCE_INTAKES.map((intake) => intake.state),
  ...EVIDENCE_ADMISSION_STAGES.map((stage) => stage.state),
  EVIDENCE_WITNESS_RULE.state,
] as const;
