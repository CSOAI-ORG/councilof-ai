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
}

export const INTEGRATIONS: Integration[] = [
  {
    slug: 'mcp-fleet',
    name: 'CSOAI MCP Servers (293)',
    kind: 'mcp',
    description: '293 compliance & governance MCP servers — callable per framework from any MCP client (Claude, Cursor, Kimi, A2A agents).',
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
    endpoint: 'https://app.csoai.org/agent.json',
    connect: 'GET /agent.json — the entry point for agent-engine discovery.',
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
    description: 'Issue and verify Ed25519-signed compliance attestations — provenance you can prove.',
    endpoint: 'https://meok-attestation-api.vercel.app',
    frameworks: ['eu-ai-act', 'iso-42001', 'nist-ai-rmf'],
    connect: 'POST /sign to issue an attestation; POST /verify to check one.',
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
    description: 'The live output of the daily CSOAI crawler — what changed across AI-governance sources worldwide.',
    endpoint: 'https://app.csoai.org/data/regulation-deltas.json',
    docsUrl: 'https://app.csoai.org/feed',
    connect: 'GET /data/regulation-deltas.json (refreshed daily) or watch /feed.',
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
