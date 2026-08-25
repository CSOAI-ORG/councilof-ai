/**
 * GET /api/indices/:slug — single labour/economy index (UNMEASURED).
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

const INDICES: Record<string, IndexRow> = {
  "ai-economy": {
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
  "human-labour": {
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
  "humanoid-labour": {
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
};

export const onRequestGet: PagesFunction = async (context) => {
  const slug = String(context.params.slug || "");
  const row = INDICES[slug];
  if (!row) {
    return new Response(
      JSON.stringify({ error: "unknown_index", slug, known: Object.keys(INDICES) }, null, 2),
      { status: 404, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" } },
    );
  }
  return new Response(
    JSON.stringify(
      {
        schema: "csoai.labour-economy-index/0.1",
        as_of: new Date().toISOString().slice(0, 10),
        register: "UNMEASURED",
        index: row,
        note: "No measured_score. Do not treat absence as zero.",
      },
      null,
      2,
    ),
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=60",
        "access-control-allow-origin": "*",
      },
    },
  );
};
