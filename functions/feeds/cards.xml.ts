/**
 * GET /feeds/cards.xml — newly signed measurement cards, DERIVED from the signed index.
 *
 * The card index is the corpus where a verification was actually run: each entry carries its
 * own `ts`, its axis, and the Ed25519 signature that a stranger can check with the verifier we
 * publish. Subscribing to it is the closest thing the estate has to "tell me when a new
 * measurement lands", and it needs no account.
 *
 * SCOPE, because three different things here carry a "card count": this feed is the SIGNED CARD
 * INDEX (public/signed/card_index.json). It is NOT the public-root leaf set and NOT the on-disk
 * wrapper count; those are separate corpora with zero identifier overlap
 * (/api/state -> signed_cards.corpus_relation). See council-os/CARD-CORPORA.md.
 */
import cardIndex from "../../public/signed/card_index.json";
import { rss, FEED_HEADERS, type Entry } from "./_xml";

interface Card { card: string; axis?: string; ts?: string; card_url?: string; kid?: string; signed?: boolean }

const LIMIT = 50; // a feed is a window on the newest, not a database dump

export function entries(): Entry[] {
  const idx = cardIndex as unknown as { cards?: Card[]; n_cards?: number; n_cells?: number };
  const cards = idx.cards || [];
  // Refuse rather than publish a number the artifact contradicts: if the header disagrees with
  // its own contents, neither count is quotable and the feed says so instead of guessing.
  if (typeof idx.n_cards === "number" && idx.n_cards !== cards.length) {
    return [{
      id: "https://councilof.ai/signed/card_index.json#inconsistent",
      title: "Card index is internally inconsistent — no card entries published",
      link: "https://councilof.ai/signed/card_index.json",
      iso: new Date(0).toISOString(),
      body: `card_index.json declares n_cards=${idx.n_cards} but carries ${cards.length} entries. When a header disagrees with its own contents neither number is quotable, so this feed publishes the disagreement rather than a list derived from it.`,
    }];
  }
  return cards
    .filter((c) => c && c.ts)
    .sort((a, b) => String(b.ts).localeCompare(String(a.ts)))
    .slice(0, LIMIT)
    .map((c) => ({
      id: `https://councilof.ai/signed/cards/${c.card}.json`,
      title: `Signed card — ${c.axis || "unlabelled axis"} — ${String(c.card).slice(0, 12)}…`,
      link: c.card_url || `https://councilof.ai/signed/cards/${c.card}.json`,
      iso: String(c.ts),
      body: [
        `Axis: ${c.axis || "not stated on the index entry"}`,
        `Card id (sha256 of the canonical body): ${c.card}`,
        c.kid ? `Signed under: ${c.kid}` : "",
        "Verify it yourself, free and without an account: https://councilof.ai/signed/verify-card.mjs — the same verifier we run.",
        "A signature is an integrity claim, not a truth claim. Measurement, not certification.",
      ].filter(Boolean).join("\n\n"),
    }));
}

export const onRequestGet: PagesFunction = async () =>
  new Response(rss(
    "Council of AI — newly signed measurement cards",
    "https://councilof.ai/feeds/cards.xml",
    "The newest entries in the SIGNED CARD INDEX, each with the id a stranger can verify. Derived from public/signed/card_index.json; nothing typed. Not the public-root leaf set and not the on-disk wrapper count — those are separate corpora.",
    entries(),
  ), { headers: FEED_HEADERS });
