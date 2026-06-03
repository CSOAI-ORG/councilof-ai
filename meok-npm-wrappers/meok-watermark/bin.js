#!/usr/bin/env node
const { spawn } = require("child_process");
const p = spawn("uvx", ["meok-watermark-attest-mcp"], { stdio: "inherit" });
p.on("error", () => { console.error("Requires 'uv' (https://docs.astral.sh/uv/). Or: pip install meok-watermark-attest-mcp"); process.exit(1); });
p.on("exit", c => process.exit(c ?? 0));
