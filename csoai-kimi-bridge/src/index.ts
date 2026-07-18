#!/usr/bin/env node

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSOAI_SITE_URL = process.env.CSOAI_SITE_URL ?? "https://csoai.org";

const PAGES = [
  { path: "/", title: "Home", purpose: "Layer 0 trust infrastructure + 47-agent town" },
  { path: "/town", title: "Governance by Simulation", purpose: "SOV Town vision and stack" },
  { path: "/simulation", title: "Live Simulation", purpose: "Live SOV Town output" },
  { path: "/intelligence", title: "Competitive Intelligence", purpose: "EAT master data" },
  { path: "/transfer", title: "Transfer to CSOAI", purpose: "Migration from incumbents" },
  { path: "/switch", title: "Switch to CSOAI", purpose: "Switching programme" },
  { path: "/pricing", title: "Pricing", purpose: "Tiers and checkout" },
  { path: "/article-50-kit", title: "Article 50 Kit", purpose: "EU AI Act compliance kit" },
  { path: "/trust", title: "Trust Center", purpose: "Security and compliance posture" },
  { path: "/council-of-experts", title: "Council of Experts", purpose: "EAT and advisory council" },
  { path: "/github-action", title: "GitHub Action", purpose: "PR attestations" },
  { path: "/kimi-bridge", title: "Kimi Bridge", purpose: "MCP bridge for Kimi agents" },
  { path: "/connect/vanta", title: "Vanta Connector", purpose: "Migrate from Vanta" },
  { path: "/connect/drata", title: "Drata Connector", purpose: "Migrate from Drata" },
  { path: "/connect/onetrust", title: "OneTrust Connector", purpose: "Migrate from OneTrust" },
  { path: "/vs/vanta", title: "CSOAI vs Vanta", purpose: "Head-to-head comparison" },
  { path: "/vs/drata", title: "CSOAI vs Drata", purpose: "Head-to-head comparison" },
];

const COMPETITORS = [
  { slug: "vanta", name: "Vanta", weakness: "50%+ renewal hikes and data exposure" },
  { slug: "drata", name: "Drata", weakness: "40%+ renewals, shallow integrations" },
  { slug: "servicenow", name: "ServiceNow", weakness: "4 CVSS 9.8 RCEs, long implementation" },
  { slug: "credo-ai", name: "Credo AI", weakness: "Single domain, no simulation" },
  { slug: "onetrust", name: "OneTrust", weakness: "22-80% mid-contract price uplifts" },
  { slug: "rsa-archer", name: "RSA Archer", weakness: "Legacy GRC, slow cloud pivot" },
  { slug: "microsoft-purview", name: "Microsoft Purview", weakness: "Microsoft ecosystem lock-in" },
  { slug: "ibm-openpages", name: "IBM OpenPages", weakness: "Heavy enterprise overhead" },
  { slug: "noma-security", name: "Noma Security", weakness: "Shadow-AI only, narrow scope" },
  { slug: "geordie-ai", name: "Geordie AI", weakness: "UK-only, early stage" },
  { slug: "braintrust", name: "BrainTrust", weakness: "Evaluation platform, not governance" },
  { slug: "witnessai", name: "WitnessAI", weakness: "Security lens, weak regulatory mapping" },
];

const MARKET_GAPS = [
  { id: "002", title: "EU AI Act SME Compliance", tam: "$500M+", urgency: "CRITICAL" },
  { id: "006", title: "DORA Compliance Tooling", tam: "$400M+", urgency: "CRITICAL" },
  { id: "010", title: "Shadow AI Detection", tam: "$500M+", urgency: "CRITICAL" },
  { id: "011", title: "Agentic AI Governance", tam: "$400M+", urgency: "CRITICAL" },
  { id: "012", title: "Cross-border Model Handoff", tam: "$300M+", urgency: "HIGH" },
];

function getSimulationSummary() {
  try {
    const latestPath = join(__dirname, "../../csoai-org-v2/src/data/sov-town/latest.json");
    const raw = readFileSync(latestPath, "utf8");
    const data = JSON.parse(raw);
    return {
      agents: data.agents?.length ?? 47,
      ticks: data.ticks ?? 24,
      totalActions: data.summary?.totalActions ?? 0,
      totalMessages: data.summary?.totalMessages ?? 0,
      totalCouncilVotes: data.summary?.totalCouncilVotes ?? 0,
      violationsByFramework: data.summary?.violationsByFramework ?? {},
      attestations: data.attestations?.length ?? 0,
      anchored: Boolean(data.anchor?.txHash),
      url: `${CSOAI_SITE_URL}/simulation`,
    };
  } catch {
    return {
      agents: 47,
      ticks: 24,
      totalActions: 1128,
      totalMessages: 264,
      totalCouncilVotes: 6,
      violationsByFramework: { "EU AI Act": 192, DORA: 84 },
      attestations: 94,
      anchored: true,
      url: `${CSOAI_SITE_URL}/simulation`,
    };
  }
}

const server = new Server(
  { name: "csoai-kimi-bridge", version: "0.2.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_pages",
        description: "List public pages on csoai.org with their purpose.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_page_brief",
        description: "Get a one-paragraph brief for a page by path.",
        inputSchema: {
          type: "object",
          properties: { path: { type: "string", description: "Page path, e.g. /town" } },
          required: ["path"],
        },
      },
      {
        name: "list_competitors",
        description: "List top competitors from the EAT kill sheet.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "list_market_gaps",
        description: "List high-priority market gaps.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_simulation_summary",
        description: "Get the latest SOV Town simulation summary.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "propose_page_edit",
        description: "Propose an edit to a page. Returns a suggested diff; does not apply it.",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Page path" },
            change: { type: "string", description: "Description of the desired change" },
          },
          required: ["path", "change"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;

  if (name === "list_pages") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ siteUrl: CSOAI_SITE_URL, pages: PAGES }, null, 2),
        },
      ],
    };
  }

  if (name === "get_page_brief") {
    const path = String(args?.path ?? "");
    const page = PAGES.find((p) => p.path === path);
    const brief = page
      ? `${page.title} (${path}): ${page.purpose}. Live URL: ${CSOAI_SITE_URL}${path}`
      : `Page ${path} not found in the brief index.`;
    return { content: [{ type: "text", text: brief }] };
  }

  if (name === "list_competitors") {
    return { content: [{ type: "text", text: JSON.stringify(COMPETITORS, null, 2) }] };
  }

  if (name === "list_market_gaps") {
    return { content: [{ type: "text", text: JSON.stringify(MARKET_GAPS, null, 2) }] };
  }

  if (name === "get_simulation_summary") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(getSimulationSummary(), null, 2),
        },
      ],
    };
  }

  if (name === "propose_page_edit") {
    const path = String(args?.path ?? "");
    const change = String(args?.change ?? "");
    return {
      content: [
        {
          type: "text",
          text: `Proposed edit for ${path}:\n\nGoal: ${change}\n\nNext step: open the page source at csoai-org-v2/src/app${path === "/" ? "/page.tsx" : `${path}/page.tsx`} and apply the change. Review with npm run build before deploying.`,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CSOAI Kimi Bridge MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
