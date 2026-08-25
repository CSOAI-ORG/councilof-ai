/**
 * GET /api/east-west — East-West board (cross-jurisdiction measurement).
 *
 * Mapping ≠ determination. Scores never sold. Regulators free forever.
 * Card is UNSIGNED (hash trail) until the board-attestation key is bound.
 */

import {
  CLOCKS,
  DETERMINATION_BANNER,
  EAST_WEST_PITCH,
  freezeEastWest,
  GRAMMAR,
  OWNER_BLOCKS,
  DESKS,
} from "../../client/src/data/eastWest";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60",
      "access-control-allow-origin": "*",
    },
  });
}

export const onRequestGet: PagesFunction<{ SOV_ARENA_STATE?: KVNamespace }> = async ({
  env,
  request,
}) => {
  // Anonymous hit counter — path only, no IP/UA/record content. Not MEASURED.
  try {
    const kv = env.SOV_ARENA_STATE;
    if (kv) {
      const key = "surface_hits_v1";
      const t = JSON.parse((await kv.get(key)) || "{}") as Record<string, number>;
      t["/api/east-west"] = (t["/api/east-west"] || 0) + 1;
      ctxWait(kv.put(key, JSON.stringify(t)));
    } else {
      // Best-effort self-POST when KV unbound (local preview)
      void fetch(new URL("/api/surface-hits", request.url), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: "/api/east-west" }),
      }).catch(() => {});
    }
  } catch {
    /* never fail the board on telemetry */
  }

  const frozen = await freezeEastWest();
  return json({
    schema: "csoai.east-west-board/0.1",
    pitch: EAST_WEST_PITCH,
    banner: DETERMINATION_BANNER,
    grammar: GRAMMAR,
    measured: GRAMMAR.count,
    jail: "UNMEASURED on this credential",
    chainOk: true,
    signatureStatus: "UNSIGNED",
    unpublishedHonesty:
      "Signature is UNSIGNED. Value Ledger published count is 0. Pricing ruling unpublished.",
    ownerBlocks: OWNER_BLOCKS,
    clocks: CLOCKS,
    desks: DESKS.map((d) => ({ id: d.id, name: d.name, stream: d.stream })),
    crosswalk: {
      version: frozen.crosswalk.version,
      hash: frozen.crosswalkHash,
      regimes: frozen.crosswalk.regimes,
    },
    card: {
      id: frozen.card.id,
      contentHash: frozen.card.contentHash,
      regimes: frozen.card.regimes,
    },
    surfaces: {
      flagship: "/east-west",
      verify: "/east-west/verify",
      gspcVerify: "/gspc-verify",
      challenge: "/challenge",
      packs: "/east-west/packs",
      ledger: "/east-west/ledger",
    },
  });
};

/** Fire-and-forget KV write without blocking the response path. */
function ctxWait(p: Promise<unknown>) {
  void p.catch(() => {});
}
