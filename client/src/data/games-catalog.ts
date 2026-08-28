/**
 * games-catalog.ts — the living Council OS Games catalog.
 *
 * This file extends the play gallery in components/lobby/play.ts with board-level
 * metadata (door mechanic, live board consumption). It does NOT create a parallel
 * catalog — the authoritative play gallery is play.ts/LobbyPlay.tsx.
 *
 * HONESTY RULES:
 *   - "play" means interactive gameplay with live board gating.
 *   - "deck" means a slide/card presentation (not interactive play).
 *   - "printer" means a live data display (not a game).
 *   - "leftover" means frozen/broken surface catalogued for honesty.
 *   - Every path must be in PRIMARY_PATHS (enforced by test).
 *   - No typed board counts — live surfaces read from GET /api/gspc.
 *   - Counts: 22 axis · 15 measured · 7 empty (from GET /api/gspc).
 *
 * WHAT DOES NOT EXIST (verified, never catalog as working):
 *   - /town 404; /towns 308 → /gspc-arena?view=towns
 *   - /city 308 → /gspc-arena?view=towns (leftover hop)
 *   - /murder, /difflin, /mundrr — 404, no JS
 *   - /arena (12-room leftover) — PR 824 holds
 *   - Town/XP on /os — PR 823 holds
 *
 * FROZEN LEFTOVERS (playable but not the living board):
 *   - /gspc-quests.html: six frozen quests, v1 governance (24-item), NOT living n=237.
 *     In-browser grader with XP. Do not present as living 22-axis board.
 *
 * IN-BUILD (no routes, from play.ts):
 *   - Logic Duel, Swarm Clash, Humans vs Humanoids — no live routes, do not mint URLs.
 *
 * LOCAL-ONLY (not on councilof.ai):
 *   - Munder-Difflin harness: /Users/nicholas/munder-difflin-harness, :4100 health only.
 */

export type CatalogKind = "play" | "deck" | "printer" | "leftover";

export interface CatalogEntry {
  id: string;
  name: string;
  path: string;
  kind: CatalogKind;
  description: string;
  /** True if this surface consumes GET /api/gspc for live board state. */
  usesLiveBoard: boolean;
  /** External URL if the surface lives outside councilof.ai. */
  externalUrl?: string;
  /** Badge to show (e.g. "live", "deck", "frozen"). */
  badge?: string;
  /** True if the surface is known broken. */
  broken?: boolean;
  /** True if the surface is frozen (playable but not live board). */
  frozen?: boolean;
}

/**
 * The board-level catalog. Extends play.ts with live-board metadata.
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
    id: "gspc-quests",
    name: "GSPC Quests",
    path: "/gspc-quests.html",
    kind: "leftover",
    description:
      "Six frozen axis-scoped quests with in-browser grader. Governance quest is retired v1 (24-item), NOT the living n=237. Your answers are graded by the same deterministic regex used to measure models. Playable but frozen — NOT the living 22-axis board.",
    usesLiveBoard: false,
    badge: "frozen",
    frozen: true,
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
  {
    id: "council-town-external",
    name: "Council Town",
    path: "/os",
    kind: "leftover",
    description:
      "External game at council-town.pages.dev linked from /os. First load broken: /ai-town/assets/ serves HTML instead of JS. Catalogued as leftover, not as working play surface.",
    usesLiveBoard: false,
    externalUrl: "https://council-town.pages.dev",
    badge: "broken",
    broken: true,
  },
];

/**
 * All paths in the catalog (deduplicated). Used by tests to verify PRIMARY_PATHS coverage.
 */
export const CATALOG_PATHS: string[] = [...new Set(GAMES_CATALOG.map((g) => g.path))];

/**
 * Surfaces that actually consume the live board (GET /api/gspc) for state.
 */
export const LIVE_BOARD_SURFACES: CatalogEntry[] = GAMES_CATALOG.filter((g) => g.usesLiveBoard);

/**
 * Play surfaces only (excludes decks, printers, and leftovers).
 * NOTE: Only Council Space is live play. GSPC Quests is frozen leftover.
 */
export const PLAY_SURFACES: CatalogEntry[] = GAMES_CATALOG.filter((g) => g.kind === "play");

/**
 * Working surfaces (excludes broken leftovers).
 */
export const WORKING_SURFACES: CatalogEntry[] = GAMES_CATALOG.filter((g) => !g.broken);

/**
 * Broken/leftover surfaces catalogued for honesty.
 */
export const LEFTOVER_SURFACES: CatalogEntry[] = GAMES_CATALOG.filter(
  (g) => g.kind === "leftover"
);

/**
 * Frozen surfaces — playable but not the living board.
 */
export const FROZEN_SURFACES: CatalogEntry[] = GAMES_CATALOG.filter((g) => g.frozen);

/**
 * IN-BUILD cards from play.ts (no routes, do not mint URLs).
 * Listed for reference only — the authoritative list is in play.ts.
 */
export const IN_BUILD_CARDS = [
  { id: "logic-duel", name: "Logic Duel", note: "In build — no live match route" },
  { id: "swarm-clash", name: "Swarm Clash", note: "In build — arena wrapper is local preview only" },
  { id: "humans-vs-humanoids", name: "Humans vs Humanoids", note: "No playable route" },
];

/**
 * LOCAL-ONLY HARNESSES (not on councilof.ai, no public route).
 * Catalogued for reference; these are NOT play surfaces.
 */
export const LOCAL_ONLY_HARNESSES = [
  {
    name: "Munder-Difflin",
    localPath: "/Users/nicholas/munder-difflin-harness",
    files: ["site/games.html", "site/governance-city.html", "visuals/arena-game.html"],
    healthEndpoint: ":4100",
    note: "Local harness only. No public route on councilof.ai.",
  },
];

/**
 * FORBIDDEN names — these do NOT exist as public play surfaces on councilof.ai.
 * Tests assert they are absent from the catalog as "play" entries.
 */
export const FORBIDDEN_GAME_NAMES = [
  "Murder",
  "Mundrr",
  "Difflin",
  "DiffLin",
];

/**
 * Check if a game name is forbidden (does not exist as a playable game).
 */
export function isForbiddenGame(name: string): boolean {
  return FORBIDDEN_GAME_NAMES.some(
    (f) => f.toLowerCase() === name.toLowerCase()
  );
}
