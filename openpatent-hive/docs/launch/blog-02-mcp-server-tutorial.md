# MCP Server Tutorial: Auto-Protect Your Code with the OpenPatent MCP

**Subtitle:** A 30-minute tutorial to get a working patent-protection MCP server running in Claude Code, Cursor, or Windsurf.

**Tags:** `mcp`, `tutorial`, `patents`, `ip-protection`, `typescript`, `opensource`

---

The Model Context Protocol (MCP) lets AI agents like Claude Code, Cursor, and Windsurf invoke external tools with a single line of config. In 30 minutes, you'll have a working setup where your AI coding assistant can cryptographically protect your inventions before you paste them into any other AI tool.

## Prerequisites

- Node.js 18+ (`node --version`)
- Claude Code, Cursor, or Windsurf installed
- An OpenPatent.ai account (free tier works for self-hosted)

## Step 1: Install the MCP server

```bash
npm install -g @openpatent/mcp-server
```

Or run without installing:

```bash
npx -y @openpatent/mcp-server
```

## Step 2: Configure your client

**Claude Code** (`~/.claude.json`):

```json
{
  "mcpServers": {
    "openpatent": {
      "command": "npx",
      "args": ["-y", "@openpatent/mcp-server"],
      "env": {
        "OPENPATENT_API_BASE": "https://api.openpatent.ai",
        "OPENPATENT_API_KEY": "op_your_api_key_here"
      }
    }
  }
}
```

**Cursor** (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "openpatent": {
      "url": "https://mcp.openpatent.ai/sse",
      "headers": { "Authorization": "Bearer op_your_api_key_here" }
    }
  }
}
```

**Windsurf** (`~/.codeium/windsurf/mcp_config.json`):

```json
{
  "mcpServers": {
    "openpatent": {
      "command": "npx",
      "args": ["-y", "@openpatent/mcp-server"]
    }
  }
}
```

## Step 3: Restart your client

Restart Claude Code, Cursor, or Windsurf. The MCP server should appear in your tool list.

## Step 4: Use it

In Claude Code:

```
You: "Protect the BFT council consensus algorithm we just wrote"
Claude: [invokes openpatent.disclose_invention]
        [returns verification URL]
```

The agent will:
1. Extract a title and description from your conversation
2. Sign with your DID (or generate a development one)
3. Hash with SHA-3/512
4. Anchor to Bitcoin via OpenTimestamps
5. Embed C2PA Content Credentials
6. Log to the hash-chained audit trail
7. Return: `attestation_url`, `bitcoin_tx`, `disclosure_hash`

The whole flow takes ~3 seconds.

## Step 5: Verify

Anyone can verify the disclosure independently:

```bash
curl https://api.openpatent.ai/v1/verify \
  -H 'Content-Type: application/json' \
  -d '{"document_hash": "d5e714244f819eca..."}'
```

Returns:
```json
{
  "all_checks_pass": true,
  "checks": ["sha3_512", "hmac", "ed25519", "ots"]
}
```

Or visit `https://verify.openpatent.ai/{hash_prefix}` in a browser.

## How it works under the hood

The MCP server (`@openpatent/mcp-server`) is a TypeScript stdio server that:

1. Listens for JSON-RPC requests on stdin
2. Routes them to 4 tools: `disclose_invention`, `verify_disclosure`, `search_prior_art`, `draft_patent_claims`
3. Forwards to `https://api.openpatent.ai` via HTTPS
4. Returns the response on stdout as newline-delimited JSON

That's it. The MCP server is a thin proxy over the openpatent.ai API.

## What the 4 tools do

| Tool | When to use it |
|---|---|
| `disclose_invention` | Submit a new invention for cryptographic protection |
| `verify_disclosure` | Verify a prior disclosure is intact |
| `search_prior_art` | Search the registry for existing prior art |
| `draft_patent_claims` | AI-assisted claim drafting (premium tier) |

## The disclosure tool in detail

```typescript
{
  title: string,             // max 200 chars
  description: string,       // max 5000 chars
  inventor_did: string,      // did:key:... or did:csoai:...
  document_base64: string,   // base64-encoded document bytes
  document_format: string,   // "pdf" | "doc" | "code" | "data" | "txt" | "md"
  classification: string,    // IPC/CPC code (e.g. "G06N7/01")
  tier: "starter" | "defensive" | "full" | "premium",  // default: "defensive"
  request_bft_review: boolean,  // premium tier only
}
```

The tool returns:

```typescript
{
  status: "DISCLOSED",
  attestation_url: "https://verify.openpatent.ai/abc123...",
  bitcoin_transaction: "0x...",
  document_hash: "d5e714244f819eca...",
  inventor_signature: "abc...",
  c2pa_credential_id: "urn:c2pa:...",
  chain_index: 42,
  fee_paid: 149.0,
  verification: { all_checks_pass: true, ... }
}
```

## Pricing

| Tier | Cost | Crypto layers |
|---|---|---|
| Free / self-hosted | $0 | 3 (hash + HMAC + Ed25519) |
| Starter | $29 | 4 (+ C2PA) |
| Defensive | $149 | 5 (+ Bitcoin OTS) |
| Full | $999 | 6 (+ 5-jurisdiction crosswalk) |
| Premium | $2,499 | 6 + 33-agent BFT council |

The free tier is fully functional self-hosted. The hosted tier is for
convenience — managed infrastructure + Bitcoin OTS submission + BFT
council review.

## Self-hosting

You can self-host the entire stack:

```bash
git clone https://github.com/CSOAI-ORG/openpatent-hive.git
cd openpatent-hive
./scripts/bring-up.sh
```

The hive runs 7 services in docker-compose:
- patentmcp (6-layer crypto core)
- api-gateway (public REST API)
- worker (Bitcoin OTS upgrade + Polygon + IPFS)
- bft-council (33-agent review)
- verify-page (verify.openpatent.ai)
- mcp-manifest (mcp.openpatent.ai)
- landing-site (Next.js 14)
- drafting-fork (TypeScript OpenPatent integration)

## Try it in 30 seconds

```bash
npx -y @openpatent/mcp-server
# Add to ~/.claude.json as shown above
# Restart Claude Code
# Ask: "Protect the algorithm we just discussed"
```

That's it. You now have cryptographic patent protection in every Claude Code session.

## Where to go from here

- [github.com/CSOAI-ORG/openpatent-mcp](https://github.com/CSOAI-ORG/openpatent-mcp) — full source
- [mcp.openpatent.ai](https://mcp.openpatent.ai) — manifest
- [openpatent.ai](https://openpatent.ai) — landing page
- [github.com/CSOAI-ORG/patentmcp](https://github.com/CSOAI-ORG/patentmcp) — Python core
- [github.com/CSOAI-ORG/openpatent-hive](https://github.com/CSOAI-ORG/openpatent-hive) — full hive

Questions? Tweet at @[csoai] or open an issue on GitHub.
