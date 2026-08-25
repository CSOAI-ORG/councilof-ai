/**
 * GET /api/indices — labour / AI-economy index register (honest).
 * GET /api/indices/:slug — single index (via query or path rewrite).
 *
 * All three ship as UNMEASURED until INDEX-METHOD + frozen bank.
 * Contextual citations only — never fuse into GSPC grades.
 */

type IndexRow = {
  slug: string;
  title: string;
  status: "UNMEASURED";
  path: string;
  candidacy: string;
  measured_score: null;
  fused_into_gspc: false;
  firewall: string;
  next_gate: string;
};

const INDICES: IndexRow[] = [
  {
    slug: "ai-economy",
    title: "AI Economy Index",
    status: "UNMEASURED",
    path: "/indices/ai-economy",
    candidacy: "slot-23-companion",
    measured_score: null,
    fused_into_gspc: false,
    firewall: "Contextual layer only — never SHA-256/Ed25519 grading input",
    next_gate: "INDEX-METHOD-0.1 → REPORTED → MEASURED after freeze",
  },
  {
    slug: "human-labour",
    title: "Human Labour Index",
    status: "UNMEASURED",
    path: "/indices/human-labour",
    candidacy: "financial-extension-candidate",
    measured_score: null,
    fused_into_gspc: false,
    firewall: "Contextual layer only — never SHA-256/Ed25519 grading input",
    next_gate: "INDEX-METHOD-0.1 → REPORTED CSV on HF → Wilson after frozen bank",
  },
  {
    slug: "humanoid-labour",
    title: "Humanoid Labour Index",
    status: "UNMEASURED",
    path: "/indices/humanoid-labour",
    candidacy: "machinery-adjacency + financial-extension-candidate",
    measured_score: null,
    fused_into_gspc: false,
    firewall: "Contextual layer only — never SHA-256/Ed25519 grading input",
    next_gate: "MachBench labour stub → REPORTED → MEASURED with separation tests",
  },
];

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const slug =
    url.searchParams.get("slug") ||
    url.pathname.replace(/^\/api\/indices\/?/, "").replace(/\/$/, "") ||
    "";

  const body =
    slug && slug !== "indices"
      ? (() => {
          const row = INDICES.find((i) => i.slug === slug);
          if (!row) {
            return {
              error: "unknown_index",
              slug,
              known: INDICES.map((i) => i.slug),
            };
          }
          return {
            schema: "csoai.labour-economy-index/0.1",
            as_of: new Date().toISOString().slice(0, 10),
            register: "UNMEASURED",
            index: row,
            note: "No measured_score. Do not treat absence as zero.",
          };
        })()
      : {
          schema: "csoai.labour-economy-index-catalog/0.1",
          as_of: new Date().toISOString().slice(0, 10),
          register: "UNMEASURED",
          count: INDICES.length,
          indices: INDICES,
          doctrine:
            "Measurement, not certification. Scores never sold. Labour/economy indices are contextual firewall layers — never GSPC cell inputs.",
          surfaces: {
            hub: "/indices",
            products: "/products",
            engine_axis: "/engine-axis",
          },
        };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60",
      "access-control-allow-origin": "*",
    },
  });
};
