/**
 * Lobby task IDs for new honesty surfaces (NEXT_300 #341–350).
 * Canonical registry lives in lobbyLink.ts (LOBBY_TASKS).
 * DSH must use the same IDs — OS = DSH.
 */
import type { LobbyTaskId } from "@/lib/lobbyLink";

export const LOBBY_TASK_IDS = {
  indices_hub: "indices-hub",
  indices_ai_economy: "indices-ai-economy",
  indices_human_labour: "indices-human-labour",
  indices_humanoid: "indices-humanoid-labour",
  products_catalog: "products-catalog",
  powered_by: "powered-by",
  rwa_attestation_catalog: "rwa-attestation",
  gspc_verify: "gspc-verify-rwa",
  refutation_ledger: "refutation-ledger",
  corrections_ledger: "corrections-ledger",
} as const satisfies Record<string, LobbyTaskId>;
