/**
 * GET /api/instruments — agent-readable Eunomia Router index.
 */
interface Env {}

const STATS = {
  mcpServers: 291,
  mcpRegistryCapturedAt: "2026-06-02",
  hiveFrameworks: 15,
  mcpFrameworkTags: 8,
  layers: 5,
  gspcAxesMeasured: 13,
  gspcAxesTotal: 13,
};

const LAYERS = {
  framework: { label: "Framework", eunomiaPrefix: "eunomia://safety" },
  regulation: { label: "Regulation", eunomiaPrefix: "eunomia://compliance" },
  law: { label: "Law", eunomiaPrefix: "eunomia://law" },
  benchmark: { label: "Benchmark", eunomiaPrefix: "eunomia://benchmark" },
  compute: { label: "Compute", eunomiaPrefix: "eunomia://compute" },
};

const KERNEL = [
  { id: "identity.did-verify", layer: "framework", slug: "did-verify", eunomia_uri: "eunomia://identity/did-verify", name: "Agent identity & trust", mcp_slug: "agent-identity-trust-mcp" },
  { id: "safety.care-ethics", layer: "framework", slug: "care-ethics", eunomia_uri: "eunomia://safety/care-ethics", name: "Care membrane", mcp_slug: "care-membrane-mcp" },
  { id: "consensus.bft-vote", layer: "framework", slug: "bft-vote", eunomia_uri: "eunomia://consensus/bft-vote", name: "BFT progress council", mcp_slug: "bft-progress-council-mcp" },
  { id: "compliance.iso42001", layer: "regulation", slug: "iso-42001", eunomia_uri: "eunomia://compliance/iso42001", name: "ISO 42001 AIMS", mcp_slug: "iso-42001-ai-mcp" },
  { id: "law.provenance", layer: "law", slug: "provenance", eunomia_uri: "eunomia://law/provenance", name: "Proof of AI", mcp_slug: "proofof-ai-mcp" },
];

const COMPUTE = [
  { id: "compute.local-ollama", layer: "compute", slug: "local-ollama", eunomia_uri: "eunomia://compute/local-ollama", name: "Local Ollama (DIY)", pricing: "free", endpoint: "http://localhost:11434/v1" },
  { id: "compute.runpod-hosted", layer: "compute", slug: "runpod-hosted", eunomia_uri: "eunomia://compute/runpod-hosted", name: "RunPod hosted OSS", pricing: "payg", endpoint: "POST /api/agui/session" },
  { id: "compute.payg", layer: "compute", slug: "payg", eunomia_uri: "eunomia://compute/payg", name: "PAYG agent rail", pricing: "payg", endpoint: "POST /api/assess" },
];

const EXAMPLE_ROUTE = "eunomia://muckaway.ai/uk-haulage/eu-ai-act-level-3/care-ethics-pass";

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const url = new URL(request.url);
  const layer = url.searchParams.get("layer");
  const q = url.searchParams.get("q")?.toLowerCase() ?? "";

  let routes = [...KERNEL, ...COMPUTE].map((r) => ({
    ...r,
    path: `https://councilof.ai/instruments/${r.layer}/${r.slug}`,
    views: {
      api: `https://councilof.ai/instruments/${r.layer}/${r.slug}?view=api`,
      mcp: `https://councilof.ai/instruments/${r.layer}/${r.slug}?view=mcp`,
      agui: `https://councilof.ai/instruments/${r.layer}/${r.slug}?view=agui`,
      playground: `https://councilof.ai/instruments/${r.layer}/${r.slug}?view=playground`,
    },
  }));

  if (layer) routes = routes.filter((r) => r.layer === layer);
  if (q) routes = routes.filter((r) => `${r.name} ${r.slug} ${r.eunomia_uri}`.toLowerCase().includes(q));

  const body = {
    schema: "eunomia-router/1.0",
    issuer: "Council of AI (CSOAI-ORG)",
    register: "MEASURED / UNMEASURED / REPORTED / DESIGN — never blended",
    description:
      "The OpenRouter of governance — routing table entries with optional compute backends (local Ollama, RunPod OSS, PAYG). " +
      `${STATS.mcpServers} MCP servers catalogued (${STATS.mcpRegistryCapturedAt}). ${STATS.hiveFrameworks} hive frameworks.`,
    stats: STATS,
    layers: LAYERS,
    kernel: KERNEL,
    compute_tiers: {
      diy: { uri: "eunomia://compute/local-ollama", note: "Ollama on your PC — free inference, governance routing on top" },
      hosted: { uri: "eunomia://compute/runpod-hosted", note: "RunPod GPU pods — we provision, wire AG-UI, charge per verified execution" },
      payg: { uri: "eunomia://compute/payg", note: "Trust-based billing — signed card per call, not per token" },
    },
    example_route: EXAMPLE_ROUTE,
    openrouter_contrast: {
      openrouter: "1000 cloud models, no app, no offline, token pricing, no attestation",
      eunomia: `${STATS.mcpServers} catalogued MCP routes, local OR hosted OSS, governance on every path (when wired), C2PA + DID`,
    },
    full_catalog: "https://councilof.ai/instruments",
    engine_axis: "https://councilof.ai/engine-axis",
    mcp_fleet: "https://councilof.ai/api/mcp",
    routes,
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
};
