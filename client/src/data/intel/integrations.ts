/**
 * Protocol + Data Integrations — CSOAI's "Layer 0 connects all" surface, shown in the
 * map's Tools drawer. How external agents/systems plug into CSOAI: MCP, agent.json, A2A,
 * Ed25519 attestations, the live deltas feed, webhooks, crosswalks. Self-contained types.
 * Factual — endpoints reflect what's actually served at app.csoai.org / the platform; where an
 * exact URL is uncertain the integration is described without a fabricated endpoint.
 */

export type IntegrationKind =
  | 'mcp' | 'protocol' | 'attestation' | 'data-feed' | 'agent' | 'webhook' | 'crosswalk';

export interface Integration {
  slug: string;
  name: string;
  kind: IntegrationKind;
  description: string;
  endpoint?: string;       // real served path/URL when known
  docsUrl?: string;
  frameworks?: string[];   // framework slugs this integration serves
  connect: string;         // one-line how-to
  /**
   * Set when the capability is real but NOT published yet. An entry carrying this must not
   * carry an `endpoint`: the file's own rule is that an endpoint is something actually served,
   * and a described-but-unbuilt feed is exactly where that rule gets bent.
   */
  unavailable?: string;
}

export const INTEGRATIONS: Integration[] = [
  {
    slug: 'mcp-fleet',
    name: 'CSOAI MCP Servers (291)',
    kind: 'mcp',
    description: '291 compliance & governance MCP servers — callable per framework from any MCP client (Claude, Cursor, Kimi, A2A agents).',
    endpoint: 'https://app.csoai.org/mcp',
    docsUrl: 'https://app.csoai.org/mcp',
    frameworks: ['eu-ai-act', 'nist-ai-rmf', 'iso-42001', 'dora', 'nis2', 'gdpr', 'cra'],
    connect: 'Add the CSOAI MCP server to your MCP client to call compliance tools as functions.',
  },
  {
    slug: 'mcp-registry',
    name: 'MCP Registry',
    kind: 'protocol',
    description: 'The discoverable catalogue of CSOAI MCP servers, machine-readable for autonomous agents.',
    endpoint: 'https://app.csoai.org/.well-known/mcp.json',
    connect: 'GET /.well-known/mcp.json to enumerate every available MCP server.',
  },
  {
    slug: 'agent-json',
    name: 'agent.json (AEO)',
    kind: 'agent',
    description: 'The agent/AEO descriptor that lets autonomous agents understand and act on CSOAI capabilities.',
    // https://app.csoai.org/agent.json returned 404 when probed 2026-09-05. The descriptor
    // that IS served is the A2A agent card, which also declares `explicitly_not`.
    endpoint: 'https://councilof.ai/.well-known/agent-card.json',
    connect: 'GET /.well-known/agent-card.json — the entry point for agent discovery.',
  },
  {
    slug: 'a2a-protocol',
    name: 'Agent-to-Agent (A2A)',
    kind: 'protocol',
    description: 'Agent-to-agent negotiation, handoff and delegation of compliance tasks between systems.',
    connect: 'Use the A2A handoff/delegation MCP servers to pass compliance tasks between agents.',
  },
  {
    slug: 'attestation-api',
    name: 'Ed25519 Attestation API',
    kind: 'attestation',
    // Was https://meok-attestation-api.vercel.app, which answered 402 when probed
    // 2026-09-05 — Vercel was unlinked from this estate on 2026-08-31 and every leftover host
    // 402s. "POST /sign to issue an attestation" was wrong twice over: the host was dead, and
    // nothing here issues an attestation on request. Verification is free and always will be;
    // commissioning is the x402 rail, which answers a 402 challenge, not a signature.
    description: 'Check any signed card against the Ed25519-signed public Merkle root. Verification is free; a grade is never sold.',
    endpoint: 'https://councilof.ai/api/proof',
    frameworks: ['eu-ai-act', 'iso-42001', 'nist-ai-rmf'],
    connect: 'GET /api/proof?sha=<64-hex> for a free inclusion proof. Commissioning a new card is the x402 rail at GET /api/request-attestation, which answers with a 402 payment challenge.',
  },
  {
    slug: 'layer-0',
    name: 'Layer 0 Trust Substrate',
    kind: 'protocol',
    description: 'The connective layer: every regulation, company, tool and attestation is an addressable, attestable node.',
    connect: 'Reference any node by its Layer-0 id (reg:… / ent:… / mcp:…) across the platform.',
  },
  {
    slug: 'regulation-deltas-feed',
    name: 'Regulation Deltas Feed',
    kind: 'data-feed',
    // Probed 2026-09-05: /data/regulation-deltas.json is 404 at app.csoai.org AND at
    // councilof.ai, and no such file exists anywhere in the repository. /feed answers 200 but
    // is titled "Evidence review in progress" — a notice, not a feed. So this described a
    // "live output ... refreshed daily" that has never existed in any form. No endpoint, and
    // the state is named instead.
    description: 'Intended daily crawl of AI-governance sources — what changed, and where.',
    docsUrl: 'https://councilof.ai/feed',
    unavailable: 'Not published. No deltas file is served at any host, and /feed is a review notice rather than a feed.',
    connect: 'Nothing to call yet. When it publishes, this entry gets an endpoint.',
  },
  {
    slug: 'deadline-webhooks',
    name: 'Deadline & Delta Webhooks',
    kind: 'webhook',
    description: 'Subscribe to upcoming-deadline and regulation-change events for your jurisdictions.',
    // NOTE: subscription endpoint is provisioned per-tenant; no fixed public URL.
    connect: 'Register a webhook to receive deadline + delta notifications (per-tenant).',
  },
  {
    slug: 'crosswalks',
    name: 'Framework Crosswalks',
    kind: 'crosswalk',
    description: 'EU AI Act ⇄ NIST AI RMF ⇄ ISO 42001 (and 13+ frameworks) control mappings — comply once, satisfy many.',
    endpoint: 'https://app.csoai.org/crosswalks',
    frameworks: ['eu-ai-act', 'nist-ai-rmf', 'iso-42001'],
    connect: 'Open /crosswalks to map controls across frameworks.',
  },
  {
    slug: 'eu-ai-act-classifier',
    name: 'EU AI Act Risk Classifier',
    kind: 'data-feed',
    description: 'Free risk classifier — determine whether an AI system is prohibited, high-risk, limited or minimal.',
    endpoint: 'https://app.csoai.org/eu-ai-act-classifier',
    frameworks: ['eu-ai-act'],
    connect: 'Open /eu-ai-act-classifier and answer the scoping questions.',
  },
];

export function integrationsByKind(kind: IntegrationKind): Integration[] {
  return INTEGRATIONS.filter((i) => i.kind === kind);
}

export function integrationsForFramework(slug: string): Integration[] {
  return INTEGRATIONS.filter((i) => i.frameworks?.includes(slug));
}
