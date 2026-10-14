/**
 * seoHead — the ONE synchronous producer of a route's <title>, meta description, canonical
 * and Open Graph tags.
 *
 * WHY (measured 2026-09-16 on a clean prerender): 68 routes shipped the bare shell title,
 * 141 shared "Evidence review in progress", 14 shipped the literal string "undefined" and 14
 * had no meta description. Three causes, one shape: the title was set by whichever page
 * component got round to it. react-helmet-async fires after the lazy chunk resolves and after
 * its own async batch; ROUTE_TITLES in App.tsx covered 123 of 434 routes; pages that read
 * `data.title` before the fetch resolved wrote undefined; and nothing at all wrote a
 * description for 364 routes, so they all carried the shell's. A snapshot taken at 900ms
 * captured whichever of those had happened to run.
 *
 * WHAT THIS DOES. `resolveHead(path)` returns a correct head for ANY path from data that is
 * already in the bundle — the hand-written map (client/src/data/seo-head.json), the route
 * manifest, the publication manifest and the path itself — so RouteHead in App.tsx can apply
 * it in a layout effect on every navigation, BEFORE any page mounts or any fetch resolves.
 * Mapped static routes retain this reviewed head after lazy components mount. Parametrised
 * pages can still refine their own headline once their record loads.
 *
 * Doctrine: no typed count anywhere in here. A title or description that wants a number
 * renders it in the page body from the artifact that owns it.
 */
import head from "../data/seo-head.json";
import { ROUTE_MANIFEST } from "../data/route-manifest";
import { prettifyTitle, SECTORS } from "../data/library-ia";
import { isWithdrawnPath } from "./publicationState";

export interface HeadEntry {
  title: string;
  description: string;
  note?: string;
}

export interface ResolvedHead {
  path: string;
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  /** Which layer produced it — for tests and the guard's duplicate table, never for display. */
  source: "route" | "withdrawn" | "family" | "component" | "derived";
}

export const SITE_NAME: string = head.site.name;
export const SITE_ORIGIN: string = head.site.origin;
export const SHELL_TITLE: string = head.site.shellTitle;
export const SHELL_DESCRIPTION: string = head.site.shellDescription;
export const ROUTE_HEAD: Record<string, HeadEntry> = head.routes as Record<string, HeadEntry>;
export const COMPONENT_HEAD: Record<string, HeadEntry> = head.components as Record<string, HeadEntry>;

export const DESCRIPTION_MIN = 110;
export const DESCRIPTION_MAX = 160;
export const TITLE_MAX = 60;

/** Strip query/hash and a trailing slash; "" → "/". */
export function normalizePath(path: string): string {
  const bare = String(path || "/").split(/[?#]/)[0];
  const trimmed = bare.length > 1 ? bare.replace(/\/+$/, "") : bare;
  return trimmed || "/";
}

/** "eu-ai-act-article-50" → "EU AI Act Article 50" (acronyms via the Library's own table). */
export function slugTitle(slug: string): string {
  const words = slug.split(/[-_/]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1));
  return prettifyTitle(words.join(" "));
}

/** The URL the edge serves a route at: "<origin>/<route>/" for prerendered dirs, origin for "/". */
export function canonicalFor(path: string): string {
  const p = normalizePath(path);
  return p === "/" ? SITE_ORIGIN : `${SITE_ORIGIN}${p}/`;
}

/** Cut at a word boundary so a clamped string never ends mid-word. */
function cutAtWord(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const at = cut.lastIndexOf(" ");
  return (at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[,;:\s]+$/, "");
}

// A clamp that ends "…behind them, and the." reads as broken copy in a search result (found live
// 2026-09-28 on all six /for/* pages). After cutting at a word boundary, drop trailing words
// that cannot end a clause.
const DANGLING = new Set(["a", "an", "the", "and", "or", "of", "to", "for", "with", "in", "on", "by", "at", "from", "its", "their", "what", "which", "that", "is", "are", "as", "but", "nor"]);
function trimDangling(s: string): string {
  const words = s.replace(/[,;:\s]+$/, "").split(" ");
  while (words.length > 1 && DANGLING.has(words[words.length - 1].toLowerCase())) words.pop();
  return words.join(" ").replace(/[,;:\s—–-]+$/, "");
}

/**
 * Build a description that lands inside [DESCRIPTION_MIN, DESCRIPTION_MAX] from a specific
 * lead sentence plus the site's standing line. The lead is never invented — it is the name of
 * the thing plus what this layer knows about it; the tail is doctrine, not a claim about the page.
 */
export function fitDescription(lead: string): string {
  const tails = [
    " Council of AI is an independent AI-measurement body: we measure and sign evidence; verification is free. Measurement, not certification.",
    " Council of AI measures and signs evidence; verification is free. Measurement, not certification.",
    " Measurement, not certification; verification is free.",
    " Measurement, not certification.",
    "",
  ];
  const base = lead.trim().replace(/\s+/g, " ");
  for (const tail of tails) {
    const candidate = base + tail;
    if (candidate.length >= DESCRIPTION_MIN && candidate.length <= DESCRIPTION_MAX) return candidate;
  }
  // The lead alone is too long: clamp it at a word boundary and keep the shortest doctrine tail.
  const clamped = trimDangling(cutAtWord(base, DESCRIPTION_MAX - " Measurement, not certification.".length - 1));
  const withTail = clamped.replace(/[.]+$/, "") + ". Measurement, not certification.";
  return withTail.length >= DESCRIPTION_MIN ? withTail : cutAtWord(base, DESCRIPTION_MAX);
}

function fitTitle(name: string): string {
  const suffix = ` | ${SITE_NAME}`;
  const room = TITLE_MAX - suffix.length;
  return (name.length <= room ? name : cutAtWord(name, room)) + suffix;
}

interface Family {
  /** wouter-style pattern with one or more :params */
  pattern: string;
  name: (param: string) => string;
  lead: (name: string, param: string) => string;
}

// Param routes whose page sets its own head from static data once mounted. These fallbacks
// name the thing from the URL so the snapshot is right even if the chunk is slow, and never
// claim anything the page would not.
const FAMILIES: Family[] = [
  {
    pattern: "/notes/:slug",
    name: (p) => `Evidence note: ${slugTitle(p)}`,
    lead: (n) => `${n}. A dated evidence note from the Council of AI measurement programme: what was observed, the signed artifacts it rests on, and what remains unmeasured.`,
  },
  {
    pattern: "/answers/:slug",
    name: (p) => `Answer: ${slugTitle(p)}`,
    lead: (n) => `${n}. A short explainer answering one measurement or regulation question, with its references listed, written so it can be quoted without losing its limits.`,
  },
  {
    pattern: "/gspc/:axis",
    name: (p) => `GSPC axis: ${slugTitle(p)}`,
    lead: (n) => `${n}. One axis of the live GSPC board: what it measures, the measured cells with n and interval, and the unmeasured cells reported as such. Read from the board endpoint.`,
  },
  {
    pattern: "/for/:persona",
    name: (p) => `Council of AI for ${slugTitle(p).toLowerCase()} readers`,
    lead: (n) => `${n}: the measurements that matter to this role, the signed evidence behind them and their honest limits.`,
  },
  {
    pattern: "/vs/:slug",
    name: (p) => `Council of AI vs ${slugTitle(p)}`,
    lead: (n) => `${n}, compared on what each publishes about itself: independent measurement, signed evidence and free verification. Cited, not asserted.`,
  },
  {
    pattern: "/model/:id",
    name: (p) => `Model findings: ${slugTitle(p)}`,
    lead: (n) => `${n}. Every signed finding for this measured model: the axis, the run, the regulator it maps to, and the card behind each row. Read from the findings index.`,
  },
  {
    pattern: "/mcp/:slug",
    name: (p) => `MCP server: ${slugTitle(p)}`,
    lead: (n) => `${n}, one entry in the Council of AI MCP registry: what it does, the frameworks it maps to, its language and source. A listing, not a reachability test.`,
  },
  {
    pattern: "/library/:sector",
    name: (p) => SECTORS.find((s) => s.id === p)?.title ?? `Library: ${slugTitle(p)}`,
    lead: (n) => `${n} — one sector of the Council of AI Library, the reference archive of every page published, kept, dated and organised for citation.`,
  },
  {
    pattern: "/hive/:slug",
    name: (p) => `${slugTitle(p)} in the Framework Hive`,
    lead: (n) => `${n}: authority, status, effective dates, obligations, penalties and crosswalks for this framework, each line linked to its published source.`,
  },
  {
    pattern: "/courses/:id",
    name: (p) => `Course: ${slugTitle(p)}`,
    lead: (n) => `${n}, a Council Academy course on the measurement board, signed evidence and the regulation it maps to. Completion attests training, not conformity.`,
  },
  {
    pattern: "/scorecard/:systemId",
    name: (p) => `Scorecard: ${slugTitle(p)}`,
    lead: (n) => `${n}. The frameworks in scope for this registered AI system, the evidence recorded against each requirement, and the gaps. A working view, not a certificate.`,
  },
];

function matchFamily(path: string): { family: Family; param: string } | null {
  const segs = path.split("/");
  for (const family of FAMILIES) {
    const pat = family.pattern.split("/");
    if (pat.length !== segs.length) continue;
    let param = "";
    let ok = true;
    for (let i = 0; i < pat.length; i++) {
      if (pat[i].startsWith(":")) { if (!segs[i]) { ok = false; break; } param = segs[i]; }
      else if (pat[i] !== segs[i]) { ok = false; break; }
    }
    if (ok) return { family, param };
  }
  return null;
}

const WITHDRAWN_FAMILY_LABEL: Record<string, string> = {
  blog: "Blog post",
  industries: "Industry page",
  frameworks: "Framework guide",
  sectors: "Sector page",
  regulator: "Regulator page",
  courses: "Course",
  verify: "Completion record",
  "verify-certificate": "Completion record",
  "free-course": "Course",
  charter: "Charter article",
};

/** A human name for a withdrawn path when no better one is supplied. */
export function withdrawnName(path: string): string {
  const p = normalizePath(path);
  const segs = p.split("/").filter(Boolean);
  const label = segs.length > 1 ? WITHDRAWN_FAMILY_LABEL[segs[0]] : undefined;
  const last = segs[segs.length - 1] || "page";
  return label ? `${label}: ${slugTitle(last)}` : slugTitle(segs.join(" "));
}

function withdrawnHead(path: string, name: string): { title: string; description: string } {
  // "— withdrawn" must survive even for a long headline: these pages are noindex, so the
  // 60-char tab budget matters less than a reader (or a crawler) seeing the status.
  const title = `${cutAtWord(name, 70)} — withdrawn | ${SITE_NAME}`;
  const lead = `${name} is withdrawn from the public decision path while each claim is checked for source, scope, date and evidence state.`;
  const description = fitDescription(lead + " The measured board and free verification stay open.");
  return { title, description };
}

function manifestEntry(path: string) {
  return ROUTE_MANIFEST.find((r) => r.path === path) ?? null;
}

/**
 * Resolve the head for a path. `opts.name` lets a page that knows the real name of a withdrawn
 * or parametrised thing (a blog post's own headline) refine the fallback without re-deriving it.
 */
export function resolveHead(path: string, opts: { name?: string } = {}): ResolvedHead {
  const p = normalizePath(path);
  const finish = (title: string, description: string, source: ResolvedHead["source"]): ResolvedHead => ({
    path: p,
    title,
    description,
    canonical: canonicalFor(p),
    ogTitle: title,
    ogDescription: description,
    source,
  });

  // A withdrawn route says so even when the map has an entry for it: the map describes the page
  // that was promised, the publication manifest says what is actually served.
  if (isWithdrawnPath(p)) {
    const w = withdrawnHead(p, opts.name ?? withdrawnName(p));
    return finish(w.title, w.description, "withdrawn");
  }

  const exact = ROUTE_HEAD[p];
  if (exact) return finish(exact.title, exact.description, "route");

  const fam = matchFamily(p);
  if (fam) {
    const name = opts.name ?? fam.family.name(fam.param);
    return finish(fitTitle(name), fitDescription(fam.family.lead(name, fam.param)), "family");
  }

  const m = manifestEntry(p);
  if (m && COMPONENT_HEAD[m.comp]) {
    const c = COMPONENT_HEAD[m.comp];
    return finish(c.title, c.description, "component");
  }

  const name = opts.name ?? (m ? prettifyTitle(m.title) : slugTitle(p === "/" ? "home" : p));
  return finish(fitTitle(name), fitDescription(`${name} on Council of AI.`), "derived");
}

/** The subset of Document this writer needs — so tests can hand in a stub without jsdom. */
export interface HeadDocument {
  title: string;
  head: { appendChild(node: unknown): unknown };
  querySelector(selector: string): { setAttribute(name: string, value: string): void; getAttribute(name: string): string | null } | null;
  createElement(tag: string): { setAttribute(name: string, value: string): void; getAttribute(name: string): string | null };
}

function upsert(doc: HeadDocument, selector: string, create: () => { setAttribute(name: string, value: string): void; getAttribute(name: string): string | null }, attr: string, value: string) {
  let el = doc.querySelector(selector);
  if (!el) { el = create(); doc.head.appendChild(el); }
  if (el.getAttribute(attr) !== value) el.setAttribute(attr, value);
}

/** Write a resolved head into the document. Never writes a non-string or empty value. */
export function applyHead(h: ResolvedHead, doc: HeadDocument | null = typeof document !== "undefined" ? (document as unknown as HeadDocument) : null): void {
  if (!doc) return;
  const meta = (attr: "name" | "property", key: string) => () => {
    const el = doc.createElement("meta");
    el.setAttribute(attr, key);
    return el;
  };
  if (typeof h.title === "string" && h.title && doc.title !== h.title) doc.title = h.title;
  if (typeof h.description === "string" && h.description) {
    upsert(doc, 'meta[name="description"]', meta("name", "description"), "content", h.description);
    upsert(doc, 'meta[property="og:description"]', meta("property", "og:description"), "content", h.ogDescription || h.description);
    upsert(doc, 'meta[name="twitter:description"]', meta("name", "twitter:description"), "content", h.ogDescription || h.description);
  }
  if (typeof h.title === "string" && h.title) {
    upsert(doc, 'meta[property="og:title"]', meta("property", "og:title"), "content", h.ogTitle || h.title);
    upsert(doc, 'meta[name="twitter:title"]', meta("name", "twitter:title"), "content", h.ogTitle || h.title);
  }
  if (h.canonical) {
    upsert(doc, 'link[rel="canonical"]', () => { const l = doc.createElement("link"); l.setAttribute("rel", "canonical"); return l; }, "href", h.canonical);
    upsert(doc, 'meta[property="og:url"]', meta("property", "og:url"), "content", h.canonical);
    upsert(doc, 'meta[name="twitter:url"]', meta("name", "twitter:url"), "content", h.canonical);
  }
}

/** Keep reviewed static-route metadata consistent when a lazy page writes a legacy head.
 * Family/derived routes keep their record-specific titles. Disconnect on navigation so an
 * old route can never restore its metadata over the next page. applyHead is idempotent,
 * which lets the observer see its own changes without producing a mutation loop.
 */
export function maintainHead(h: ResolvedHead, doc: Document = document): () => void {
  applyHead(h, doc);
  if (h.source === "family" || h.source === "derived") return () => {};
  const observer = new MutationObserver(() => applyHead(h, doc));
  observer.observe(doc.head, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["content", "href", "name", "property", "rel"],
  });
  return () => observer.disconnect();
}
