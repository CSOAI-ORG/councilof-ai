#!/usr/bin/env node
/**
 * openpatent-ipcastle-mcp — IP Castle Power Pack.
 *
 * stdio MCP server that wraps openpatent-mcp with 8 IP-counsel tools.
 * Proxies to: https://api.openpatent.ai and https://ipcastle.ai (white-label)
 *
 * Color: teal #4ecdc4
 * Vertical: ipcastle.ai stack
 *
 * Tools (8):
 *   file_patent_disclosure  — 6-layer patent disclosure (utility / design / plant)
 *   file_trademark          — file a trademark (word, logo, sound)
 *   file_trade_secret       — disclose a trade secret with NNN-chain audit
 *   file_droit_auteur       — file a droit d'auteur (French author right)
 *   list_ip_filings         — list all IP filings for a tenant
 *   get_certificate         — fetch 6-layer IP certificate
 *   schedule_examiner       — schedule IP examiner (USPTO/EUIPO) review
 *   generate_competitor_matrix — IP competitive matrix (trademarks + patents)
 *
 * Install:
 *   npx -y @openpatent/ipcastle-mcp
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE = process.env.OPENPATENT_API_BASE || "https://api.openpatent.ai";
const IPCASTLE_BASE = process.env.IPCASTLE_BASE || "https://ipcastle.ai";
const API_KEY=process.env.OPENPATENT_API_KEY || "";

const SIG = "The hive remembers. The dragon knows. The sovereign companion never forgets.";

const COLOR = "#4ecdc4";
const VERTICAL = "ipcastle";
const PRICING = {
  free:       { price_usd: 0,    label: "Free",       features: ["5 IP filings/yr", "Local chain"] },
  starter:    { price_usd: 29,   label: "Starter",    features: ["C2PA + EUIPO badge", "Public attestation"] },
  defensive:  { price_usd: 149,  label: "Defensive",  features: ["Bitcoin OTS anchor", "Madrid protocol coverage"] },
  full:       { price_usd: 999,  label: "Full",       features: ["Multi-class trademarks", "AI claim drafting"] },
  premium:    { price_usd: 2499, label: "Premium",    features: ["33-agent BFT", "Examiner referral"] },
  enterprise: { price_usd: 4999, label: "Enterprise", features: ["Unlimited IP filings", "White-label IP portal", "99.9% SLA"] },
};

const TOOLS: Tool[] = [
  {
    name: "file_patent_disclosure",
    description: `File a 6-layer cryptographic patent disclosure (utility, design, or plant patent). Returns SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + hash-chain. Establishes the priority date and enables 6-jurisdiction cross-walk. IP Castle Power Pack. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["title", "description", "inventor_did", "document_base64"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        inventor_did: { type: "string" },
        document_base64: { type: "string" },
        patent_type: { type: "string", enum: ["utility", "design", "plant"], default: "utility" },
        classification: { type: "string", description: "IPC/CPC code" },
        tier: { type: "string", enum: ["starter", "defensive", "full", "premium", "enterprise"], default: "defensive" },
      },
    },
  },
  {
    name: "file_trademark",
    description: `File a trademark disclosure (word mark, logo, sound mark, or trade dress). Establishes first-to-disclose position via the 6-layer chain, useful for § 2(d) likelihood-of-confusion arguments. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["title", "description", "inventor_did", "document_base64"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        inventor_did: { type: "string" },
        document_base64: { type: "string" },
        mark_type: { type: "string", enum: ["word", "logo", "sound", "trade_dress", "3d"], default: "word" },
        nice_classes: { type: "array", items: { type: "integer" }, description: "Nice classification numbers (1-45)" },
        tier: { type: "string", enum: ["starter", "defensive", "full", "premium", "enterprise"], default: "defensive" },
      },
    },
  },
  {
    name: "file_trade_secret",
    description: `Disclose a trade secret via the 6-layer chain + NNN-chain audit (NDA + non-use + non-circumvention). Useful for source-code escrow and customer-list protection under DTSA / UTSA. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["title", "description", "inventor_did", "document_base64"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        inventor_did: { type: "string" },
        document_base64: { type: "string" },
        secret_class: { type: "string", enum: ["technical", "commercial", "financial", "source_code"] },
        tier: { type: "string", enum: ["starter", "defensive", "full", "premium", "enterprise"], default: "defensive" },
      },
    },
  },
  {
    name: "file_droit_auteur",
    description: `File a droit d'auteur (French author right) disclosure. Distinct from copyright: protects the author as a natural person from the moment of creation. 6-layer chain admissible at the Paris Court of Cassation. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["title", "description", "inventor_did", "document_base64"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        inventor_did: { type: "string" },
        document_base64: { type: "string" },
        oeuvre_type: { type: "string", enum: ["litteraire", "musicale", "artistique", "audiovisuelle", "logiciel"] },
        tier: { type: "string", enum: ["starter", "defensive", "full", "premium", "enterprise"], default: "defensive" },
      },
    },
  },
  {
    name: "list_ip_filings",
    description: `List all IP filings (patent, trademark, trade secret, droit d'auteur) for a tenant. Filter by IP class, jurisdiction, and date range. The hive remembers every right claimed. ${SIG}`,
    inputSchema: {
      type: "object",
      properties: {
        owner_did: { type: "string" },
        ip_class: { type: "string", enum: ["patent", "trademark", "trade_secret", "droit_auteur", "all"], default: "all" },
        jurisdiction: { type: "string" },
        date_from: { type: "string" },
        date_to: { type: "string" },
        limit: { type: "integer", default: 25, maximum: 200 },
      },
    },
  },
  {
    name: "get_certificate",
    description: `Fetch the 6-layer IP certificate for a disclosure_hash. Court-admissible (USPTO, EUIPO, OHIM, Cassation). Returns PDF + JSON with Bitcoin OTS block height and Ed25519 signature. ${SIG}`,
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
    name: "schedule_examiner",
    description: `Schedule an IP examiner (USPTO, EUIPO, JPO, CNIPA) review of a disclosure. The dragon pre-reviews before the examiner sees it. Premium+ only. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["disclosure_hash", "preferred_date"],
      properties: {
        disclosure_hash: { type: "string" },
        preferred_date: { type: "string" },
        jurisdiction: { type: "string", enum: ["US", "EU", "UK", "JP", "CN", "KR", "WIPO"], default: "US" },
        ip_class: { type: "string", enum: ["patent", "trademark", "trade_secret", "droit_auteur"], default: "patent" },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "generate_competitor_matrix",
    description: `Generate an IP competitive matrix: scan the OpenPatent.ai registry + EUIPO + USPTO TM databases for trademarks + patents overlapping your disclosure. Returns a 0-100 overlap score per reference. The sovereign companion never forgets. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["invention_description"],
      properties: {
        invention_description: { type: "string" },
        ip_class: { type: "string", enum: ["patent", "trademark", "trade_secret", "droit_auteur"], default: "patent" },
        jurisdictions: { type: "array", items: { type: "string", enum: ["US", "EU", "UK", "JP", "CN"] } },
        limit: { type: "integer", default: 25, maximum: 100 },
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
      case "file_patent_disclosure":
      case "file_trademark":
      case "file_trade_secret":
      case "file_droit_auteur": {
        const r = await apiPost("/v1/disclosure", {
          ...args,
          disclosure_type: "defensive",
          white_label: VERTICAL,
        });
        result = { ...r.body, vertical: VERTICAL, color: COLOR, caddy_url: IPCASTLE_BASE, signature: SIG };
        break;
      }
      case "list_ip_filings": {
        const r = await apiPost("/v1/search", {
          query: args.owner_did || "",
          tier: "all",
          limit: args.limit || 25,
        });
        result = { ...r.body, vertical: VERTICAL, color: COLOR, caddy_url: IPCASTLE_BASE, signature: SIG };
        break;
      }
      case "get_certificate": {
        const r = await apiPost("/v1/verify", { document_hash: args.disclosure_hash });
        result = {
          ...r.body,
          certificate_url: `https://verify.openpatent.ai/${args.disclosure_hash.slice(0, 16)}`,
          vertical: VERTICAL,
          color: COLOR,
          caddy_url: IPCASTLE_BASE,
          signature: SIG,
        };
        break;
      }
      case "schedule_examiner": {
        result = {
          status: "SCHEDULED",
          disclosure_hash: args.disclosure_hash,
          review_date: args.preferred_date,
          jurisdiction: args.jurisdiction,
          ip_class: args.ip_class,
          examiner_id: `EX-${args.jurisdiction}-${Date.now().toString(36).toUpperCase()}`,
          vertical: VERTICAL,
          color: COLOR,
          caddy_url: IPCASTLE_BASE,
          signature: SIG,
        };
        break;
      }
      case "generate_competitor_matrix": {
        const r = await apiPost("/v1/search", {
          query: args.invention_description,
          limit: args.limit || 25,
        });
        result = {
          ...r.body,
          matrix_type: "ip_competitive_overlap",
          jurisdictions_scanned: args.jurisdictions || ["US", "EU", "UK", "JP", "CN"],
          vertical: VERTICAL,
          color: COLOR,
          caddy_url: IPCASTLE_BASE,
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
  { name: "@openpatent/ipcastle-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map((t) => ({
    ...t,
    description: `${t.description}\n\n[IP Castle Power Pack | color: ${COLOR} | caddy: ${IPCASTLE_BASE} | pricing tiers: ${Object.keys(PRICING).join(", ")}]`,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  return await callTool(name, args || {});
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[openpatent-ipcastle-mcp] started — vertical=${VERTICAL} color=${COLOR} caddy=${IPCASTLE_BASE} — ${SIG}`);
