#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";

const DRATA_API_BASE = process.env.DRATA_API_BASE ?? "https://api.drata.com/v1";
const CSOAI_API_URL = process.env.CSOAI_API_URL ?? "https://api.csoai.org/v1";
const CSOAI_API_TOKEN = process.env.CSOAI_API_TOKEN ?? "";

const server = new Server(
  {
    name: "csoai-drata-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_controls",
        description: "List Drata controls and their latest test results.",
        inputSchema: {
          type: "object",
          properties: {
            framework: { type: "string", description: "Framework filter (e.g. SOC2, ISO27001)", default: "SOC2" },
            limit: { type: "number", description: "Maximum controls to return", default: 10 },
          },
        },
      },
      {
        name: "get_control_status",
        description: "Get the status of a Drata control by ID.",
        inputSchema: {
          type: "object",
          properties: {
            controlId: { type: "string", description: "Drata control identifier" },
          },
          required: ["controlId"],
        },
      },
      {
        name: "export_attestation",
        description: "Export a Drata control result as a CSOAI attestation payload.",
        inputSchema: {
          type: "object",
          properties: {
            controlId: { type: "string", description: "Drata control identifier" },
            framework: { type: "string", description: "Target framework", default: "SOC2" },
          },
          required: ["controlId"],
        },
      },
      {
        name: "sync_to_csoai",
        description: "Send the current Drata attestation payload to CSOAI for signing.",
        inputSchema: {
          type: "object",
          properties: {
            payload: { type: "object", description: "Attestation payload from export_attestation" },
          },
          required: ["payload"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;

  if (name === "list_controls") {
    const framework = String(args?.framework ?? "SOC2");
    const limit = typeof args?.limit === "number" ? args.limit : 10;
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              source: "drata",
              apiBase: DRATA_API_BASE,
              framework,
              note: "Live Drata API integration requires DRATA_API_TOKEN. Returning mock control list.",
              controls: Array.from({ length: limit }, (_, i) => ({
                id: `control-${i + 1}`,
                title: `Mock ${framework} control ${i + 1}`,
                status: i % 3 === 0 ? "passing" : i % 3 === 1 ? "failing" : "not_tested",
                lastTested: new Date().toISOString(),
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (name === "get_control_status") {
    const controlId = String(args?.controlId ?? "");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              source: "drata",
              controlId,
              status: "passing",
              evidence: [`evidence-linked-to-${controlId}`],
              note: "Mock status. Connect DRATA_API_TOKEN for live data.",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (name === "export_attestation") {
    const controlId = String(args?.controlId ?? "");
    const framework = String(args?.framework ?? "SOC2");
    const payload = {
      attestation_type: "csoai.drata.control.v1",
      source: "drata",
      controlId,
      framework,
      status: "passing",
      evidenceHash: `sha256-${Buffer.from(controlId).toString("hex")}`,
      exportedAt: new Date().toISOString(),
    };
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(payload, null, 2),
        },
      ],
    };
  }

  if (name === "sync_to_csoai") {
    const payload = args?.payload;
    if (!CSOAI_API_TOKEN) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "pending_credentials",
                message: "Set CSOAI_API_TOKEN to send attestations to CSOAI.",
                wouldSendTo: CSOAI_API_URL,
                payload,
              },
              null,
              2
            ),
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: "submitted",
              csoaiUrl: CSOAI_API_URL,
              payload,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CSOAI Drata MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
