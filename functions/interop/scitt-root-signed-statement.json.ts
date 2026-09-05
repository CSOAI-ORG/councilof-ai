/**
 * GET /interop/scitt-root-signed-statement.json — the SCITT signed statement over root.json,
 * unsigned, computed from the committed bytes at request time.
 *
 * WHAT THIS IS NOT. Not a receipt. A SCITT receipt is issued BY a transparency service when it
 * registers a statement; this estate runs none and is registered with none, so no receipt exists
 * and this endpoint will not emit a thing shaped like one. /.well-known/scitt.json says the same
 * in its own words — implementation_status PLANNED, and door generation "must not invent a
 * measurement, evidence pack, signed statement, transparency-service receipt, or registration".
 *
 * WHY A FUNCTION AND NOT A COMMITTED FILE. root.json is republished often — its leaf count read
 * 152, 153 and 167 within one day. A committed statement would be a digest of yesterday's bytes
 * claiming to describe today's, and the only ways to stop that are a gate that reddens the
 * estate's deploy whenever another lane regenerates the root, or this: derive it from the same
 * bytes the site serves, so it cannot disagree with them. Same reason /press/ renders the object
 * /api/press.json returns rather than keeping its own copy.
 */
import root from "../../public/root.json";

// Web-standard digest: Pages Functions have no node:crypto.
async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface Root { merkle_root?: string; card_count?: number; as_of?: string; sig_ed25519?: string | null }

export async function build(rootBytes: Uint8Array, r: Root) {
  const digest = await sha256Hex(rootBytes);
  return {
    schema: "csoai.scitt-signed-statement/0.1",
    what_this_is:
      "The unsigned construction of a SCITT signed statement over https://councilof.ai/root.json. It is NOT a receipt: a receipt is issued by a transparency service on registration, and this estate neither runs one nor is registered with one.",
    what_this_is_not: [
      "Not a SCITT receipt.",
      "Not a registration, and not evidence that any transparency service has seen this statement.",
      "Not a signature: signature is null because nothing here holds the signing key.",
      "Not a claim that the measurement inside root.json is correct — a signature is an integrity claim, not a truth claim.",
    ],
    subject: "https://councilof.ai/root.json",
    protected_header: {
      alg_intended: "EdDSA",
      "content-type": "application/json",
      cwt_iss_intended: "did:web:csoai.org",
      cwt_sub: "https://councilof.ai/root.json",
    },
    payload: {
      digest_alg: "sha-256",
      digest_hex: digest,
      length_bytes: rootBytes.length,
      note: "Digest is over the exact bytes this site serves at /root.json, computed at request time. It is not a digest of a re-serialisation: re-serialising JSON changes the bytes and therefore the digest.",
    },
    artifact: {
      merkle_root: r.merkle_root ?? null,
      card_count: r.card_count ?? null,
      as_of: r.as_of ?? null,
      envelope_signature_state: r.sig_ed25519 ? "SIGNED" : "UNSIGNED",
    },
    scope:
      "A proof over these bytes covers these bytes. root.json commits to its own leaf list and nothing else: it does not anchor the signed-card index, and it does not anchor GSPC.",
    signature: null,
    registration: null,
    receipt: null,
    verify_yourself: [
      "curl -s https://councilof.ai/root.json | shasum -a 256    # must equal payload.digest_hex",
      "curl -s https://councilof.ai/interop/scitt-root-signed-statement.json | jq '{subject,payload,signature,registration,receipt}'",
    ],
  };
}

export const onRequestGet: PagesFunction = async () => {
  // Serialise exactly as the site serves root.json, then digest THOSE bytes.
  const bytes = new TextEncoder().encode(JSON.stringify(root, null, 2) + "\n");
  const body = await build(bytes, root as unknown as Root);
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" },
  });
};
