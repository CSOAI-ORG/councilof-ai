#!/usr/bin/env node
const { spawn } = require("child_process");
const p = spawn("uvx", ["dora-compliance-mcp"], { stdio: "inherit" });
p.on("error", () => { console.error("Requires 'uv' (https://docs.astral.sh/uv/). Or: pip install dora-compliance-mcp"); process.exit(1); });
p.on("exit", c => process.exit(c ?? 0));
