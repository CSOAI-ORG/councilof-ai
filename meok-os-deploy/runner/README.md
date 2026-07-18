# MEOK SAP Runner — your sovereign agent, on your device, offline

Run a **Sovereign Agent Package** ([`/api/sap`](https://os.meok.ai/api/sap)) locally. It:
1. **loads** the SAP (URL or file),
2. **verifies its Ed25519 signature OFFLINE** — sovereign, no CA, no network (the moat),
3. exposes the character as a **local MCP server** any host (Claude Desktop, etc.) can use,
4. routes the brain **offline-first** to a local model (Ollama/llamafile) with **online fallback**.

## Quick start
```bash
node meok-sap-runner.mjs --sap "https://os.meok.ai/api/sap?name=Aria&archetype=dragon"
```
It prints the identity + signature status to stderr and speaks MCP JSON-RPC on stdout.

## Add to Claude Desktop (`claude_desktop_config.json`)
```json
{ "mcpServers": {
  "meok-aria": { "command": "node", "args": ["/ABS/PATH/meok-sap-runner.mjs", "--sap", "https://os.meok.ai/api/sap?name=Aria"] }
}}
```
Then in Claude: use tools `talk`, `brain_status`, `boot`, `identity`.

## Fully offline brain (the "mini-PC" moment)
```bash
# one open-source, commercial-friendly local model (MIT/Apache stack):
ollama pull llama3.2        # or qwen2.5:3b  (Apache-2.0)
```
With Ollama running, `talk` uses the **local** model (no network). Without it, it falls back to the hosted sovereign brain, then to an honest stub. Weights are never embedded — the *agent* is portable, the *model* is yours.

## What it stacks (open-source crown jewels)
- **MCP** (protocol) · **Ollama** / **llama.cpp** (MIT) · **llamafile** (Apache-2.0) for the offline brain
- **Kokoro-82M** (Apache-2.0) optional local voice · **Cesium**/**MapLibre** for the 3D body (referenced by the SAP `boot`)
- **Ed25519** (Node crypto) for sovereign offline verification — the part nobody else does

MIT. The SAP it runs is signed by the MEOK sovereign key (set `SIGIL_SEED` for your own identity).
