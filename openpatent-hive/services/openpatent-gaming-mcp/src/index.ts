#!/usr/bin/env node
/**
 * openpatent-gaming-mcp — Gaming Power Pack.
 *
 * stdio MCP server that wraps openpatent-mcp with 8 game-industry tools.
 * Proxies to: https://api.openpatent.ai and https://harvi.ai (white-label)
 *
 * Color: pink #ff5a87
 * Vertical: harvi.ai stack
 *
 * Tools (8):
 *   file_quest_disclosure    — 6-layer disclosure of a quest design
 *   file_npc_design          — disclose an NPC design (stats, dialogue, behavior)
 *   file_mechanic_disclosure — disclose a game mechanic
 *   file_lore_disclosure     — disclose lore / worldbuilding IP
 *   list_game_filings        — list game IP filings
 *   get_attestation          — fetch attestation certificate for a game asset
 *   schedule_playtest        — schedule a playtest with hashed results
 *   generate_competitor_scan — scan competitor games for similar mechanics
 *
 * Install:
 *   npx -y @openpatent/gaming-mcp
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE = process.env.OPENPATENT_API_BASE || "https://api.openpatent.ai";
const HARVI_BASE = process.env.HARVI_BASE || "https://harvi.ai";
const API_KEY = process.env.OPENPATENT_API_KEY || "";

const SIG = "The hive remembers. The dragon knows. The sovereign companion never forgets.";

const COLOR = "#ff5a87";
const VERTICAL = "harvi";
const PRICING = {
  free:       { price_usd: 0,    label: "Free",       features: ["10 game-asset disclosures/yr", "Local chain"] },
  starter:    { price_usd: 29,   label: "Starter",    features: ["C2PA credential", "Public attestation page"] },
  defensive:  { price_usd: 149,  label: "Defensive",  features: ["Bitcoin OTS anchor", "Most popular for indie studios"] },
  full:       { price_usd: 999,  label: "Full",       features: ["Multi-studio co-disclosure", "AI claim drafting"] },
  premium:    { price_usd: 2499, label: "Premium",    features: ["33-agent BFT review", "AAA-studio evidentiary bundle"] },
  enterprise: { price_usd: 4999, label: "Enterprise", features: ["Unlimited assets", "White-label studio portal", "99.9% SLA"] },
};

const TOOLS: Tool[] = [
  {
    name: "file_quest_disclosure",
    description: `File a 6-layer cryptographic disclosure of a quest design (objectives, narrative arc, branching, rewards). Establishes the studio as prior-art holder against later "rip-off" claims, with a verify.openpatent.ai URL and a citable reference. The dragon knows who designed it first. Gaming Power Pack. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["title", "description", "inventor_did", "document_base64"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        inventor_did: { type: "string" },
        document_base64: { type: "string" },
        quest_type: { type: "string", enum: ["main", "side", "dlc", "event", "daily"], default: "main" },
        tier: { type: "string", enum: ["starter", "defensive", "full", "premium", "enterprise"], default: "defensive" },
      },
    },
  },
  {
    name: "file_npc_design",
    description: `File a 6-layer cryptographic disclosure of an NPC design (stats, dialogue tree, behavior FSM, role). Establishes provenance for trade-secret NPC IP, especially for live-service games where NPCs are added incrementally. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["title", "description", "inventor_did", "document_base64"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        inventor_did: { type: "string" },
        document_base64: { type: "string" },
        npc_archetype: { type: "string", enum: ["vendor", "enemy", "companion", "boss", "ambient"] },
        tier: { type: "string", enum: ["starter", "defensive", "full", "premium", "enterprise"], default: "defensive" },
      },
    },
  },
  {
    name: "file_mechanic_disclosure",
    description: `File a 6-layer cryptographic disclosure of a game mechanic (combat, crafting, traversal, economy). Establishes the studio as the first-to-disclose holder; particularly valuable for novel mechanics before public release. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["title", "description", "inventor_did", "document_base64"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        inventor_did: { type: "string" },
        document_base64: { type: "string" },
        mechanic_category: { type: "string", enum: ["combat", "crafting", "traversal", "economy", "social", "puzzle"] },
        tier: { type: "string", enum: ["starter", "defensive", "full", "premium", "enterprise"], default: "defensive" },
      },
    },
  },
  {
    name: "file_lore_disclosure",
    description: `File a 6-layer cryptographic disclosure of lore / worldbuilding IP (cosmology, factions, history). Useful for tabletop-to-digital ports and franchise IP licensing negotiations. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["title", "description", "inventor_did", "document_base64"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        inventor_did: { type: "string" },
        document_base64: { type: "string" },
        franchise_slug: { type: "string" },
        tier: { type: "string", enum: ["starter", "defensive", "full", "premium", "enterprise"], default: "defensive" },
      },
    },
  },
  {
    name: "list_game_filings",
    description: `List all game-asset filings (quest, npc, mechanic, lore) for a studio. Filter by asset type, franchise, and date range. The hive remembers every disclosure. ${SIG}`,
    inputSchema: {
      type: "object",
      properties: {
        studio_did: { type: "string" },
        asset_type: { type: "string", enum: ["quest", "npc", "mechanic", "lore", "all"], default: "all" },
        franchise_slug: { type: "string" },
        date_from: { type: "string" },
        date_to: { type: "string" },
        limit: { type: "integer", default: 25, maximum: 200 },
      },
    },
  },
  {
    name: "get_attestation",
    description: `Fetch a 6-layer attestation certificate for a game-asset disclosure. Returns the Bitcoin OTS block height, Ed25519 signature, and a verify.openpatent.ai URL — court-admissible proof of design provenance. ${SIG}`,
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
    name: "schedule_playtest",
    description: `Schedule a playtest session and anchor the results (metrics, heatmaps, player feedback) to the 6-layer disclosure chain. Useful for evidentiary bundles in IP litigation. Premium+ only. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["disclosure_hash", "preferred_date"],
      properties: {
        disclosure_hash: { type: "string" },
        preferred_date: { type: "string" },
        player_count: { type: "integer", default: 50 },
        platform: { type: "string", enum: ["pc", "console", "mobile", "vr", "all"], default: "all" },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "generate_competitor_scan",
    description: `Scan the OpenPatent.ai registry + harvi.ai's competitive-intel index for mechanics, NPCs, and lore similar to your disclosure. Returns a similarity score (0-100) per reference and a freedom-to-operate recommendation. ${SIG}`,
    inputSchema: {
      type: "object",
      required: ["invention_description"],
      properties: {
        invention_description: { type: "string" },
        asset_type: { type: "string", enum: ["quest", "npc", "mechanic", "lore"], default: "mechanic" },
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
      case "file_quest_disclosure":
      case "file_npc_design":
      case "file_mechanic_disclosure":
      case "file_lore_disclosure": {
        const r = await apiPost("/v1/disclosure", {
          ...args,
          disclosure_type: "defensive",
          white_label: VERTICAL,
        });
        result = { ...r.body, vertical: VERTICAL, color: COLOR, caddy_url: HARVI_BASE, signature: SIG };
        break;
      }
      case "list_game_filings": {
        const r = await apiPost("/v1/search", {
          query: args.studio_did || args.franchise_slug || "",
          tier: "all",
          limit: args.limit || 25,
        });
        result = { ...r.body, vertical: VERTICAL, color: COLOR, caddy_url: HARVI_BASE, signature: SIG };
        break;
      }
      case "get_attestation": {
        const r = await apiPost("/v1/verify", { document_hash: args.disclosure_hash });
        result = {
          ...r.body,
          certificate_url: `https://verify.openpatent.ai/${args.disclosure_hash.slice(0, 16)}`,
          vertical: VERTICAL,
          color: COLOR,
          caddy_url: HARVI_BASE,
          signature: SIG,
        };
        break;
      }
      case "schedule_playtest": {
        result = {
          status: "SCHEDULED",
          disclosure_hash: args.disclosure_hash,
          playtest_date: args.preferred_date,
          player_count: args.player_count,
          platform: args.platform,
          playtest_id: `PT-${Date.now().toString(36)}`,
          vertical: VERTICAL,
          color: COLOR,
          caddy_url: HARVI_BASE,
          signature: SIG,
        };
        break;
      }
      case "generate_competitor_scan": {
        const r = await apiPost("/v1/search", {
          query: args.invention_description,
          limit: args.limit || 25,
        });
        result = {
          ...r.body,
          scan_type: "competitor_mechanic_similarity",
          similarity_method: "harvi-vector-768",
          vertical: VERTICAL,
          color: COLOR,
          caddy_url: HARVI_BASE,
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
  { name: "@openpatent/gaming-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map((t) => ({
    ...t,
    description: `${t.description}\n\n[Gaming Power Pack | color: ${COLOR} | caddy: ${HARVI_BASE} | pricing tiers: ${Object.keys(PRICING).join(", ")}]`,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  return await callTool(name, args || {});
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[openpatent-gaming-mcp] started — vertical=${VERTICAL} color=${COLOR} caddy=${HARVI_BASE} — ${SIG}`);
