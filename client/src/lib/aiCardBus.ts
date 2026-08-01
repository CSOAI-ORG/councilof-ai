/**
 * aiCardBus — every call to our AI becomes a visible card inside Sov Space.
 *
 * C-space card: emitted the moment an AI call resolves — deliberation made
 * visible (who asked, what kind, how long, which model, which GSPC axis).
 * J-space card: a C card PROMOTED when its outcome is signed/ledgered
 * (evidence = ledger event id, sha256, or signed fixture tag).
 *
 * Cards persist (localStorage, last 50) so the stream survives navigation;
 * Sov Space subscribes and renders them on the log-scale timeline.
 */

export type AiCard = {
  id: string;
  kind: "dock-ask" | "council-verdict" | "kb-lookup" | "govern-lookup" | "arena-run";
  space: "C" | "J";
  ts: number;
  summary: string;
  detail?: string;
  latencyMs?: number;
  model?: string;
  axis?: "governance" | "safety" | "provenance" | "continuity" | "care";
  evidence?: string;
  source: "live" | "local-sim";
};

const KEY = "aiCardBus.v1";
const MAX = 50;
const subs = new Set<(cards: AiCard[]) => void>();

let cards: AiCard[] = (() => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p.slice(0, MAX);
    }
  } catch {}
  return [];
})();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(cards.slice(0, MAX))); } catch {}
}

function notify() {
  for (const fn of subs) fn(cards);
}

let seq = 0;
export function emitCard(c: Omit<AiCard, "id" | "ts" | "space"> & { space?: "C" | "J" }): AiCard {
  const card: AiCard = {
    id: "ac-" + Date.now().toString(36) + "-" + (seq++).toString(36),
    ts: Date.now(),
    space: c.space ?? "C",
    ...c,
  };
  cards = [card, ...cards].slice(0, MAX);
  save();
  notify();
  return card;
}

/** C → J promotion: the outcome got signed. Evidence is the ledger id / sha256 / fixture tag. */
export function promoteCard(id: string, evidence: string): void {
  const i = cards.findIndex((c) => c.id === id);
  if (i < 0) return;
  cards = cards.map((c) => (c.id === id ? { ...c, space: "J" as const, evidence } : c));
  save();
  notify();
}

export function getCards(): AiCard[] {
  return cards;
}

export function subscribeCards(fn: (cards: AiCard[]) => void): () => void {
  subs.add(fn);
  return () => subs.delete(fn);
}
