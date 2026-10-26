/**
 * The command palette's index: every destination the site's own navigation already promotes, each
 * with a location breadcrumb (the Cloudflare ⌘K pattern: a hit says where it lives). Built from
 * the header menus (components/HeaderNav.tsx), the Council OS sections (components/lobby/tabs.ts)
 * and the workspace support links, so the palette cannot promote a page the navigation does not.
 */
import { navigation, PRIMARY_LINKS } from "@/components/HeaderNav";
import { DASHBOARD_NAV_GROUPS } from "@/components/lobby/tabs";
import { SUPPORT_LINKS } from "@/components/gspc/workspaceMenu";

export type PaletteItem = {
  id: string;
  title: string;
  href: string;
  crumb: string;
  description: string;
  external?: boolean;
};

const bare = (href: string) => href.split("#")[0];

export function buildIndex(): PaletteItem[] {
  const out: PaletteItem[] = [];
  const seen = new Set<string>();
  const push = (it: PaletteItem) => {
    const k = bare(it.href);
    if (seen.has(k)) return;
    seen.add(k);
    out.push(it);
  };
  for (const g of DASHBOARD_NAV_GROUPS) {
    for (const t of g.tabs) {
      push({
        id: `os:${t.id}`,
        title: t.label,
        href: `/dashboard/?tab=${t.id}`,
        crumb: `Council OS › ${g.label}`,
        description: t.blurb ?? g.description,
      });
    }
  }
  for (const g of navigation) {
    let section = "";
    for (const item of g.submenu) {
      if (item.section) section = item.section;
      push({
        id: `nav:${item.href}`,
        title: item.name,
        href: item.href,
        crumb: section ? `${g.name} › ${section}` : g.name,
        description: item.description,
        external: item.external,
      });
    }
  }
  for (const l of PRIMARY_LINKS) push({ id: `top:${l.href}`, title: l.name, href: l.href, crumb: "Top bar", description: "" });
  for (const l of SUPPORT_LINKS)
    push({ id: `sup:${l.href}`, title: l.label, href: l.href, crumb: "Support and resources", description: "", external: l.external });
  return out;
}

// ── the board's tests, by name ───────────────────────────────────────────────

/** Fired on window when the board's test names have been read into the index. */
export const PALETTE_INDEX_EVENT = "council:palette-index";
const BOARD_SOURCE = "/api/gspc";

const WORD_CASE: Record<string, string> = { ai: "AI", xr: "XR", mcp: "MCP" };

/** "art5-safeguard" -> "Art5 safeguard", "ai-adoption-components" -> "AI adoption components". */
export function axisTitle(axis: string): string {
  const words = axis.split(/[-_\s]+/).filter(Boolean).map((w) => WORD_CASE[w.toLowerCase()] ?? w.toLowerCase());
  if (!words.length) return axis;
  const first = words[0];
  words[0] = WORD_CASE[first.toLowerCase()] ? first : first.charAt(0).toUpperCase() + first.slice(1);
  return words.join(" ");
}

/**
 * One palette entry per test on the board, read from the same GET /api/gspc payload the board
 * uses (tools audit, 6 Oct 2026: typing "safety" found nothing). Names and the board's own one-line
 * task only: no number is carried into the palette.
 */
export function boardAxisItems(payload: unknown): PaletteItem[] {
  const axes = payload && typeof payload === "object" ? (payload as { axes?: unknown }).axes : null;
  if (!Array.isArray(axes)) return [];
  const out: PaletteItem[] = [];
  const seen = new Set<string>();
  for (const row of axes) {
    const axis = row && typeof row === "object" ? (row as { axis?: unknown }).axis : null;
    if (typeof axis !== "string" || !axis.trim() || seen.has(axis)) continue;
    seen.add(axis);
    const task = (row as { task?: unknown }).task;
    out.push({
      id: `axis:${axis}`,
      title: `${axisTitle(axis)} — test on the board`,
      href: "/dashboard/?tab=board",
      crumb: "Council OS › Leaderboard",
      description: `${typeof task === "string" && task.trim() ? `${task.trim()}. ` : ""}${axis}`,
    });
  }
  return out;
}

let axisItems: PaletteItem[] = [];
let axisLoad: Promise<PaletteItem[]> | null = null;
let axisTriedAt = 0;
const AXIS_RETRY_MS = 30_000;

/** Read the board's test names once per page. A failed read adds nothing and may be retried
 *  (at most every 30 s, so a down board is not re-fetched on every keystroke). */
export function loadBoardAxes(fetchImpl: typeof fetch = fetch): Promise<PaletteItem[]> {
  if (axisLoad) return axisLoad;
  axisTriedAt = Date.now();
  axisLoad = fetchImpl(BOARD_SOURCE, { headers: { accept: "application/json" } })
    .then((r) => (r.ok ? r.json() : null))
    .then((payload) => {
      axisItems = boardAxisItems(payload);
      if (!axisItems.length) axisLoad = null;
      try {
        window.dispatchEvent(new Event(PALETTE_INDEX_EVENT));
      } catch {
        /* no window (tests) */
      }
      return axisItems;
    })
    .catch(() => {
      axisLoad = null;
      return [];
    });
  return axisLoad;
}

let cached: PaletteItem[] | null = null;
/** Navigation destinations, then the board's tests once they have been read. */
export function paletteIndex(): PaletteItem[] {
  if (!cached) cached = buildIndex();
  if (typeof window !== "undefined" && !axisLoad && !axisItems.length && Date.now() - axisTriedAt > AXIS_RETRY_MS)
    void loadBoardAxes();
  return axisItems.length ? [...cached, ...axisItems] : cached;
}

/** Test seam. */
export function resetPaletteIndexForTest(): void {
  cached = null;
  axisItems = [];
  axisLoad = null;
  axisTriedAt = 0;
}

/** Plain substring + word-start scoring. Deterministic; no fuzzy guessing past the words typed. */
export function search(q: string, items: PaletteItem[] = paletteIndex(), limit = 8): PaletteItem[] {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const scored: [number, PaletteItem][] = [];
  for (const it of items) {
    const title = it.title.toLowerCase();
    const hay = `${title} ${it.crumb.toLowerCase()} ${it.description.toLowerCase()} ${it.href.toLowerCase()}`;
    if (!words.every((w) => hay.includes(w))) continue;
    let s = 0;
    for (const w of words) {
      if (title.startsWith(w)) s += 6;
      else if (new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(title)) s += 4;
      else if (title.includes(w)) s += 2;
      else s += 1;
    }
    scored.push([s, it]);
  }
  return scored.sort((a, b) => b[0] - a[0] || a[1].title.localeCompare(b[1].title)).slice(0, limit).map(([, it]) => it);
}

/** The breadcrumb for a path the reader is on, for the recents list. */
export function crumbFor(pathWithQuery: string): { title: string; crumb: string } | null {
  const u = pathWithQuery.replace(/\/\?/, "?");
  for (const it of paletteIndex()) {
    const h = bare(it.href).replace(/\/\?/, "?").replace(/\/$/, "");
    if (h && (u.replace(/\/$/, "") === h || u === h + "/")) return { title: it.title, crumb: it.crumb };
  }
  return null;
}
