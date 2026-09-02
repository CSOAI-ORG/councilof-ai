/**
 * GET /api/cards — live signed-measurement surface (G4 fix).
 *
 * Serves the SIGNED living board + the index of signed measurement cards so the
 * public can verify the measurements the estate has actually signed (not a
 * stale static snapshot). Uses the same fetch-static-asset pattern as the rest
 * of the API (e.g. /city/board.json), reading the bundled /signed/*.json.
 *
 * The signed measurement pack is 14 behavioural axes. Living board counts come
 * from GET /api/gspc (quote totals.public_count). Do not treat 14 as the living
 * slot count. Do not type a fake MEASURED count. Cite live GET /api/gspc totals.
 */

interface CardIndexEntry {
  card: string;
  axis: string;
  ts?: string;
  signed: boolean;
  kid?: string | null;
  title?: string;
}

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
  const signed = cards.filter((c) => c.signed).length;

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

  const crossBorderEntry = crossBorder
    ? {
        card: "cross-border-card",
        axis: "cross-border",
        signed: !!crossBorder.signature?.sig,
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
          pack: "14 behavioural (signed gspc-measurement.json snapshot — not the living board)",
          living_board: livingTotals,
          publish_readiness: meas.publish_readiness,
        }
      : { living_board: livingTotals },
    board: {
      schema: board.schema,
      signed: board.signed,
      signer: board.signer,
      axes: Object.keys(board.axes || {}),
      axes_note:
        "This signed living-board snapshot lists 14 behavioural axes. Living board: GET /api/gspc. Do not treat 14 as the living slot count.",
      signature,
    },
    living_board: livingTotals,
    cross_border: crossBorderEntry,
    cards: {
      count: count + (crossBorderEntry ? 1 : 0),
      signed: signed + (crossBorderEntry?.signed ? 1 : 0),
      list: crossBorderEntry ? [crossBorderEntry, ...cards.slice(0, 99)] : cards.slice(0, 100),
      full_count_hint: count + (crossBorderEntry ? 1 : 0),
    },
    note:
      "count = signed measurement cards in the living registry plus cross-border East-West card when published. " +
      "kid identifies the signing key; signed=true means the card carries a signature — it does NOT mean anyone " +
      "has checked it. Read board.signature.verification_state: the living board's stamp is UNVERIFIABLE (it does " +
      "not reproduce under any published rule and its signer is not in did.json). This index's measurement pack is " +
      "14 behavioural + see GET /api/gspc for the living board. This index carries 313 cards; " +
      "150 of those verify against did:web:csoai.org#card-attestation-1 (per board_living.json) — see /signed/HOW-TO-VERIFY.md.",
  });
};
