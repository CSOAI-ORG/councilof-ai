/**
 * GET /feeds/roots.xml — the published public root, DERIVED from root.json.
 *
 * ONE ITEM, DELIBERATELY. There is no root-history artifact in this repo — /api/public-root-history
 * and /public-root/history.json are both 404 — so this feed publishes the CURRENT root and nothing
 * else. Inventing a back-history from a single snapshot would be fabricating dated events.
 * The guid is the merkle_root, so a reader's client shows a NEW item exactly when the root
 * changes and never re-notifies for a poll that found the same bytes.
 *
 * SCOPE: a valid OpenTimestamps proof over root.json covers root.json BYTES ONLY. It does not
 * anchor the signed-card index and it does not anchor GSPC.
 */
import root from "../../public/root.json";
import { rss, FEED_HEADERS, type Entry } from "./_xml";

interface Root { merkle_root?: string; card_count?: number; as_of?: string; schema?: string; sig_ed25519?: string | null; did_intended?: string }

export function entries(): Entry[] {
  const r = root as unknown as Root;
  if (!r.merkle_root || !r.as_of) return [];   // absent is not zero, and not a fabricated entry
  const signed = r.sig_ed25519 ? "carries an Ed25519 signature" : "is UNSIGNED — no signature is inferred from a content address";
  return [{
    id: `https://councilof.ai/root.json#${r.merkle_root}`,
    title: `Public root ${String(r.merkle_root).slice(0, 16)}… — ${r.card_count} leaves`,
    link: "https://councilof.ai/root.json",
    iso: r.as_of,
    body: [
      `Merkle root: ${r.merkle_root}`,
      `Leaves committed: ${r.card_count} (this is the PUBLIC-ROOT leaf count, a different corpus from the signed card index)`,
      `as_of: ${r.as_of} — read from the artifact, not from the time you fetched it`,
      `Envelope ${signed}${r.did_intended ? `; intended signer ${r.did_intended}` : ""}.`,
      "Stranger inclusion means membership in that leaf list. The OpenTimestamps proof covers root.json bytes only — it does not anchor the card index and does not anchor GSPC.",
    ].join("\n\n"),
  }];
}

export const onRequestGet: PagesFunction = async () =>
  new Response(rss(
    "Council of AI — public root",
    "https://councilof.ai/feeds/roots.xml",
    "The current signed public root: merkle_root, leaf count and as_of, derived from root.json. One item by design — there is no root-history artifact, and a back-history invented from one snapshot would be fabricated dates.",
    entries(),
  ), { headers: FEED_HEADERS });
