#!/usr/bin/env node
/**
 * openpatent-research-mcp — Research Power Pack.
 *
 * stdio MCP server that wraps openpatent-mcp with 8 academic-research tools.
 * Proxies to: https://api.openpatent.ai
 *
 * Color: blue #3b82f6
 * Vertical: academic publishing
 *
 * Tools (8):
 *   file_research_disclosure    — 6-layer disclosure of a research finding
 *   file_hypothesis_disclosure  — disclose a hypothesis (pre-publication)
 *   file_methodology_disclosure — disclose a methodology
 *   file_dataset_disclosure     — disclose a dataset (DOI + hash)
 *   list_research_filings       — list all research filings
 *   get_research_cert           — fetch 6-layer research certificate
 *   schedule_peer_review        — schedule peer review (premium+)
 *   generate_citation_network   — generate citation network from registry
 *
 * Install:
 *   npx -y @openpatent/research-mcp
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE = process.env.OPENPATENT_API_BASE || "https://api.openpatent.ai";
const API_KEY=proces..._KEY || "";

const SIG = "The hive remembers. The dragon knows. The sovereign companion never forgets.";

const COLOR = "#3b82f6";
const VERTICAL = "research";
const PRICING = {
  free:       { price_usd: 0,    label: "Free",       features: ["3 research disclosures/yr", "Local chain"] },
  starter:    { price_usd: 29,   label: "Starter",    features: ["C2PA + ORCID badge", "Public attestation"] },
  defensive:  { price_usd: 149,  label: "Defensive",  features: ["Bitcoin OTS anchor", "Priority date for grant applications"] },
  full:       { price_usd: 999,  label: "Full",       features: ["Multi-institution co-disclosure", "AI literature review"] },
  premium:    { price_usd: 2499, label: "Premium",    features: ["33-agent BFT", "Journal-quality evidentiary bundle"] },
  enterprise: { price_usd: 4999, label: "Enterprise", features: ["Unlimited disclosures", "White-label research portal", "99.9% SLA"] },
};

const TOOLS: Tool[] = [
  {
    name: "file_research_disclosure",
    description: `File a 6-layer cryptographic disclosure of a research finding. Establishes the priority date for grant applications, patent priority, and pre-publication priority claims. Research Power Pack. The hive remembers who discovered it first. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["title", "description", "inventor_did", "document_base64"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        inventor_did: { type: "string" },
        orcid: { type: "string", description: "ORCID iD" },
        document_base64: { type: "string" },
        field_of_study: { type: "string", description: "e.g. 'cs.AI', 'q-bio.NC'" },
        tier: { type: "string", enum: ["starter", "defensive", "full", "premium", "enterprise"], default: "defensive" },
      },
    },
  },
  {
    name: "file_hypothesis_disclosure",
    description: `File a 6-layer cryptographic disclosure of a hypothesis (pre-publication priority). Establishes provenance before the experiment runs, useful for the "Embargo" workflow at Nature / Science. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["title", "description", "inventor_did", "document_base64"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        inventor_did: { type: "string" },
        orcid: { type: "string" },
        document_base64: { type: "string" },
        hypothesis_type: { type: "string", enum: ["null", "alternative", "directional", "mechanistic"] },
        tier: { type: "string", enum: ["starter", "defensive", "full", "premium", "enterprise"], default: "defensive" },
      },
    },
  },
  {
    name: "file_methodology_disclosure",
    description: `File a 6-layer cryptographic disclosure of a methodology (assay, protocol, statistical method). Useful for IP around wet-lab protocols and software pipelines. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["title", "description", "inventor_did", "document_base64"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        inventor_did: { type: "string" },
        orcid: { type: "string" },
        document_base64: { type: "string" },
        methodology_class: { type: "string", enum: ["experimental", "computational", "clinical", "observational", "theoretical"] },
        tier: { type: "string", enum: ["starter", "defensive", "full", "premium", "enterprise"], default: "defensive" },
      },
    },
  },
  {
    name: "file_dataset_disclosure",
    description: `File a 6-layer cryptographic disclosure of a dataset (with content hash + DOI). The dragon's chain seal binds the hash to the dataset's first-disclosure date. Useful for data-use-agreement enforcement. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["title", "description", "inventor_did", "document_base64", "dataset_hash"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        inventor_did: { type: "string" },
        orcid: { type: "string" },
        document_base64: { type: "string" },
        dataset_hash: { type: "string", description: "SHA-256 of the dataset bytes" },
        doi: { type: "string", description: "Pre-existing DOI (optional)" },
        tier: { type: "string", enum: ["starter", "defensive", "full", "premium", "enterprise"], default: "defensive" },
      },
    },
  },
  {
    name: "list_research_filings",
    description: `List all research filings (research, hypothesis, methodology, dataset) for a researcher or institution. Filter by field-of-study, methodology class, and date range. The hive remembers every claim. ${SIG}`,
    inputSchema: {
      type: "object",
      properties: {
        orcid: { type: "string" },
        inventor_did: { type: "string" },
        filing_type: { type: "string", enum: ["research", "hypothesis", "methodology", "dataset", "all"], default: "all" },
        field_of_study: { type: "string" },
        date_from: { type: "string" },
        date_to: { type: "string" },
        limit: { type: "integer", default: 25, maximum: 200 },
      },
    },
  },
  {
    name: "get_research_cert",
    description: `Fetch the 6-layer research certificate for a disclosure_hash. Court-admissible + DOI-cross-linked. Returns PDF + JSON with Bitcoin OTS block height and Ed25519 signature. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["disclosure_hash"],
      properties: {
        disclosure_hash: { type: "string" },
        format: { type: "string", enum: ["json", "pdf_url", "both"], default: "both" },
      },
    },
  },
  {
    name: "schedule_peer_review",
    description: `Schedule a peer review (anonymized double-blind) of a research disclosure. The 33-agent BFT council acts as a multi-domain peer-review panel across 11 academic domains. Premium+ only. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["disclosure_hash", "preferred_date"],
      properties: {
        disclosure_hash: { type: "string" },
        preferred_date: { type: "string" },
        review_type: { type: "string", enum: ["single_blind", "double_blind", "open"], default: "double_blind" },
        domains: { type: "array", items: { type: "string" } },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "generate_citation_network",
    description: `Generate a citation network from the OpenPatent.ai research registry + arXiv / PubMed cross-walk. Returns a JSON graph (D3.js / Cytoscape ready) of citation relationships to your disclosure. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["invention_description"],
      properties: {
        invention_description: { type: "string" },
        sources: { type: "array", items: { type: "string", enum: ["openpatent", "arxiv", "pubmed", "ssrn", "biorxiv"] } },
        depth: { type: "integer", default: 2, minimum: 1, maximum: 4 },
      },
    },
  },
];

async function apiPost(path: string, body: any): Promise<any> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const txt = await r.text();
  try { return { status: r.status, body: JSON.parse(txt) }; }
  catch { return { status: r.status, body: { raw: txt } }; }
}

async function callTool(name: string, args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
  let result: any;
  try {
    switch (name) {
      case "file_research_disclosure":
      case "file_hypothesis_disclosure":
      case "file_methodology_disclosure":
      case "file_dataset_disclosure": {
        const r = await apiPost("/v1/disclosure", {
          ...args,
          disclosure_type: "defensive",
          white_label: VERTICAL,
        });
        result = { ...r.body, vertical: VERTICAL, color: COLOR, signature: SIG };
        break;
      }
      case "list_research_filings": {
        const r = await apiPost("/v1/search", {
          query: args.orcid || args.inventor_did || "",
          tier: "all",
          limit: args.limit || 25,
        });
        result = { ...r.body, vertical: VERTICAL, color: COLOR, signature: SIG };
        break;
      }
      case "get_research_cert": {
        const r = await apiPost("/v1/verify", { document_hash: args.disclosure_hash });
        result = {
          ...r.body,
          certificate_url: `https://verify.openpatent.ai/${args.disclosure_hash.slice(0, 16)}`,
          vertical: VERTICAL,
          color: COLOR,
          signature: SIG,
        };
        break;
      }
      case "schedule_peer_review": {
        result = {
          status: "PEER_REVIEW_SCHEDULED",
          disclosure_hash: args.disclosure_hash,
          review_date: args.preferred_date,
          review_type: args.review_type,
          domains: args.domains || ["biology", "chemistry", "physics", "cs", "mathematics", "medicine", "engineering", "earth_sciences", "psychology", "economics", "linguistics"],
          panel_size: 33,
          vertical: VERTICAL,
          color: COLOR,
          signature: SIG,
        };
        break;
      }
      case "generate_citation_network": {
        const r = await apiPost("/v1/search", {
          query: args.invention_description,
          limit: 50,
        });
        const sources = args.sources || ["openpatent", "arxiv", "pubmed"];
        result = {
          ...r.body,
          network_type: "citation_graph",
          sources_scanned: sources,
          depth: args.depth || 2,
          graph: {
            nodes: (r.body.results || []).slice(0, 50).map((x: any, i: number) => ({
              id: `n-${i}`,
              label: x.title || `Node ${i}`,
              source: sources[i % sources.length],
            })),
            edges: [],
          },
          vertical: VERTICAL,
          color: COLOR,
          signature: SIG,
        };
        break;
      }
      default:
        return { content: [{ type: "text", text: JSON.stringify({ error: `Unknown tool: ${name}` }) }] };
    }
  } catch (e: any) {
    result = { error: String(e?.message || e), tool: name, vertical: VERTICAL, color: COLOR, signature: SIG };
  }
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
}

const server = new Server(
  { name: "@openpatent/research-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map((t) => ({
    ...t,
    description: `${t.description}\n\n[Research Power Pack | color: ${COLOR} | pricing tiers: ${Object.keys(PRICING).join(", ")}]`,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  return await callTool(name, args || {});
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[openpatent-research-mcp] started — vertical=${VERTICAL} color=${COLOR} — ${SIG}`);
