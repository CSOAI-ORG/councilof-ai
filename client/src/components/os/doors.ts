import LobbyBoardPane from "@/components/lobby/LobbyBoardPane";

/**
 * Council OS doors — six arms only:
 * board · verify · cards · space · assess · harness.
 * Cards stays a URL mapping; header rail shows five tabs (cards via deep-link).
 * AG-UI / City host presents GspcStreamCard inside streams — not a seventh arm.
 */
export type DoorId = "board" | "verify" | "cards" | "harness" | "space" | "assess";

export const DOORS: { id: DoorId; label: string }[] = [
  { id: "board", label: "Board" },
  { id: "verify", label: "Verify" },
  { id: "space", label: "Space" },
  { id: "assess", label: "Assess" },
  { id: "harness", label: "Harness" },
];

export const LOBBY_TO_DOOR: Record<string, DoorId> = {
  home: "board",
  board: "board",
  verify: "verify",
  cards: "cards",
  space: "space",
  measured: "assess",
  ras: "assess",
  assess: "assess",
  harness: "harness",
};

export const DOOR_TO_LOBBY: Record<DoorId, string> = {
  board: "board",
  verify: "verify",
  cards: "cards",
  space: "space",
  assess: "measured",
  harness: "harness",
};

const TASK_TO_DOOR: Record<string, DoorId> = {
  "read-the-board": "board",
  "pricing-overview": "assess",
  "enterprise-start": "assess",
  "get-measured": "assess",
};

export function doorFromSearch(search: string): DoorId | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const lobby = params.get("lobby");
  if (!lobby || lobby === "home") {
    const task = params.get("task");
    if (task && TASK_TO_DOOR[task]) return TASK_TO_DOOR[task];
    return null;
  }
  if (LOBBY_TO_DOOR[lobby]) return LOBBY_TO_DOOR[lobby];
  const task = params.get("task");
  if (task && TASK_TO_DOOR[task]) return TASK_TO_DOOR[task];
  return null;
}

/** /os?lobby=software is a hop off the host onto DSH — never an iframe of /dashboard. */
export function osLeaveForSearch(search: string): string | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (params.get("lobby") === "software") return "/dashboard";
  return null;
}

/** What /os?lobby=board mounts. Tests pin this identity; do not iframe a scoreboard. */
export const BOARD_PANE = LobbyBoardPane;
