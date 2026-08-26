/**
 * Lobby task IDs for new honesty surfaces (NEXT_300 #341–350).
 * DSH must use the same IDs — OS = DSH.
 */
export const LOBBY_TASK_IDS = {
  indices_hub: "task.indices.hub",
  indices_ai_economy: "task.indices.ai-economy",
  indices_human_labour: "task.indices.human-labour",
  indices_humanoid: "task.indices.humanoid-labour",
  products_catalog: "task.products.catalog",
  powered_by: "task.powered-by.option-a",
  rwa_attestation_catalog: "task.rwa.attestation-catalog",
  gspc_verify: "task.gspc.verify",
  refutation_ledger: "task.refutation.ledger",
  corrections_ledger: "task.corrections.ledger",
} as const;
