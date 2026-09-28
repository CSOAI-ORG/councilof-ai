/**
 * GET /api/cards — live signed-measurement surface (G4 fix).
 *
 * Serves the historical living-board file with its explicit signature verification
 * state, plus the index of measurement cards. Uses the same fetch-static-asset
 * pattern as the rest of the API (e.g. /city/board.json), reading bundled files.
 *
 * The historical, unsigned measurement package contains 14 behavioural axes. Living board counts come
 * from GET /api/gspc (quote totals.public_count). Do not treat 14 as the living
 * slot count. Do not type a fake MEASURED count. Cite live GET /api/gspc totals.
 */

// Whole-store verification facts, derived by scripts/derive-chain-facts.mjs from every card body
// with the published verifier — the same file /api/state → card_chain reads. Only its as_of is
// printed here; the count is read at /api/state, so this note never carries a second copy of it.
import chainFacts from "../../public/signed/chain-facts.json";
import { PINNED_ANCHORS, b64ToBytes, bytesToHex } from "../_lib/cardVerify";

interface CardIndexEntry {
  card: string;
  axis: string;
  ts?: string;
  signed: boolean;
  kid?: string | null;
  pubkey?: string | null;
  title?: string;
}

/**
 * Is a signing key one did:web:csoai.org publishes? Decided against the verifier's PINNED set
 * (functions/_lib/cardVerify.ts), never a live fetch. A signature under a key the DID does not
 * publish is self-consistent only: anyone can mint a key and sign. Added 2026-09-28 after the
 * signature-coverage audit found cards.signed counting the cross-border card, whose inline key
 * (8f9a00a2…, the living-board signer) is not in did.json, beside 335 cards whose key is.
 */
const pinnedKid = (hex: string | null | undefined): string | null => {
  const h = (hex || "").toLowerCase();
  return (h && PINNED_ANCHORS.find((a) => a.hex === h)?.id) || null;
};
const b64KeyHex = (b64: unknown): string | null => {
  if (typeof b64 !== "string" || !b64) return null;
  try {
    return bytesToHex(b64ToBytes(b64));
  } catch {
    return null;
  }
};

export const onRequestGet: PagesFunction = async ({ request }) => {
  const host = new URL(request.url).host;
  const origin = new URL(request.url).origin;
  const u = (p: string) => new URL(p, origin).toString();

  const [boardRes, indexRes, measRes, crossBorderRes, gspcRes] = await Promise.all([
    fetch(u("/signed/board_living.json")),
    fetch(u("/signed/card_index.json")),
    fetch(u("/signed/gspc-measurement.json")),
    fetch(u("/signals/cross-border-card.signed.json")),
    fetch(u("/api/gspc")),
  ]);

  const board = boardRes.ok ? await boardRes.json().catch(() => null) : null;
  const index = indexRes.ok ? await indexRes.json().catch(() => null) : null;
  const meas = measRes.ok ? await measRes.json().catch(() => null) : null;
  const crossBorder = crossBorderRes.ok ? await crossBorderRes.json().catch(() => null) : null;
  const gspc = gspcRes.ok ? await gspcRes.json().catch(() => null) : null;
  const livingTotals = gspc?.totals
    ? {
        see: "/api/gspc",
        public_count: gspc.totals.public_count ?? null,
        axes: gspc.totals.axes ?? null,
        measured_axes: gspc.totals.measured_axes ?? null,
        unmeasured_axes: gspc.totals.unmeasured_axes ?? null,
        note:
          "14 behavioural + see GET /api/gspc for the living board. Do not treat 14 as the living slot count. Financial status is live from GET /api/gspc — do not stamp MEASURED here.",
      }
    : {
        see: "/api/gspc",
        note:
          "14 behavioural + see GET /api/gspc for the living board. Living totals unreachable this load.",
      };

  if (!board || !index) {
    return Response.json(
      {
        schema: "csoai.gspc-cards/0.1",
        status: "UNPUBLISHED",
        host,
        cards: { count: 0, signed: 0, list: [] as CardIndexEntry[] },
        living_board: livingTotals,
        note:
          "Signed measurement card bundle (/signed/*.json) is not published on this deploy yet. " +
          "Live board axes: /api/gspc · axis registry: /api/axis-register.",
        endpoints: {
          gspc: "/api/gspc",
          axis_register: "/api/axis-register",
          cards: "/api/cards",
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, max-age=60",
        },
      },
    );
  }

  const cards: CardIndexEntry[] = (index.cards || [])
    .slice()
    .sort((a, b) => (b.ts || "").localeCompare(a.ts || ""));
  const count = cards.length;
  const chainAsOf = (chainFacts as any)?.as_of ?? "unknown";
  const signed = cards.filter((c) => c.signed).length;
  const signedUnderDidKey = cards.filter((c) => c.signed && pinnedKid(c.pubkey)).length;

  // A present signature is not a checkable one. board_living.json's stamp was marked
  // UNVERIFIABLE on 2026-08-26 (it does not reproduce under any published rule; see the
  // file's own unverifiable_note and /api/corrections C-2026-0826-08). Carry that state
  // through verbatim rather than reporting a bare present:true, which reads as "verified".
  const signature = board.signature
    ? {
        present: true,
        signer: board.signer,
        sig_input: board.sig_input,
        verification_state: board.verification_state ?? "UNSTATED",
        verifiable: board.verifiable ?? null,
        signer_anchored: board.signer_anchored ?? null,
        unverifiable_note: board.unverifiable_note ?? null,
      }
    : { present: false, signer: board.signer };

  const crossBorderKeyHex = b64KeyHex(crossBorder?.signature?.pubkey);
  const crossBorderKid = pinnedKid(crossBorderKeyHex);
  const crossBorderEntry = crossBorder
    ? {
        card: "cross-border-card",
        axis: "cross-border",
        signed: !!crossBorder.signature?.sig,
        signer_pubkey_hex: crossBorderKeyHex,
        signer_in_did: !!crossBorderKid,
        signer_kid: crossBorderKid,
        anchoring: crossBorderKid ? "ANCHORED" : "UNANCHORED",
        anchoring_note: crossBorderKid
          ? `The inline key is ${crossBorderKid}, published in did:web:csoai.org.`
          : "The signature verifies over its own inline key, and that key is not a verificationMethod of " +
            "did:web:csoai.org, so it cannot be checked against the published trust root. signed=true means a " +
            "signature is carried, not that it verifies under a published key.",
        title: crossBorder.title || "One signed measurement, every regime mapped",
        schema: crossBorder.schema || "csoai.east-west-card/1",
        content_id: crossBorder.content_id,
        url: "/signals/cross-border-card.signed.json",
      }
    : null;

  return Response.json({
    schema: "csoai.gspc-cards/0.1",
    issuer: "councilof.ai",
    served_from: host,
    measured_on: board.updated,
    measurement: meas
      ? {
          schema: meas.schema,
          gspc_registry_axes: meas.gspc_registry_axes,
          axes: (meas.axes || []).length,
          artifact: "/signed/gspc-measurement.json",
          artifact_state: "HISTORICAL_UNSIGNED",
          packaged_at: meas.packaged_at ?? null,
          pack: "14 behavioural axes in a historical unsigned package. GET /api/gspc is the current board.",
          living_board: livingTotals,
          historical_publish_readiness: meas.publish_readiness ?? null,
          history_note:
            "The package's 2026-08-26 amendment records a stale jail row. Its old board: live declaration is historical, not a current status claim.",
        }
      : { living_board: livingTotals },
    board: {
      schema: board.schema,
      signed: board.signed,
      signer: board.signer,
      axes: Object.keys(board.axes || {}),
      axes_note:
        "This historical living-board file lists 14 behavioural axes. Its signature verification state is published below. Current board: GET /api/gspc.",
      signature,
    },
    living_board: livingTotals,
    cross_border: crossBorderEntry,
    cards: {
      count: count + (crossBorderEntry ? 1 : 0),
      signed: signed + (crossBorderEntry?.signed ? 1 : 0),
      signed_under_did_key: signedUnderDidKey + (crossBorderEntry?.signed && crossBorderKid ? 1 : 0),
      signed_under_did_key_note:
        "signed counts entries that carry a signature; signed_under_did_key counts those whose signing key " +
        "is one did:web:csoai.org publishes (pinned set in functions/_lib/cardVerify.ts). The difference is " +
        "signatures that cannot be checked against the published trust root.",
      list: crossBorderEntry ? [crossBorderEntry, ...cards.slice(0, 99)] : cards.slice(0, 100),
      full_count_hint: count + (crossBorderEntry ? 1 : 0),
    },
    note:
      "count = signed measurement cards in the living registry plus cross-border East-West card when published. " +
      "kid identifies the signing key; signed=true means the card carries a signature — it does NOT mean anyone " +
      "has checked it. Read board.signature.verification_state: the living board's stamp is UNVERIFIABLE (it does " +
      "not reproduce under any published rule and its signer is not in did.json). This index's measurement pack is " +
      "14 behavioural + see GET /api/gspc for the living board. This index carries " +
      `${count} signed measurement cards — DERIVED from card_index.json on every request, never typed. ` +
      "WHICH CORPUS: these are the signed card index (/signed/card_index.json, corpus 3 of the three in " +
      "council-os/CARD-CORPORA.md). They are not the public-root Merkle leaves (/root.json → card_count) " +
      "and not the card wrappers on disk (/cards-bundle.json → card_count); the corpora share no " +
      "identifiers and are never added. WHAT WAS CHECKED: the whole published card store was verified " +
      "under did:web:csoai.org#card-attestation-1 — read the count at /api/state → " +
      "card_chain.bodies_verified_valid (kind measured: each id recomputed from its canonical body and its " +
      `Ed25519 signature checked by /signed/verify-card.mjs; as_of ${chainAsOf}). The 150/150 ` +
      "recorded in board_living.json was an earlier check of a 150-card subset of this same chain, not a " +
      "second corpus and not a ratio over it. A card added after that as_of carries no verdict until the " +
      "check is re-run: unchecked is not failed. See /signed/HOW-TO-VERIFY.md.",
  });
};
