/**
 * Output schemas for the self-serve RAS doors and their two free companions — one source for
 * /.well-known/x402.json (resources[].outputSchema, accepts[].outputSchema, free_doors[]) and
 * /api/x402. A schema here describes the 200 a door returns; the 402 is the x402 challenge.
 */
const receipt = {
  type: "object",
  description: "card-v0 receipt; sha256 and sig_ed25519 cover the canonical bytes (sorted keys, compact) of `payload`",
  required: ["schema", "surface", "payload", "sha256", "sig_ed25519", "unmeasured"],
  properties: {
    schema: { const: "https://councilof.ai/schema/card-v0.json" },
    surface: { type: "string" },
    subject: { type: "string" },
    as_of: { type: "string" },
    payload: { type: "object" },
    did: { type: "string" },
    sha256: { type: "string", pattern: "^[0-9a-f]{64}$" },
    sig_ed25519: { type: ["string", "null"] },
    unsigned_reason: { type: ["string", "null"] },
    unmeasured: { type: "array", items: { type: "string" } },
  },
};

const door = (schema: string, result: Record<string, unknown>) => ({
  type: "object",
  required: ["schema", "kind", "result", "receipt", "settle", "payment_changes_result", "board_effect"],
  properties: {
    schema: { const: schema },
    kind: { const: "receipt" },
    result,
    evidence: { type: "object", description: "unsigned bulk returned beside the receipt; its digest is inside result where it matters" },
    receipt,
    settle: { type: ["object", "null"], properties: { transaction: { type: ["string", "null"] }, network: { type: ["string", "null"] }, payer: { type: ["string", "null"] } } },
    payment_changes_result: { const: false },
    board_effect: { const: "none" },
  },
});

export const RAS_OUTPUT_SCHEMAS = {
  mcp_probe: door("csoai.ras.mcp-probe/0.1", {
    type: "object",
    required: ["kind", "state", "protocol", "tools", "tool_called", "fetched_at"],
    properties: {
      kind: { const: "csoai.ras.mcp-probe/0.1" },
      state: { enum: ["RESPONDED", "AUTH_REQUIRED", "NOT_MCP", "MCP_ERROR", "UNREACHABLE", "TIMEOUT"] },
      protocol: { type: "object", properties: { requested: { type: "array", items: { type: "string" } }, negotiated: { type: ["string", "null"] }, era: { enum: ["modern", "legacy", null] } } },
      tools: { type: "object", properties: { state: { enum: ["LISTED", "LIST_ERROR", "NOT_ATTEMPTED", "PARTIAL"] }, count: { type: ["integer", "null"] }, names_sha256: { type: ["string", "null"] } } },
      tool_called: { const: false },
      fetched_at: { type: "string" },
    },
  }),
  x402_check: door("csoai.ras.x402-check/0.1", {
    type: "object",
    required: ["kind", "state", "row", "rule", "fetched_at"],
    properties: {
      kind: { const: "csoai.ras.x402-check/0.1" },
      state: { enum: ["CONFORMANT", "NOT_CONFORMANT", "UNREACHABLE"] },
      row: { type: "object", description: "the census probe() row: status, payment_required_header, x402_version, has_accepts, has_bazaar_extension, header_x402_version, header_has_bazaar_extension, scheme, network, amount, conformant" },
      rule: { type: "string" },
      fetched_at: { type: "string" },
    },
  }),
  supply: door("csoai.ras.supply/0.1", {
    type: "object",
    required: ["kind", "target", "evidence_kind", "height", "fetched_at"],
    properties: {
      kind: { const: "csoai.ras.supply-read/0.1" },
      evidence_kind: { enum: ["STATE_PROOF_VERIFIED", "OPERATOR_API", "REJECTED"] },
      supply: { type: ["object", "null"], properties: { base_units: { type: "string" }, decimals: { type: "integer" }, decimal: { type: "string" } } },
      height: { type: "object" },
      proof: { type: "object" },
      fetched_at: { type: "string" },
    },
  }),
  verify: {
    type: "object",
    required: ["schema", "state", "free"],
    properties: {
      schema: { const: "csoai.verify/0.1" },
      state: { enum: ["VALID", "INVALID", "UNCHECKABLE"] },
      record_url: { type: "string" },
      fetched: { type: "object", properties: { http_status: { type: ["integer", "null"] }, bytes: { type: "integer" }, sha256: { type: ["string", "null"] } } },
      family: { type: ["string", "null"] },
      checks: { type: "array" },
      free: { const: true },
    },
  },
  x402_index: {
    type: "object",
    required: ["schema", "state", "free"],
    properties: {
      schema: { const: "csoai.x402-index/0.1" },
      state: { enum: ["SIGNED", "INDEX_PENDING", "SIGNATURE_INVALID", "UNCHECKABLE"] },
      index: { type: ["object", "null"] },
      latest_unsigned_run: { type: ["object", "null"] },
      free: { const: true },
    },
  },
} as const;
