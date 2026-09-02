/**
 * Board Components — ONE shared living board.
 *
 * 850 (homepage) and 854 (/os board door) import from here.
 * Do not duplicate. Do not keep a second scoreboard.
 *
 * Components:
 * - BoardAttestation: Living tables (Ed25519, SHA-256, XRPL, progress, in-lane)
 * - AttestationDeepDive: Click-through deep pages with history tab
 * - StatusChip: Separation/status badges
 * - useGspcBoard: Hook for fetching /api/gspc
 * - LiveLeaderboard: Arena Elo leaderboard
 * - HumanVsAiPanel: Human vs AI comparison
 */

export { default as BoardAttestation } from "./BoardAttestation";
export { default as AttestationDeepDive } from "./AttestationDeepDive";
export type { DeepDiveKind } from "./AttestationDeepDive";

export { default as StatusChip, chipFor, figureChip } from "./StatusChip";
export type { BoardChipKind } from "./StatusChip";

export { useGspcBoard } from "./useGspcBoard";
export type { GspcPayload, GspcAxis, GspcTotals } from "./useGspcBoard";

export { default as LiveLeaderboard } from "./LiveLeaderboard";
export { default as HumanVsAiPanel } from "./HumanVsAiPanel";
