/**
 * corpusNote — what "not a leaf of the public root" means, said next to the verdict.
 *
 * WHY (anonymous end-to-end test, 2026-09-30). An agent ran verify_card on
 * /interop/mill-cards-signed/signed-jail-4ca9e0079d1d.json and got VALID, then verify_inclusion on
 * the same card's id and got {"state":"INVALID","reason":"not a leaf"}. Both answers were correct:
 * /root.json commits the catalogued public-root card-v0 leaves only, and the signed measurement
 * cards and the signed card index are separate corpora (council-os/CARD-CORPORA.md, zero id
 * overlap). But a reader takes INVALID to mean forged. The state enum is NOT changed here
 * (VALID / INVALID / UNCHECKABLE, and the 12-tool lock stands); this only adds the sentence that
 * says which corpus the root covers and, when the sha is a known id of another corpus, where that
 * card is verified instead.
 *
 * WHAT IT READS (published bytes only, never a typed count):
 *   - /signed/card_index.json            the signed card index (corpus 3): id -> card_url
 *   - /interop/card-root-latest.json     the unsigned pointer to the mill-card root, then the root
 *                                        bytes it names, checked against the pointer's root_sha256
 *                                        before any leaf is quoted.
 *
 * WHAT IT NEVER SAYS. No anchoring is asserted. The signed card index is not a leaf set of any
 * Merkle root and no job places it in one; the mill-card root's OTS sidecar state is linked, never
 * summarised as "anchored" (its existence is not a Bitcoin anchor). An unreadable source makes the
 * note say it could not look — it never guesses membership.
 */

export type CorpusNoteRoot = { card_count?: number | null; as_of?: string | null; merkle_root?: string | null };
export type Get = (path: string) => Promise<Response>;

export const CORPUS_KINDS = ["signed_card_index", "mill_card_root", "none_known", "unchecked"] as const;

/** The same wording for every not-a-leaf answer: which corpus /root.json covers, and what it does not. */
export function rootScopeSentence(root: CorpusNoteRoot): string {
  const n = typeof root.card_count === "number" ? String(root.card_count) : "its";
  const asOf = root.as_of ? ` (as_of ${root.as_of})` : "";
  return (
    `Not a leaf of the public root. /root.json${asOf} commits ${n} catalogued public-root card-v0 leaves only ` +
    "(leaf = sha256 of the canonical card minus sha256 and sig_ed25519). Signed measurement cards " +
    "(/interop/mill-cards-signed/) and the signed card index (/signed/card_index.json) are separate corpora " +
    "with no id in common; they are verified with verify_card (and the signed index head), not against this root. " +
    "Here INVALID means \"not a leaf of this root\", not \"forged\"."
  );
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

type Json = Record<string, any>;

async function readJson(get: Get, path: string): Promise<Json> {
  const r = await get(path);
  if (!r.ok) throw new Error(`GET ${path} returned HTTP ${r.status}`);
  return (await r.json()) as Json;
}

export async function corpusNote(sha: string, get: Get, root: CorpusNoteRoot) {
  const scope = rootScopeSentence(root);
  const unread: string[] = [];

  // 1. The signed card index (corpus 3).
  try {
    const idx = await readJson(get, "/signed/card_index.json");
    const rows = (Array.isArray(idx.cards) ? idx.cards : []) as Json[];
    const row = rows.find((r) => String(r.card ?? "").toLowerCase() === sha);
    if (row) {
      const cardUrl = String(row.card_url || `/signed/cards/${sha}.json`);
      return {
        corpus: "signed_card_index" as const,
        corpus_note:
          `${scope} This sha is a card id in the signed card index (${idx.n_cards ?? rows.length} cards, head ${idx.head ?? "unknown"}). ` +
          `Verify it with verify_card on ${cardUrl}: each card carries its own Ed25519 signature under ` +
          `did:web:csoai.org#${row.kid ?? "card-attestation-1"}. The signed card index is not a leaf set of any Merkle root, ` +
          "and no job schedules it into one; no anchoring is claimed for it.",
        verify_with: { tool: "verify_card", arguments: { card: sha }, card_url: cardUrl },
        anchoring: "none scheduled",
      };
    }
  } catch (e) {
    unread.push(`/signed/card_index.json (${e instanceof Error ? e.message : String(e)})`);
  }

  // 2. The mill-card root (signed measurement cards, committed by their own Merkle root).
  try {
    const ptr = await readJson(get, "/interop/card-root-latest.json");
    const rootUrl = String(ptr.root_url || "");
    if (ptr.schema !== "csoai.card-root-pointer/1" || !rootUrl.startsWith("/interop/card-root-")) {
      throw new Error("mill-card root pointer shape is not checkable");
    }
    const rr = await get(rootUrl);
    if (!rr.ok) throw new Error(`GET ${rootUrl} returned HTTP ${rr.status}`);
    const bytes = await rr.arrayBuffer();
    if ((await sha256Hex(bytes)) !== String(ptr.root_sha256 || "")) {
      throw new Error(`${rootUrl} bytes do not match the pointer's root_sha256`);
    }
    const mroot = JSON.parse(new TextDecoder().decode(bytes)) as Json;
    const leaves = (Array.isArray(mroot.leaves) ? mroot.leaves : []) as Json[];
    const leaf = leaves.find((l) => String(l.id ?? "").toLowerCase() === sha || String(l.leaf ?? "").toLowerCase() === sha);
    if (leaf) {
      const cardUrl = `/interop/mill-cards-signed/${leaf.card}`;
      return {
        corpus: "mill_card_root" as const,
        corpus_note:
          `${scope} This sha is a signed measurement card (${leaf.card}, card id ${leaf.id}). ` +
          `It is leaf ${leaf.leaf} (index ${leaf.index}) of the separate mill-card root ${rootUrl} ` +
          `(${mroot.n_leaves ?? leaves.length} leaves, as_of ${mroot.as_of ?? ptr.as_of ?? "unknown"}, merkle_root ${mroot.merkle_root ?? "unknown"}), ` +
          "whose leaf is sha256 of the whole signed card, not its id. Verify the card with verify_card on " +
          `${cardUrl}. That root's OTS state is read from ${ptr.ots_url ?? "its .ots sidecar"}; a sidecar's existence is not a Bitcoin anchor, and no anchoring is claimed here.`,
        verify_with: { tool: "verify_card", arguments: { card: cardUrl }, card_url: cardUrl },
        mill_card_root: {
          root_url: rootUrl,
          as_of: mroot.as_of ?? null,
          n_leaves: mroot.n_leaves ?? leaves.length,
          merkle_root: mroot.merkle_root ?? null,
          leaf_sha256: leaf.leaf ?? null,
          index: leaf.index ?? null,
          ots_url: ptr.ots_url ?? null,
          root_bytes_match_pointer: true,
        },
        anchoring: "not claimed",
      };
    }
  } catch (e) {
    unread.push(`mill-card root (${e instanceof Error ? e.message : String(e)})`);
  }

  if (unread.length) {
    return {
      corpus: "unchecked" as const,
      corpus_note: `${scope} Whether this sha belongs to another corpus could not be checked: ${unread.join("; ")}.`,
    };
  }
  return {
    corpus: "none_known" as const,
    corpus_note: `${scope} This sha is also not a card id in the signed card index, nor a card id or leaf of the current mill-card root.`,
  };
}
