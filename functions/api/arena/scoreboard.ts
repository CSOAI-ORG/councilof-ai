// functions/api/arena/scoreboard.ts — serve the SIGNED per-axis Elo leaderboard.
//
// Source: the A100 pod's arena-auto-loop publishes /workspace/arena_scoreboard.json
// (content_id + Ed25519, did:web:csoai.org#card-attestation-1). arena-scoreboard-sync.sh
// copies it to the repo's public/signed/ so this function serves the already-signed
// artifact (it never re-signs on the Mac). Mirrors the rounds.jsonl.js proxy pattern
// (read the published static feed, don't re-export).
//
// The distinguishing claim vs OpenRouter (usage rank, no provenance) and LMArena (crowd
// Elo, no verify path): every score carries n and CI; a thin-n axis is reported honest
// ("not sufficient to rank"), never invented. Measurement-not-certification.
//
// GET /api/arena/scoreboard           -> full signed per-axis leaderboard
// GET /api/arena/scoreboard?verify=1  -> recompute the content hash AND verify
//                                        Ed25519(content_id ASCII) against the pinned key

const BRICK = "did:web:csoai.org#card-attestation-1";
const CARD_ATTESTATION_HEX =
  "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38";

function canonize(o: unknown): string {
  if (Array.isArray(o)) return "[" + o.map(canonize).join(",") + "]";
  if (o && typeof o === "object") {
    const obj = o as Record<string, unknown>;
    return "{" + Object.keys(obj).sort().map((k) => JSON.stringify(k) + ":" + canonize(obj[k])).join(",") + "}";
  }
  if (typeof o === "number") {
    if (Number.isInteger(o)) return String(o);            // int-valued float -> int (byte-match Python)
    const s = o.toString();                               // shortest round-trip repr
    return s.includes(".") ? s : s + ".0";
  }
  return JSON.stringify(o);
}

function hexBytes(value: unknown, expectedBytes: number): Uint8Array | null {
  if (typeof value !== "string" || !new RegExp(`^[0-9a-fA-F]{${expectedBytes * 2}}$`).test(value)) {
    return null;
  }
  return Uint8Array.from(value.match(/../g) ?? [], (byte) => Number.parseInt(byte, 16));
}

async function verifyArenaSignature(contentId: string, signature: unknown, kid: unknown): Promise<boolean> {
  if (kid !== BRICK) return false;
  const publicKey = hexBytes(CARD_ATTESTATION_HEX, 32);
  const sig = hexBytes(signature, 64);
  if (!publicKey || !sig) return false;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      publicKey as unknown as BufferSource,
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    return await crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      sig as unknown as BufferSource,
      new TextEncoder().encode(contentId) as unknown as BufferSource,
    );
  } catch {
    return false;
  }
}

/** HEAD must not 404 when GET is 200 — probes and MCP hosts send HEAD first. */
export async function onRequestHead(ctx) {
  const r = await onRequestGet(ctx);
  return new Response(null, { status: r.status, headers: r.headers });
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const wantVerify = url.searchParams.get("verify") === "1";

  const target = new URL("/signed/arena_scoreboard.json", request.url);
  const res = await fetch(target, { headers: { accept: "application/json" } });
  if (!res.ok || !res.body) {
    return new Response(JSON.stringify({ error: "no signed scoreboard", detail: "signed feed not present" }),
      { status: 503, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  let board: any;
  try { board = await res.json(); } catch {
    return new Response(JSON.stringify({ error: "corrupt scoreboard", detail: "signed feed not JSON" }),
      { status: 500, headers: { "content-type": "application/json" } });
  }

  if (wantVerify && board.signature) {
    const body = Object.fromEntries(Object.entries(board).filter(([k]) => k !== "signature"));
    const canonical = canonize(body);
    const cid = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
    const hex = [...new Uint8Array(cid)].map((b) => b.toString(16).padStart(2, "0")).join("");
    const expected = typeof board.signature.content_id === "string" ? board.signature.content_id : "";
    const hashMatch = hex === expected;
    const signatureValid = hashMatch
      ? await verifyArenaSignature(hex, board.signature.sig, board.signature.kid)
      : false;
    return new Response(JSON.stringify({
      content_id: hex,
      expected,
      hash_match: hashMatch,
      signature_valid: signatureValid,
      verified: hashMatch && signatureValid,
      // Backward-compatible hash field. Consumers must use `verified` for the
      // combined trust decision; `match` alone never means signature-valid.
      match: hashMatch,
      kid: board.signature.kid,
      note: signatureValid
        ? "content hash matches and Ed25519 verifies over the content_id under the pinned card-attestation key"
        : "verification requires both hash_match and signature_valid; match alone is only content integrity",
    }), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }

  return new Response(JSON.stringify(board), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "public, max-age=300" },
  });
}
