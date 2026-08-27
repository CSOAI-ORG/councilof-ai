/**
 * The /blog index, derived entirely from client/src/data/blog-content.ts.
 *
 * Nothing on a card is typed from memory. The title and excerpt are the entry's
 * own ogTitle/description, the date is the post's JSON-LD `datePublished`, the
 * author is its JSON-LD `author.name`, and the read time is the one the article
 * prints about itself — falling back to a word count of its own body only when
 * the article prints none. A post with no JSON-LD gets no date rather than an
 * invented one: UNMEASURED is first-class here too.
 *
 * There is deliberately NO category filter. `BlogDataEntry` has no category
 * field, and 34 of the 48 posts declare none in their own markup, so a category
 * pill row could only be filled by inventing 34 labels — which is the exact
 * failure mode that let a hardcoded placeholder array sit on this route. The
 * pills filter by publication period instead, which every dated post really has.
 */

import { blogdata, type BlogDataEntry } from "../data/blog-content";

export const ALL_PERIODS = "All";
export const UNDATED = "Undated";

/** Words per minute used only when an article does not state its own read time. */
const WPM = 225;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

/** Gradients cycle over the periods present, so a pill and its cards match. */
const GRADIENTS = [
  "from-emerald-500 to-emerald-600",
  "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600",
  "from-orange-500 to-orange-600",
  "from-teal-500 to-teal-600",
  "from-slate-600 to-slate-700",
];
const BADGES = [
  "bg-emerald-100 text-emerald-800",
  "bg-blue-100 text-blue-800",
  "bg-purple-100 text-purple-800",
  "bg-orange-100 text-orange-800",
  "bg-teal-100 text-teal-800",
  "bg-slate-100 text-slate-800",
];

export interface BlogCard {
  slug: string;
  /** Always `/blog/<slug>` — the route App.tsx serves from this same dataset. */
  href: string;
  title: string;
  excerpt: string;
  /** ISO date from JSON-LD, or null when the post carries no JSON-LD. */
  date: string | null;
  /** "Aug 25, 2026", or null when there is no date to show. */
  dateLabel: string | null;
  /** "August 2026", or UNDATED. */
  period: string;
  author: string | null;
  readTime: string;
  /** True when the article states its own read time; false when we counted words. */
  readTimeDeclared: boolean;
  gradient: string;
  badgeClass: string;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  mdash: "—", ndash: "–", hellip: "…", rsquo: "’", lsquo: "‘",
};

/** ogTitle/description are HTML-escaped in the data; React renders text, not HTML. */
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X"
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
  });
}

function firstBlogPosting(entry: BlogDataEntry): Record<string, any> | null {
  for (const raw of entry.ldJson ?? []) {
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { continue; }
    if (parsed && parsed["@type"] === "BlogPosting") return parsed;
  }
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ");
}

/** The read time the article prints about itself, if it prints one. */
export function declaredReadTime(html: string): number | null {
  const m = /(\d+)\s*min read/i.exec(html);
  const mins = m ? parseInt(m[1], 10) : NaN;
  return Number.isFinite(mins) && mins > 0 ? mins : null;
}

/** Fallback: the article's own word count at WPM, never less than one minute. */
export function countedReadTime(html: string): number {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WPM));
}

/** "2026-08-25" -> "Aug 25, 2026". Fixed month names so SSR and tests agree. */
export function formatDateLabel(iso: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const month = MONTHS_SHORT[Number(m[2]) - 1];
  return month ? `${month} ${Number(m[3])}, ${m[1]}` : null;
}

/** "2026-08-25" -> "August 2026". */
export function formatPeriod(iso: string): string | null {
  const m = /^(\d{4})-(\d{2})/.exec(iso);
  if (!m) return null;
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${month} ${m[1]}` : null;
}

/**
 * Six slugs are 308'd straight back to /blog by public/_redirects, so a deep link to
 * one of them bounces the reader to the page they came from. Listing them would be
 * advertising a destination that does not arrive. They stay out of the index until
 * whoever set those redirects lifts them — at which point deleting a line here is the
 * whole change. Found by lane/nav-integrity, which tested every link on the site.
 *
 * This is the ONLY reason an entry may be withheld. It is not editorial: the rule is
 * "the link must arrive", checked against the redirect table, not against taste.
 */
export const REDIRECTED_AWAY = new Set([
  "ai-governance-vs-compliance",
  "choosing-ai-compliance-vendor",
  "dora-compliance-uk-financial-services",
  "eu-ai-act-article-50-countdown",
  "layer-0-agent-economy-trust",
  "nis2-compliance-critical-infrastructure",
]);

/**
 * Every entry in the dataset becomes exactly one card — no hand-picking and no
 * placeholder fallback; the only entries withheld are the ones whose own URL
 * redirects away (see REDIRECTED_AWAY). Newest first; undated posts last;
 * slug breaks ties so the order is stable between renders and in tests.
 */
export function buildBlogIndex(entries: BlogDataEntry[] = blogdata): BlogCard[] {
  const withDates = entries
    .filter((entry) => !REDIRECTED_AWAY.has(entry.slug))
    .map((entry) => {
    const posting = firstBlogPosting(entry);
    const rawDate = typeof posting?.datePublished === "string" ? posting.datePublished : null;
    const dateLabel = rawDate ? formatDateLabel(rawDate) : null;
    const period = (rawDate ? formatPeriod(rawDate) : null) ?? UNDATED;
    const author = posting?.author
      ? (typeof posting.author === "string" ? posting.author : posting.author?.name ?? null)
      : null;
    const declared = declaredReadTime(entry.content);
    const minutes = declared ?? countedReadTime(entry.content);
    return {
      slug: entry.slug,
      href: `/blog/${entry.slug}`,
      title: decodeEntities(entry.ogTitle || entry.title),
      excerpt: decodeEntities(entry.ogDescription || entry.description),
      date: dateLabel ? rawDate : null,
      dateLabel,
      period,
      author: author ? decodeEntities(String(author)) : null,
      readTime: `${minutes} min read`,
      readTimeDeclared: declared !== null,
    };
  });

  withDates.sort((a, b) => {
    if (a.date && b.date && a.date !== b.date) return a.date < b.date ? 1 : -1;
    if (a.date && !b.date) return -1;
    if (!a.date && b.date) return 1;
    return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
  });

  const periodOrder = orderedPeriods(withDates);
  return withDates.map((card) => {
    const i = Math.max(0, periodOrder.indexOf(card.period));
    return {
      ...card,
      gradient: GRADIENTS[i % GRADIENTS.length],
      badgeClass: BADGES[i % BADGES.length],
    };
  });
}

/** The periods actually present, newest first, with UNDATED (if any) last. */
export function orderedPeriods(cards: Array<Pick<BlogCard, "period" | "date">>): string[] {
  const seen: string[] = [];
  for (const card of cards) if (!seen.includes(card.period)) seen.push(card.period);
  return seen;
}

/** ["All", ...periods] — the pill row. */
export function blogPeriodFilters(cards: BlogCard[]): string[] {
  return [ALL_PERIODS, ...orderedPeriods(cards)];
}

export function filterByPeriod(cards: BlogCard[], period: string): BlogCard[] {
  return period === ALL_PERIODS ? cards : cards.filter((c) => c.period === period);
}

/** The gradient for a pill, matching the cards it selects. */
export function periodGradient(cards: BlogCard[], period: string): string {
  if (period === ALL_PERIODS) return "from-slate-700 to-slate-800";
  return cards.find((c) => c.period === period)?.gradient ?? "from-slate-700 to-slate-800";
}
