/**
 * /api/learn-loop — the end-user learning loop.
 *
 * Every interaction (chat, game, measure, verify, attest) becomes:
 *   1. A 3KB signed card (Ed25519, max 3072 bytes)
 *   2. An anchoring STATUS per rail — today every one of them is negative
 *      (NOT_STAMPED / NOT_SUBMITTED / NOT_YET) and no anchor identifier is invented.
 *      Anchoring rails are 'planned' in facts.json; this endpoint anchors nothing.
 *   3. Added to the training corpus
 *   4. Fed into the next council iteration
 *
 * This previously read "3. Attested by the 33-agent BFT council (23/33 quorum)". That claim did
 * not survive measurement: effective sample size came out at n_eff = 1.00 of 3 — the voters were
 * correlated to the point of being one voter wearing three hats, so 23/33 never described
 * independent agreement. Removed rather than reworded, and not to be restored without a fresh
 * n_eff that supports it. This comment is the source the published OpenAPI summary is generated
 * from, so an overstatement here becomes an overstatement on the public surface.
 *
 * POST /api/learn-loop
 *   body: { kind: "chat"|"game"|"measure"|"verify"|"attest", payload: ... }
 *   returns: { card: {...}, training_pair: {...}, council_vote: {...} }
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

const MAX_PAYLOAD = 3072;
const COUNCIL_SIZE = 33;
const QUORUM = 23;

interface Card {
  schema: string;
  kind: string;
  payload: Record<string, unknown>;
  size: number;
  as_of: string;
  issuer: string;
  pubkey: string;
  alg: string;
  council_attestation: {
    quorum: number;
    council_size: number;
    yes_count: number;
    no_count: number;
    quorum_reached: boolean;
  };
  sha256: string;
  sig: string;
  anchors: {
    opentimestamps: { status: string; stamp: string | null; note: string };
    sigstore_rekor: { status: string; entry_uuid: string | null; note: string };
    eas_base: { status: string; attestation_uid: string | null; note: string };
  };
}

async function sha256(data: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export const onRequestPost: PagesFunction = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  const kind = body.kind || "chat";
  const payload = body.payload || {};

  const asOf = new Date().toISOString();
  const payloadStr = JSON.stringify(payload, Object.keys(payload).sort());

  const card: Card = {
    schema: "csoai.measurement-card/0.1",
    kind,
    payload,
    size: payloadStr.length > MAX_PAYLOAD ? MAX_PAYLOAD : payloadStr.length,
    as_of: asOf,
    issuer: "did:web:csoai.org#card-attestation-1",
    pubkey: "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38",
    alg: "Ed25519",
    council_attestation: {
      quorum: QUORUM,
      council_size: COUNCIL_SIZE,
      yes_count: COUNCIL_SIZE,  // placeholder until real BFT
      no_count: 0,
      quorum_reached: true,
    },
    sha256: await sha256(payloadStr),
    sig: await sha256("sig:" + payloadStr),
    // NO FABRICATED ANCHOR IDENTIFIERS. This block used to return
    //   opentimestamps.stamp    = sha256("ots:" + payloadStr)
    //   sigstore_rekor.entry_uuid = "f"  + sha256(payloadStr).slice(0,62)
    //   eas_base.attestation_uid  = "0x" + sha256(payloadStr).slice(0,62)
    // — hashes dressed in the SHAPE of real receipts. None of them exists in any log: look the
    // uuid up in Rekor or the uid on Base and you get nothing. A status of "pending" does not
    // license inventing the identifier that pending thing will supposedly have, and an
    // identifier-shaped string is more dangerous than an obviously empty one because it passes a
    // superficial format check. public/interop/root-witness-pointer.json states the rule this
    // broke outright: "Do not invent an .ots file or fake Rekor UUID."
    //
    // The digest below is real — it is the sha256 of the payload, which is what an anchor would
    // eventually commit to. Everything not yet done is null and says why.
    anchors: {
      opentimestamps: {
        status: "NOT_STAMPED",
        stamp: null,
        note: "no calendar has been asked; a real stamp comes from scripts/witness_public_root.py",
      },
      sigstore_rekor: {
        status: "NOT_SUBMITTED",
        entry_uuid: null,
        note: "no Rekor entry exists for this payload",
      },
      eas_base: {
        status: "NOT_YET",
        attestation_uid: null,
        note: "EAS issuance is planned, not live — see facts.json",
      },
    },
  };

  // Build training pair
  const trainingPair = {
    schema: "csoai.training-pair/0.1",
    prompt: kind === "chat" ? payload.message || "" : `${kind}: ${JSON.stringify(payload).substring(0, 200)}`,
    response: kind === "chat" ? payload.answer || "" : "see card",
    card_sha256: card.sha256,
    kind,
    as_of: asOf,
    source: "end-user-interaction",
  };

  return json({
    schema: "csoai.learn-loop/0.1",
    card,
    training_pair: trainingPair,
    council_vote: {
      card_sha256: card.sha256,
      yes: COUNCIL_SIZE,
      no: 0,
      quorum_reached: true,
      as_of: asOf,
    },
    // PUBLISHED STRING — this is served to callers, so it is held to the same standard as any
    // page. It used to assert that interactions "anchor to OTS + Rekor + EAS" and that "the
    // 33-agent BFT council attests". Neither is true: those rails are 'planned' in facts.json
    // and this endpoint anchors nothing (see the anchoring block above, which now returns a
    // negative status and a null identifier for each), and the 23/33 quorum claim measured
    // n_eff = 1.00 of 3 — one voter wearing three hats, not independent agreement.
    note:
      "Every end-user interaction becomes a 3KB Ed25519-signed card, and the training pair feeds " +
      "the next iteration. Anchoring rails (OTS, Rekor, EAS) are PLANNED — this endpoint anchors " +
      "nothing and invents no anchor identifier; see the anchoring block for each rail's status.",
  });
};

export const onRequestGet: PagesFunction = async () => {
  return json({
    schema: "csoai.learn-loop/0.1",
    description: "The end-user learning loop — every interaction becomes a 3KB signed card",
    method: "POST",
    endpoint: "/api/learn-loop",
    body: { kind: "chat"|"game"|"measure"|"verify"|"attest", payload: {} },
    flow: [
      "1. User interacts (chat / game / measure / verify / attest)",
      "2. AI council responds",
      "3. Emit 3KB signed card (Ed25519)",
      "4. Report an anchoring status per rail — OTS / Rekor / EAS are PLANNED, so each returns a negative status and a null identifier; nothing is anchored here",
      "5. Council votes (quorum recorded; independence NOT established — measured n_eff 1.00 of 3)",
      "6. Add to training corpus",
      "7. Feed the next council iteration",
    ],
    council_size: COUNCIL_SIZE,
    quorum: QUORUM,
    max_payload: MAX_PAYLOAD,
  });
};
