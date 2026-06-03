#!/usr/bin/env node
const { spawn } = require("child_process");
const p = spawn("uvx", ["gdpr-compliance-ai-mcp"], { stdio: "inherit" });
p.on("error", () => { console.error("Requires uv (https://docs.astral.sh/uv/) or: pip install gdpr-compliance-ai-mcp"); process.exit(1); });
p.on("exit", c => process.exit(c ?? 0));
