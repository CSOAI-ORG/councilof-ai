/**
 * askBus — the few window events and the per-viewer recents list shared by the Ask GSPC launcher,
 * the command palette and the pane. Deliberately tiny: it is in the main bundle (the header uses
 * it); the pane and the palette are separate chunks loaded on first use.
 *
 * Recents and pins live in this browser only (localStorage), a convenience, never shared state
 * and never sent anywhere. Every read and write is wrapped: blocked storage leaves an empty list.
 */

export const ASK_OPEN = "council:ask-open";
export const PALETTE_OPEN = "council:palette-open";

export type AskOpenDetail = { question?: string };

export function openAsk(question?: string): void {
  window.dispatchEvent(new CustomEvent<AskOpenDetail>(ASK_OPEN, { detail: { question } }));
}

export function openPalette(): void {
  window.dispatchEvent(new CustomEvent(PALETTE_OPEN));
}

export type Recent = {
  href: string;
  title: string;
  /** Where it lives: "Council OS › Measure › Live board", "Measure › How it works". */
  crumb: string;
  at: number;
  pinned?: boolean;
};

const KEY = "coai:recents";
const MAX = 12;

export function readRecents(): Recent[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as Recent[]) : [];
    return Array.isArray(list) ? list.filter((r) => r && typeof r.href === "string" && r.href.startsWith("/")) : [];
  } catch {
    return [];
  }
}

function write(list: Recent[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage blocked: recents stay empty */
  }
  window.dispatchEvent(new CustomEvent("council:recents"));
}

/** Record a visit. Pinned rows are kept; unpinned rows roll off after MAX. */
export function recordRecent(r: Omit<Recent, "at" | "pinned">): void {
  if (!r.href.startsWith("/")) return;
  const list = readRecents();
  const prev = list.find((x) => x.href === r.href);
  const rest = list.filter((x) => x.href !== r.href);
  const next = [{ ...r, at: Date.now(), pinned: prev?.pinned ?? false }, ...rest];
  const pinned = next.filter((x) => x.pinned);
  const unpinned = next.filter((x) => !x.pinned).slice(0, MAX);
  write([...pinned, ...unpinned].sort((a, b) => b.at - a.at));
}

export function togglePin(href: string): void {
  write(readRecents().map((x) => (x.href === href ? { ...x, pinned: !x.pinned } : x)));
}

export function removeRecent(href: string): void {
  write(readRecents().filter((x) => x.href !== href));
}
