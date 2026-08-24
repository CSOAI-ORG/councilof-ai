/**
 * /api/* catch-all — real 404 JSON, never the SPA shell.
 * Unknown /api paths must NOT fall through to the SPA catch-all (soft-404
 * poison: crawlers and agent probes get HTML pretending to be a page).
 * Specific handlers (mcp, tools, gspc, assess…) take precedence.
 *
 * axis-register is served here inline because the standalone function file
 * has been intermittently unregistered by the Cloudflare deploy cache
 * ("0 files uploaded"), so the catch-all guarantees the honest set-boundary
 * register is ALWAYS resolvable. Mirrors /api/gspc doctrine: public board 14.
 */
const AXIS_REGISTER = {
  schema: "csoai.axis-register/0.1",
  as_of: "2026-08-22",
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
  },
  live_axes: "see /api/gspc for the per-axis measured rows",
  honesty: "https://councilof.ai/honesty",
};

export function onRequest(context) {
  const p = context.params && Array.isArray(context.params.path)
    ? context.params.path.join("/")
    : "";

  if (p === "axis-register") {
    return new Response(JSON.stringify(AXIS_REGISTER, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=300",
        "access-control-allow-origin": "*",
      },
    });
  }

  return new Response(
    JSON.stringify({
      error: "not_found",
      path: p ? `/api/${p}` : "/api",
      hint: "See the MCP registry entry io.github.CSOAI-ORG/gspc for live endpoints, or /api/mcp for the server catalogue.",
    }),
    {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    }
  );
}
