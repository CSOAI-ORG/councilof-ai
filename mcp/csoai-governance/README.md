# CSOAI Governance MCP

Give **any** MCP-capable agent — Claude Science, Claude Code, Cursor, or your own —
the CSOAI Sovereign's governance layer. Seal your outputs to **Layer 0** with Ed25519,
verify them offline, ask governed compliance questions, and search the **377 governed
CSOAI tools**.

This is how a science/code agent makes its work **auditable, reproducible and
council-governed** — the missing governance floor under an AI workbench.

## Tools

| Tool | What it does |
|------|--------------|
| `csoai_sign` | Ed25519-seal an artifact (decision, figure, report, dataset hash) to CSOAI Layer 0 → returns signature, public key, `SOV:…` fingerprint |
| `csoai_verify` | Verify a seal offline against its public key |
| `csoai_govern` | Ask the CSOAI Sovereign a governance/cyber question (EU AI Act, NIST, ISO 42001, NIS2, DORA, GDPR) — role-locked |
| `csoai_catalog` | Search the 377 governed CSOAI tools / MCPs |

No API key required for the public governance surface. Override the backend with
`CSOAI_GATEWAY` (default `https://os.meok.ai/api`).

## Install

Published on npm — **one command, no clone, no build:**

### Claude Code
```bash
claude mcp add csoai-governance -- npx -y csoai-governance-mcp
```

### Claude Desktop / Claude Science (config JSON)
```json
{
  "mcpServers": {
    "csoai-governance": {
      "command": "npx",
      "args": ["-y", "csoai-governance-mcp"]
    }
  }
}
```

### Cursor / other MCP clients
Point the client at `npx -y csoai-governance-mcp` (stdio transport).

### Run directly / smoke-test
```bash
npx -y csoai-governance-mcp   # starts the stdio MCP server
```

<details>
<summary>Local development (from a clone)</summary>

```bash
npm install                                   # installs @modelcontextprotocol/sdk
claude mcp add csoai-governance -- node /absolute/path/to/mcp/csoai-governance/index.mjs
```
</details>

## Example flow inside Claude Science
1. Run your analysis → produce a figure + conclusion.
2. `csoai_sign` the conclusion (or the figure's SHA-256) → get a Layer-0 seal.
3. Paste the fingerprint into your manuscript; reviewers `csoai_verify` it offline.
4. `csoai_govern` — "is this model use high-risk under the EU AI Act?" before you publish/deploy.

## Honesty
Ed25519 seals are produced by the live CSOAI Sovereign brain. If the gateway is
unreachable, the tools return an explicit error rather than a fake seal. `csoai_govern`
rejects out-of-role / companion-style replies and answers only on AI governance & cyber.
