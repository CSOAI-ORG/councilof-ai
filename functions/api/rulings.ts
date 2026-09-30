/**
 * GET /api/rulings — every signed ruling record (csoai.ruling/0.1) with its signature state, read-only. A ruling decides which rule applies or whether a rule output is served; it never sets a measured state.
 *
 * Adopted by the owner 2026-09-29 ("adopt the ruling records"). A ruling decides which rule
 * applies, or whether a rule's output is served, published, named or admitted. It NEVER sets a
 * measured state: those come only from pinned rules over pinned bytes (the board, /api/gspc,
 * imports nothing from here, and a test holds that). The reviewer panel has not convened; every
 * record says so, and the owner's ruling binds until measured panel independence reaches n_eff 2.
 *
 * Every signature is checked on THIS request against the pinned key, the same pin and the same
 * detached-attestation shape as /api/corrections: VALID needs both the Ed25519 bytes to verify
 * and the attestation's content_id to equal the digest of the bytes served. Records are produced
 * only by scripts/rulings/produce-ruling.mjs, which signs through POST /api/board-sign.
 *
 *   GET /api/rulings            index + every record, each with its signature_state
 *   GET /api/rulings?id=R-...   one record (404 when absent)
 *
 * No POST: this surface cannot accept, amend or cast a ruling.
 */

import { RULINGS, RULINGS_INDEX } from "./_rulings_data";

const BOARD_DID = "did:web:csoai.org#board-attestation-1";
const BOARD_KEY_HEX = "9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170";

type Signed = Record<string, unknown> & {
  signature?: { attestation?: Record<string, unknown>; sig_ed25519?: string };
};
export type RulingSignatureState = "VALID" | "STALE" | "INVALID_SIGNATURE" | "UNSIGNED" | "UNCHECKABLE";

/** RFC 8785 JCS for the profile's value space; refuses a non-integer number, as the producer does. */
export function jcs(v: unknown): string {
  if (v === null || typeof v === "boolean" || typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number") {
    if (!Number.isSafeInteger(v)) throw new Error(`JCS: refusing non-integer number ${v}`);
    return JSON.stringify(v);
  }
  if (Array.isArray(v)) return "[" + v.map(jcs).join(",") + "]";
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    const keys = Object.keys(o).filter((k) => o[k] !== undefined).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + jcs(o[k])).join(",") + "}";
  }
  throw new Error(`JCS: unsupported ${typeof v}`);
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(h: string): Uint8Array {
  if (!/^([0-9a-f]{2})*$/.test(h)) throw new Error("not hex");
  return Uint8Array.from(h.match(/../g) ?? [], (b) => parseInt(b, 16));
}

async function verifyEd25519(msg: string, sigHex: string): Promise<boolean | null> {
  try {
    const key = await crypto.subtle.importKey("raw", hexToBytes(BOARD_KEY_HEX) as BufferSource, { name: "Ed25519" }, false, ["verify"]);
    return await crypto.subtle.verify({ name: "Ed25519" }, key, hexToBytes(sigHex) as BufferSource, new TextEncoder().encode(msg));
  } catch {
    return null;
  }
}

/** Exported so tests check the served bytes with the same code a request runs. */
export async function checkSigned(doc: Signed, kind: "record" | "index"): Promise<{ state: RulingSignatureState; recomputed: string }> {
  const { signature, ...body } = doc;
  const recomputed = await sha256Hex(jcs(body));
  const att = signature?.attestation;
  if (!att || typeof signature?.sig_ed25519 !== "string") return { state: "UNSIGNED", recomputed };
  const verified = await verifyEd25519(jcs(att), signature.sig_ed25519);
  if (verified === null) return { state: "UNCHECKABLE", recomputed };
  const schemaOk = att.schema === (kind === "index" ? "csoai.rulings-index-attestation/0.1" : "csoai.ruling-attestation/0.1");
  const idOk = kind === "index" || att.ruling_id === body.ruling_id;
  if (!verified || !schemaOk || !idOk) return { state: "INVALID_SIGNATURE", recomputed };
  return { state: att.content_id === recomputed ? "VALID" : "STALE", recomputed };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });

export async function buildResponse(id: string | null) {
  const records = RULINGS as Signed[];
  if (id) {
    const r = records.find((x) => x.ruling_id === id);
    if (!r) return { status: 404, body: { error: "not_found", ruling_id: id, index: "/api/rulings" } };
    return { status: 200, body: { signature_state: (await checkSigned(r, "record")).state, record: r } };
  }
  const idx = await checkSigned(RULINGS_INDEX as Signed, "index");
  const rows = [];
  for (const r of records) rows.push({ signature_state: (await checkSigned(r, "record")).state, record: r });
  return {
    status: 200,
    body: {
      schema: "csoai.rulings-response/0.1",
      read_only: true,
      count: records.length,
      index_signature_state: idx.state,
      index: RULINGS_INDEX,
      rulings: rows,
      key: BOARD_DID,
      key_ed25519_hex: BOARD_KEY_HEX,
      how:
        "For each record and for the index: remove 'signature', canonicalise with RFC 8785 (JCS), " +
        "SHA-256 it; that must equal signature.attestation.content_id. Then verify signature.sig_ed25519 " +
        "as Ed25519 over the JCS form of signature.attestation under key_ed25519_hex, the key published " +
        "for " + BOARD_DID + " in https://csoai.org/.well-known/did.json. Both must hold for VALID.",
      doctrine:
        "A ruling decides which rule applies or whether a rule's output is served. It never sets a " +
        "measured state. The reviewer panel has not convened (panel_n_eff UNMEASURED); the owner's " +
        "ruling binds until measured panel independence reaches n_eff 2.",
      schema_url: "https://councilof.ai/schemas/csoai-ruling-0.1.schema.json",
    },
  };
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const id = new URL(request.url).searchParams.get("id");
  const { status, body } = await buildResponse(id);
  return json(body, status);
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS" } });
