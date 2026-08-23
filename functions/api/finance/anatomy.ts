/**
 * GET /api/finance/anatomy — agent-readable bond market + engine axis map.
 */
interface Env {}

const ANATOMY = {
  schema: "eunomia-finance-anatomy/1.0",
  issuer: "Council of AI (CSOAI-ORG)",
  register: "REPORTED market sizes · DESIGN scenarios · SPEC bridge repos",
  total_market_t_usd: { value: 130, register: "REPORTED" },
  thesis:
    "COBOL is honey (batch, T+2). A2A is steam (stream, T+0). Eunomia is the venturi. " +
    "CSOAI body measures and signs; MEOK head generates arena data and agent wallets.",
  gspc_core: { measured: 13, total: 13, register: "MEASURED", endpoint: "GET /api/gspc" },
  financial_axes: {
    slots: "18–25",
    count: 8,
    register: "slot 18 MEASURED (synthetic pilot) · others PLANNED / SPEC / PARTIAL / GAP",
    measured_slot_18: "GET /api/finance/bond-crossing",
    surface: "https://councilof.ai/engine-axis",
  },
  bridge_layers: ["cobol-a2a", "banks-insurance", "east-west", "stocks-bonds"],
  bridge_repos: [
    "eunomia-bond-router",
    "eunomia-insurance-engine",
    "eunomia-east-west-bridge",
    "eunomia-agent-economy",
    "eunomia-data-dao",
  ],
  layers: [
    { id: "sovereign", size_t: 60, entry: "low", register: "REPORTED" },
    { id: "ig-corp", size_t: 35, entry: "high", register: "REPORTED" },
    { id: "high-yield", size_t: 3, entry: "very-high", register: "REPORTED" },
    { id: "municipal-sme", size_t: 4, entry: "maximum", register: "REPORTED" },
    { id: "structured", size_t: 28, entry: "high", register: "REPORTED" },
  ],
  friction_vectors: 7,
  mcp_servers_catalogued: 291,
  hive_frameworks: 15,
  first_repo: { name: "CSOAI-ORG/cobol-a2a-bridge-mcp", register: "SPEC" },
  endpoints: {
    settle: "POST https://councilof.ai/api/finance/settle",
    bond_crossing: "GET https://councilof.ai/api/finance/bond-crossing",
    instruments: "GET https://councilof.ai/api/instruments",
    gspc: "GET https://councilof.ai/api/gspc",
    receipt_spec: "https://councilof.ai/receipt-spec",
    measurement_card_schema: "https://councilof.ai/.well-known/schemas/agent-measurement-card.schema.json",
  },
  surfaces: {
    engine_axis: "https://councilof.ai/engine-axis",
    venturi: "https://councilof.ai/venturi",
    legacy_bridge: "https://councilof.ai/legacy",
    insurers: "https://councilof.ai/insurers",
  },
};

export const onRequestGet: PagesFunction<Env> = async () =>
  new Response(JSON.stringify(ANATOMY, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
