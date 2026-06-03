#!/usr/bin/env node
const { spawn } = require("child_process");
const p = spawn("uvx", ["cra-compliance-mcp"], { stdio: "inherit" });
p.on("error", () => { console.error("Requires 'uv' (https://docs.astral.sh/uv/). Or: pip install cra-compliance-mcp"); process.exit(1); });
p.on("exit", c => process.exit(c ?? 0));
