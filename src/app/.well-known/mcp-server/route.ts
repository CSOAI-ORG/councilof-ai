import { NextResponse } from "next/server";

const MCP_SERVER = {
  mcpVersion: "1.0.0",
  serverInfo: {
    name: "csoai-org",
    version: "1.0.0",
    description: "CSOAI governance and compliance substrate — AI safety certification, BFT councils, and regulation-as-code MCPs.",
  },
  capabilities: {
    tools: true,
    resources: true,
    prompts: false,
  },
  tools: [
    {
      name: "compliance-audit",
      description: "Run a CSOAI 52-Article Charter compliance audit on an AI system.",
      inputSchema: {
        type: "object",
        properties: {
          system: { type: "string", description: "Name or identifier of the AI system" },
          frameworks: {
            type: "array",
            items: { type: "string" },
            description: "Frameworks to check (e.g., eu-ai-act, iso-42001, nist-ai-rmf)",
          },
        },
        required: ["system"],
      },
    },
    {
      name: "risk-classify",
      description: "Classify an AI system under EU AI Act risk tiers (prohibited, high-risk, limited, minimal).",
      inputSchema: {
        type: "object",
        properties: {
          use_case: { type: "string", description: "Description of the AI use case" },
          sector: { type: "string", description: "Industry sector" },
        },
        required: ["use_case"],
      },
    },
  ],
  resources: [
    {
      uri: "https://csoai.org/llms.txt",
      name: "CSOAI LLMs.txt",
      description: "Discovery and capability manifest for LLM agents.",
      mimeType: "text/plain",
    },
    {
      uri: "https://csoai.org/sitemap.xml",
      name: "CSOAI Sitemap",
      description: "Index of public CSOAI pages.",
      mimeType: "application/xml",
    },
  ],
};

export async function GET() {
  return NextResponse.json(MCP_SERVER, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
