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

/**
 * Below this width the Ask pane is a bottom sheet over the page (AskPane's own `sm` breakpoint,
 * the same query it uses to collapse while Watch runs). 12 Oct 2026: on these widths the entry
 * routes no longer open Ask by themselves; the hero shows first and a launcher opens it on tap.
 */
export const ASK_MOBILE_QUERY = "(max-width: 640px)";

/** The human entry routes (#3057): /, /tools and the Council OS home tab. */
export function isAskEntryRoute(location: string, search: string): boolean {
  const path = location.replace(/\/+$/, "") || "/";
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const home =
    path === "/dashboard" &&
    !params.has("view") &&
    (!params.get("tab") || params.get("tab") === "home");
  return path === "/" || path === "/tools" || home;
}

/** Opening Ask is always a deliberate action; hydration and navigation keep the page unobstructed. */
export function shouldAutoOpenAsk(
  _location: string,
  _search: string,
  _mobile: boolean,
): boolean {
  return false;
}

export function openAsk(question?: string): void {
  window.dispatchEvent(
    new CustomEvent<AskOpenDetail>(ASK_OPEN, { detail: { question } }),
  );
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

export const RECENTS_KEY = "coai:recents";
export const RECENTS_EVENT = "council:recents";
const MAX = 12;

function unsafePathChars(text: string, spaces = false): boolean {
  return Array.from(text).some((c) => {
    const code = c.charCodeAt(0);
    return code === 92 || code === 127 || code <= (spaces ? 32 : 31);
  });
}

function publicPath(path: string): boolean {
  try {
    let decoded = path;
    for (let i = 0; i < 3; i++) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
    return !decoded.startsWith("//") && !unsafePathChars(decoded, true);
  } catch {
    return false;
  }
}

/** Save destinations, never pasted inputs, card bodies, payment payloads or question queries. */
export function recentDestination(href: string): string | null {
  if (
    typeof href !== "string" ||
    href.length > 4096 ||
    !href.startsWith("/") ||
    href.startsWith("//") ||
    unsafePathChars(href)
  )
    return null;
  try {
    const url = new URL(href, "https://councilof.ai");
    if (url.origin !== "https://councilof.ai" || !publicPath(url.pathname))
      return null;
    let path = url.pathname;
    while (path.endsWith("/")) path = path.slice(0, -1);
    if (path !== "/dashboard") return url.pathname;
    const safe = new URLSearchParams();
    for (const key of ["tab", "tool", "axis"]) {
      const value = url.searchParams.get(key);
      if (value && /^[a-zA-Z0-9_.-]{1,120}$/.test(value)) safe.set(key, value);
    }
    const view = url.searchParams.get("view");
    if (view !== null) {
      if (
        !view.startsWith("/") ||
        view.startsWith("//") ||
        unsafePathChars(view)
      )
        return null;
      const nested = new URL(view, url.origin);
      if (nested.origin !== url.origin || !publicPath(nested.pathname))
        return null;
      safe.set("view", nested.pathname);
    }
    return "/dashboard" + (safe.size ? "?" + safe : "");
  } catch {
    return null;
  }
}

type RecentStore = { rows: Recent[]; writable: boolean };
function readStore(): RecentStore {
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    if (raw === null) return { rows: [], writable: true };
    if (raw.length > 512_000) return { rows: [], writable: false };
    const list: unknown = JSON.parse(raw);
    if (!Array.isArray(list)) return { rows: [], writable: false };
    const seen = new Set<string>();
    const rows: Recent[] = list.slice(0, 256).flatMap((r) => {
      if (
        !r ||
        typeof r !== "object" ||
        typeof r.title !== "string" ||
        typeof r.crumb !== "string" ||
        typeof r.at !== "number" ||
        !Number.isFinite(r.at)
      )
        return [];
      const href = recentDestination(r.href);
      if (!href || seen.has(href)) return [];
      seen.add(href);
      return [
        {
          href,
          title: r.title.slice(0, 160),
          crumb: r.crumb.slice(0, 160),
          at: r.at,
          pinned: r.pinned === true,
        },
      ];
    });
    return { rows, writable: true };
  } catch {
    return { rows: [], writable: false };
  }
}

export function readRecents(): Recent[] {
  return readStore().rows;
}

function write(list: Recent[]): boolean {
  try {
    const bytes = JSON.stringify(list);
    window.localStorage.setItem(RECENTS_KEY, bytes);
    if (window.localStorage.getItem(RECENTS_KEY) !== bytes) return false;
  } catch {
    return false;
  }
  window.dispatchEvent(new CustomEvent(RECENTS_EVENT));
  return true;
}

/** Record a metadata-only visit. Failed or corrupt reads never authorize replacing the store. */
export function recordRecent(r: Omit<Recent, "at" | "pinned">): boolean {
  const href = recentDestination(r.href);
  if (!href || typeof r.title !== "string" || typeof r.crumb !== "string")
    return false;
  const store = readStore();
  if (!store.writable) return false;
  const prev = store.rows.find((x) => x.href === href);
  const rest = store.rows.filter((x) => x.href !== href);
  const next: Recent[] = [
    {
      href,
      title: r.title.slice(0, 160),
      crumb: r.crumb.slice(0, 160),
      at: Date.now(),
      pinned: prev?.pinned ?? false,
    },
    ...rest,
  ];
  const pinned = next.filter((x) => x.pinned);
  const unpinned = next.filter((x) => !x.pinned).slice(0, MAX);
  return write([...pinned, ...unpinned].sort((a, b) => b.at - a.at));
}

export function togglePin(href: string): boolean {
  const safe = recentDestination(href);
  const store = readStore();
  if (!safe || !store.writable || !store.rows.some((x) => x.href === safe))
    return false;
  return write(
    store.rows.map((x) => (x.href === safe ? { ...x, pinned: !x.pinned } : x)),
  );
}

export function removeRecent(href: string): boolean {
  const safe = recentDestination(href);
  const store = readStore();
  if (!safe || !store.writable) return false;
  return write(store.rows.filter((x) => x.href !== safe));
}
