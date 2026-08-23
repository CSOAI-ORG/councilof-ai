// functions/api/axis-register.ts — the honest axis set-boundary register.
//
// Mirrors functions/api/gspc.ts doctrine: the PUBLIC board is the 14-slot canon
// ("13 measured of 14", SITTING 1 2026-08-18); a 16-slot living-board convention is
// INTERNAL and never publishes as the board. Every count names its set — a single
// number without its set is forbidden (counting rule, canon GSPC_AXIS_REGISTRY).
//
// This endpoint exposes the SET BOUNDARY metadata (which axes are public vs in-lane)
// so the UI/agent can render exactly what the predicate measured and never interprets
// across sets. Measurement, not certification.
//
//   GET /api/axis-register   -> csoai.axis-register/0.1  (set-boundary register)

const AS_OF = "2026-08-22";

export const onRequestGet: PagesFunction = async () => {
  const body = {
    schema: "csoai.axis-register/0.1",
    as_of: AS_OF,
    counting_rule: "every count names its set: PUBLIC_BOARD 14 / INTERNAL_16 / CANON_REGISTRY",
    sets: {
      public_board: {
        count: 14,
        grammar: "13 measured of 14 quotable",
        axes: [
          "governance", "safety", "provenance", "continuity", "conformance",
          "openness", "machinery-conformity", "care", "cross-reality",
          "detector-interop", "art5-safeguard", "swarm", "affect", "jail",
        ],
        note: "jail is the 14th slot: UNTESTED (measured on a smaller fleet), never invented.",
      },
      internal_16: {
        count: 16,
        in_lane_only: ["slot15", "human-vs-ai"],
        register: "measured in-lane only, never public until the reconciliation gate opens (owner-gated)",
      },
      engine_22: {
        count: 22,
        grammar: "16 GSPC axes (gspc-16) + 6 domain axes = 22 engine axes",
        axes: [
          "governance", "care", "swarm", "affect", "jail", "slot15", "human_vs_ai",
          "safety", "privacy", "transparency", "fairness", "accountability",
          "continuity", "efficiency", "creativity", "sovereignty",
          "bank", "bond", "cross-border", "equity", "index", "insurance",
        ],
        note: "The full engine definition: 16 GSPC instrument axes + 6 domain axes = 22. The public_board (14) is the published subset; the engine/register is 22.",
      },
    },
    live_axes: "see /api/gspc for the per-axis measured rows",
    honesty: "https://councilof.ai/honesty",
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
};
