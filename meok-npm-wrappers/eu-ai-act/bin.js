#!/usr/bin/env node
// Bridges any stdio MCP client to MEOK's hosted EU AI Act compliance server (streamable-HTTP on GCP).
const { spawn } = require("child_process");
const URL = process.env.MEOK_EU_AI_ACT_URL || "https://eu-ai-act-mcp-656725981334.europe-west2.run.app/mcp";
const p = spawn("npx", ["-y", "mcp-remote", URL], { stdio: "inherit" });
p.on("exit", c => process.exit(c ?? 0));
