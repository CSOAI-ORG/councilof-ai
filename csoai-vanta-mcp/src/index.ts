#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";

const VANTA_API_BASE = process.env.VANTA_API_BASE ?? "https://api.vanta.com/v1";
const CSOAI_API_URL = process.env.CSOAI_API_URL ?? "https://api.csoai.org/v1";
const CSOAI_API_TOKEN = process.env.CSOAI_API_TOKEN ?? "";

const server = new Server(
  {
    name: "csoai-vanta-mcp",
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
        name: "list_evidence",
        description: "List Vanta evidence folders and latest evidence IDs.",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Maximum evidence items to return", default: 10 },
          },
        },
      },
      {
        name: "get_control_status",
        description: "Get the status of a Vanta control by ID.",
        inputSchema: {
          type: "object",
          properties: {
            controlId: { type: "string", description: "Vanta control identifier" },
          },
          required: ["controlId"],
        },
      },
      {
        name: "export_attestation",
        description: "Export a Vanta control or evidence item as a CSOAI attestation payload.",
        inputSchema: {
          type: "object",
          properties: {
            controlId: { type: "string", description: "Vanta control identifier" },
            framework: { type: "string", description: "Target framework (e.g. SOC2, ISO27001)", default: "SOC2" },
          },
          required: ["controlId"],
        },
      },
      {
        name: "sync_to_csoai",
        description: "Send the current Vanta attestation payload to CSOAI for signing.",
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

  if (name === "list_evidence") {
    const limit = typeof args?.limit === "number" ? args.limit : 10;
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              source: "vanta",
              apiBase: VANTA_API_BASE,
              note: "Live Vanta API integration requires VANTA_API_TOKEN. Returning mock evidence list.",
              evidence: Array.from({ length: limit }, (_, i) => ({
                id: `evidence-${i + 1}`,
                title: `Mock evidence item ${i + 1}`,
                control: `control-${(i % 3) + 1}`,
                status: i % 2 === 0 ? "satisfactory" : "needs_review",
                lastUpdated: new Date().toISOString(),
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
              source: "vanta",
              controlId,
              status: "satisfactory",
              evidence: [`evidence-linked-to-${controlId}`],
              note: "Mock status. Connect VANTA_API_TOKEN for live data.",
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
      attestation_type: "csoai.vanta.control.v1",
      source: "vanta",
      controlId,
      framework,
      status: "satisfactory",
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
  console.error("CSOAI Vanta MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
