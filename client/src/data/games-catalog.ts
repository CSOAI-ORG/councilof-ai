/**
 * games-catalog.ts — the living Council OS Games catalog.
 *
 * This is the single source of truth for what play surfaces exist in the estate.
 * Each entry is a surface that EXISTS and WORKS. No invented games, no dead routes.
 *
 * HONESTY RULES:
 *   - An entry here means the route 200s and has working JS.
 *   - "play" means interactive gameplay with live board gating.
 *   - "deck" means a slide/card presentation (not interactive play).
 *   - "printer" means a live data display (not a game).
 *   - Every entry.path must be in PRIMARY_PATHS (enforced by test).
 *   - No typed board counts — games read from GET /api/gspc.
 *   - Counts: 22 axis · 15 measured · 7 empty (from GET /api/gspc).
 *
 * WHAT DOES NOT EXIST (verified 404, never catalog):
 *   - /town, /murder, /difflin, /mundrr — 404, no JS
 *   - /arena (12-room leftover) — PR 824 holds, do not duplicate
 *   - Town/XP on /os — PR 823 holds, do not duplicate
 */

export type CatalogKind = "play" | "deck" | "printer" | "harness";

export interface CatalogEntry {
  id: string;
  name: string;
  path: string;
  kind: CatalogKind;
  description: string;
  /** True if this surface consumes GET /api/gspc for live board state. */
  usesLiveBoard: boolean;
  /** Badge to show (e.g. "live", "deck"). */
  badge?: string;
}

/**
 * The living catalog. Every entry is a verified, working surface.
 * Tests enforce that each path is registered in PRIMARY_PATHS.
 */
export const GAMES_CATALOG: CatalogEntry[] = [
  {
    id: "council-space",
    name: "Council Space",
    path: "/gspc-arena",
    kind: "play",
    description:
      "The governed arena. Model versus model on frozen benchmarks. Room doors from GET /api/gspc: open only MEASURED model-comparison axes except jail. Empty stays empty. Jail is floor, never a scored door.",
    usesLiveBoard: true,
    badge: "live",
  },
  {
    id: "coliseum-deck",
    name: "The Coliseum",
    path: "/coliseum",
    kind: "deck",
    description:
      "A deck presentation of the measurement coliseum — slide-based, not interactive gameplay.",
    usesLiveBoard: false,
    badge: "deck",
  },
  {
    id: "council-city-printer",
    name: "Council City",
    path: "/os",
    kind: "printer",
    description:
      "Living printer of the public board. Axis and model counts come from GET /api/gspc. Empty cells stay empty. Measurement credential, never certification. Not a game.",
    usesLiveBoard: true,
    badge: "printer",
  },
];

/**
 * All paths in the catalog. Used by tests to verify PRIMARY_PATHS coverage.
 */
export const CATALOG_PATHS: string[] = GAMES_CATALOG.map((g) => g.path);

/**
 * Surfaces that actually consume the live board (GET /api/gspc) for state.
 */
export const LIVE_BOARD_SURFACES: CatalogEntry[] = GAMES_CATALOG.filter((g) => g.usesLiveBoard);

/**
 * Play surfaces only (excludes decks and printers).
 */
export const PLAY_SURFACES: CatalogEntry[] = GAMES_CATALOG.filter((g) => g.kind === "play");

/**
 * FORBIDDEN names — these do NOT exist and must never appear as live games.
 * Tests assert they are absent from the catalog as "play" entries.
 */
export const FORBIDDEN_GAME_NAMES = [
  "Murder",
  "Mundrr",
  "Difflin",
  "DiffLin",
  "Munder",
  "Munder-Difflin",
  "Town",
];

/**
 * Check if a game name is forbidden (does not exist as a playable game).
 */
export function isForbiddenGame(name: string): boolean {
  return FORBIDDEN_GAME_NAMES.some(
    (f) => f.toLowerCase() === name.toLowerCase()
  );
}
