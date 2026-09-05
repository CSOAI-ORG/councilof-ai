/**
 * GET /feeds/corrections.xml — the corrections ledger as a feed. DERIVED, never typed.
 *
 * WHY. /api/feed.xml is a hand-maintained array: items are appended by whoever remembers, and
 * its own titles freeze counts ("22 axis · 22 measured") that the live board then moves past.
 * The corrections ledger is the opposite — it is already dated, already append-only by
 * convention, and it is the estate's credibility engine: the same body that publishes the
 * number publishes when the number was wrong. Anyone who wants to watch us mark our own
 * homework should be able to subscribe to exactly that, without an account.
 *
 * One source: functions/api/corrections.ts exports LEDGER and this reads it. No second copy.
 */
import { LEDGER } from "../api/corrections";
import { rss, atom, FEED_HEADERS, type Entry } from "./_xml";

interface Correction { id: string; date: string; what_was_wrong: string; how_caught: string; fix: string; status?: string }

export function entries(): Entry[] {
  const rows = ((LEDGER as unknown as { corrections: Correction[] }).corrections || []).slice();
  // Newest first, by the entry's OWN date. Ties keep ledger order — ids are sequential within
  // a day, so a stable sort preserves the order the estate recorded them in.
  rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return rows.map((c) => ({
    id: `https://councilof.ai/api/corrections#${c.id}`,
    title: `${c.id} — ${String(c.what_was_wrong || "").split(/(?<=\.)\s/)[0]}`.slice(0, 180),
    link: `https://councilof.ai/api/corrections#${c.id}`,
    iso: c.date,
    body: [
      `WHAT WAS WRONG: ${c.what_was_wrong}`,
      `HOW IT WAS CAUGHT: ${c.how_caught}`,
      `FIX: ${c.fix}`,
      c.status ? `STATUS: ${c.status}` : "",
      "This is a correction we issued about ourselves. Measurement, not certification.",
    ].filter(Boolean).join("\n\n"),
  }));
}

const TITLE = "Council of AI — corrections ledger";
const DESC =
  "Every entry is something we got wrong, how it was caught (usually by our own instrument), and the fix — dated. Derived from GET /api/corrections; nothing here is typed into the feed. An entry is a fact about our own history, not a measurement and not a claim about anyone else.";

export const onRequestGet: PagesFunction = async () =>
  new Response(rss(TITLE, "https://councilof.ai/feeds/corrections.xml", DESC, entries()), { headers: FEED_HEADERS });

export const atomBody = () => atom(TITLE, "https://councilof.ai/feeds/corrections.atom", DESC, entries());
