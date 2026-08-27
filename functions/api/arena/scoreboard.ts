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
// GET /api/arena/scoreboard?verify=1  -> recompute sha256(canonical body), return match

const BRICK = "did:web:csoai.org#card-attestation-1";

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
    return new Response(JSON.stringify({
      content_id: hex,
      expected: board.signature.content_id,
      match: hex === board.signature.content_id,
      kid: board.signature.kid,
      note: "signature over the did:web:csoai.org key must also be checked against the published key; this recomputes the content hash only",
    }), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }

  return new Response(JSON.stringify(board), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "public, max-age=300" },
  });
}
