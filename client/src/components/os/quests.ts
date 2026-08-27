/**
 * quests — the Council OS local-play save, lifted out of GameBar.
 *
 * WHY IT IS ITS OWN MODULE. The three quests each name an ACTION ("ask the Council
 * one grounded question", "verify a card"), and GameBar used to award them for
 * CLICKING THE LINK. That is the defect this estate exists to eliminate, in
 * miniature: a label promising a thing the code never checks happened. The quests
 * are now marked by the surfaces that actually perform the action — the lobby chat
 * when a grounded answer lands, the verify pane when a record verifies — so this
 * primitive has to live somewhere both a page component and a lobby hook can import
 * without pulling a React component in behind it.
 *
 * LOCAL PLAY, AND IT SAYS SO. XP lives in this browser's localStorage and nowhere
 * else. There is no global leaderboard, no server-side score, and none is implied.
 * Storage is wrapped: a private window or a browser with site data blocked simply
 * starts at zero rather than throwing.
 */

export type QuestId = "ask" | "arena" | "verify";

export type Save = { xp: number; quests: QuestId[] };

export const QUEST_KEY = "council-os-game-v1";

/** The quest that fires this event id, and what it is worth. */
export const QUESTS: { id: QuestId; label: string; done: string; xp: number }[] = [
  {
    id: "ask",
    label: "Ask the Council one grounded question",
    done: "the Council answered from published measurement",
    xp: 20,
  },
  {
    id: "arena",
    label: "Open Council Space",
    done: "you opened the governed arena",
    xp: 15,
  },
  {
    id: "verify",
    label: "Verify a published card with no login",
    done: "a card recomputed and its signature checked out",
    xp: 15,
  },
];

/** The ladder tops out at exactly the sum of the quests — never an unreachable number. */
export const XP_MAX = QUESTS.reduce((n, q) => n + q.xp, 0);

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(QUEST_KEY);
    if (!raw) return { xp: 0, quests: [] };
    const j = JSON.parse(raw);
    const quests: QuestId[] = Array.isArray(j?.quests)
      ? j.quests.filter((q: unknown): q is QuestId => QUESTS.some((x) => x.id === q))
      : [];
    // XP is DERIVED from the quests held, never trusted from storage: an old save
    // written by the previous bar could carry an xp that no longer matches the set.
    return { xp: quests.reduce((n, id) => n + (QUESTS.find((q) => q.id === id)?.xp ?? 0), 0), quests };
  } catch {
    return { xp: 0, quests: [] };
  }
}

/**
 * Record that a quest's action actually happened. Idempotent, and it notifies any
 * mounted GameBar in this tab (`council-os-game`) as well as other tabs (`storage`).
 */
export function markQuest(id: QuestId): Save {
  const s = loadSave();
  if (!QUESTS.some((q) => q.id === id) || s.quests.includes(id)) return s;
  const next: Save = { xp: 0, quests: [...s.quests, id] };
  next.xp = next.quests.reduce((n, q) => n + (QUESTS.find((x) => x.id === q)?.xp ?? 0), 0);
  try {
    localStorage.setItem(QUEST_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked — the event still fires, the bar just will not persist */
  }
  try {
    window.dispatchEvent(new Event("council-os-game"));
  } catch {
    /* no window (SSR/prerender) — nothing to notify */
  }
  return next;
}

/** Where the reader stands. The top rung is XP_MAX, so it is actually reachable. */
export function mode(xp: number): { name: string; next: number | null; hint: string } {
  if (xp >= XP_MAX)
    return { name: "RED", next: null, hint: "All three done. Nothing here is a score anyone else can see." };
  if (xp >= 20) return { name: "MAYOR", next: XP_MAX, hint: "Open the arena and verify a card." };
  return { name: "CITIZEN", next: 20, hint: "Ask the Council to start." };
}
