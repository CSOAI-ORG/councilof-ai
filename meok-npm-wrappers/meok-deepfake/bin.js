#!/usr/bin/env node
const { spawn } = require("child_process");
const p = spawn("uvx", ["deepfake-detector-mcp"], { stdio: "inherit" });
p.on("error", () => { console.error("Requires uv (https://docs.astral.sh/uv/) or: pip install deepfake-detector-mcp"); process.exit(1); });
p.on("exit", c => process.exit(c ?? 0));
