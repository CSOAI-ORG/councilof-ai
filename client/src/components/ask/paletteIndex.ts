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

let cached: PaletteItem[] | null = null;
export function paletteIndex(): PaletteItem[] {
  if (!cached) cached = buildIndex();
  return cached;
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
