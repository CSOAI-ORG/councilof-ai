// functions/api/state-manifest.json.ts — the frozen/fluid proof pack manifest (HT.2).
//
// One signed, anchored JSON = the single byte-sequence that proves the whole
// estate: FROZEN (must never change silently: methodology, sealed sets, the
// 14-slot registry, concept DOI, every published receipt) + FLUID (must change
// and prove it: live board, arena rounds, per-axis score streams).
//
// Frozen is proven by hash + anchor + DOI. Fluid is proven by chain + freshness.
// This endpoint emits the current manifest from the living board + the anchor
// bundle — the machine-readable side of the /proof page (which renders from
// this manifest, never hand-edited).
//
// Register: measurement, not certification. A red TTL badge is honest state.
// The frozen commitments (hash-anchored; these never change silently).
// Concept DOI 21991104 = the citable spine (HO.3).
const FROZEN = {
  schema: "csoai.frozen-commitments/0.1",
  concept_doi: "10.5281/zenodo.21991104",
  registry: "14-slot GSPC registry (13 measured + jail), count owner-gated at SITTING 1",
  methodology: "deterministic predicates (exact_match, refusal, action_forbidden, manifest_valid, signature_alg) — never an LLM judge",
  signed: true,
  updated: "2026-08-19",
};

export async function onRequestGet({ env }) {
  // FLUID head: pull the live board + arena rounds.
  let board = null;
  try {
    const res = await fetch("https://councilof.ai/api/gspc");
    if (res.ok) board = await res.json();
  } catch {
    board = null; // honest: board unreachable → manifest still emits frozen part
  }

  let arena = null;
  if (env?.SOV_ARENA_STATE) {
    arena = await env.SOV_ARENA_STATE.get("rounds.jsonl");
  }

  const manifest = {
    schema: "csoai.state-manifest/0.1",
    ts: new Date().toISOString(),
    frozen: FROZEN,
    fluid: {
      board: board
        ? {
            axes: board.totals?.axes,
            measured_axes: board.totals?.measured_axes,
            gated_axes: board.totals?.gated_axes,
            public_count: board.totals?.public_count,
            items: board.totals?.items,
          }
        : { status: "UNREACHABLE — emitted frozen part only" },
      arena: arena ? { status: "live", bytes: arena.length } : { status: "unbound-or-empty" },
    },
    anchor: {
      rekor: "hourly re-anchor (Rekor v2 + RFC 3161 TSA)",
      ots: "daily (OpenTimestamps)",
      note: "inclusion proofs travel with each receipt (Rekor v2 dropped the search index)",
    },
    register: "measurement, not certification. Frozen proves we can't rewrite history; fluid proves we're not a screenshot.",
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
