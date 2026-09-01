# csoai-gspc-mcp

Stdio MCP server for the live GSPC board and the signed measurement cards at
[councilof.ai](https://councilof.ai). Zero dependencies. Node >= 20.

**Doctrine, enforced in the tools, not just stated here:** we measure, never
certify. Verdicts are three-state — VALID / INVALID (with the reason) /
UNCHECKABLE — never two-state. An unmeasured axis is a first-class answer, not
an error and not a zero. A fetch failure is a distinct UNREACHABLE state; no
cached number is ever presented as live. Two surfaces that count the same thing
are reported as two labelled numbers and never reconciled.

## Tools

| tool | what it does |
|---|---|
| `board_totals` | Live totals from `GET https://councilof.ai/api/gspc`: slot count and measured count as two labelled numbers with their `kind` and `as_of` dates. UNREACHABLE state on fetch failure. |
| `get_axis` | One axis row from the live board: `n`, `accuracy`, `interval`, MEASURED/UNMEASURED status, dates. Args: `{ "axis": "jail" }`. |
| `verify_card` | Verify a signed `gspc.measurement-card` under the published rule — recompute the id from the canonical body, check the Ed25519 signature under the **pinned** key `did:web:csoai.org#card-attestation-1`. A card signed with its own freshly-made key is INVALID, not valid. Args: `{ "card": <object | JSON string | councilof.ai URL> }`. |
| `list_cards` | What the published index (`/signed/card_index.json`) declares next to what the card store endpoint (`/api/cards`) reports — two labelled numbers, never reconciled. Optional `axis`, `limit`. |
| `get_root` | GET `https://councilof.ai/root.json`. Three states: VALID / UNREACHABLE / UNCHECKABLE. Separate from GSPC. Never a certificate. |
| `get_card` | GET one card-v0 leaf by sha256. VALID / INVALID (not a leaf) / UNCHECKABLE (fetch failed). A 404 leaf is INVALID, not UNCHECKABLE. |
| `verify_inclusion` | GET `/api/proof?sha=`. VALID (included) / INVALID (not a leaf) / UNCHECKABLE (proof endpoint unreachable). |

The same seven tools, from the same definitions file
(`functions/mcp/gspc-tools.json`), are served over HTTP at
`https://councilof.ai/mcp` (streamable HTTP, JSON-RPC 2.0 POST). Use whichever
transport your client speaks; the contracts are identical.

## Install

Published on npm as [`csoai-gspc-mcp`](https://www.npmjs.com/package/csoai-gspc-mcp) **0.1.0** (registry live); package.json tracks **0.1.1** for the next publish. No checkout required:

```sh
npx -y csoai-gspc-mcp
```

### Claude Code

```sh
claude mcp add gspc -- npx -y csoai-gspc-mcp
```

From a checkout of the repo the server is `mcp/gspc-server/index.mjs` (no extra install).

### Claude Desktop

Add to `claude_desktop_config.json` (macOS:
`~/Library/Application Support/Claude/claude_desktop_config.json`; Windows:
`%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "gspc": {
      "command": "npx",
      "args": ["-y", "csoai-gspc-mcp"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project (or `~/.cursor/mcp.json` globally):

```json
{
  "mcpServers": {
    "gspc": {
      "command": "npx",
      "args": ["-y", "csoai-gspc-mcp"]
    }
  }
}
```

### Grok Build

```toml
[mcp_servers.gspc-npm]
command = "npx"
args = ["-y", "csoai-gspc-mcp"]
```

### Any other stdio MCP client (Grok Bot, DSH harness, your own agent)

Spawn `npx -y csoai-gspc-mcp` and speak
newline-delimited JSON-RPC 2.0 on its stdin/stdout (stderr is logs only):

1. send `{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"you","version":"0"}}}`
2. send `{"jsonrpc":"2.0","method":"notifications/initialized"}`
3. send `{"jsonrpc":"2.0","id":2,"method":"tools/list"}`
4. call tools: `{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"board_totals","arguments":{}}}`

Every `tools/call` result carries both a human `content[0].text` summary and a
machine `structuredContent` object. Protocol versions accepted: 2024-11-05,
2025-03-26, 2025-06-18.

If you cannot spawn processes, POST the same JSON-RPC bodies to
`https://councilof.ai/mcp` instead.

## Configuration

- `GSPC_ORIGIN` — override the live origin (default `https://councilof.ai`).
  Card URLs are only ever fetched from councilof.ai / csoai.org.

## Verify it yourself

```sh
node smoke.mjs
```

Real transport, no mocks: spawns the server, runs
initialize → tools/list → tools/call, then proves the three verify_card
verdicts — a genuine published card is VALID, the same card with one byte of
body changed is INVALID (id mismatch), and a forged card signed with a
freshly-generated key is INVALID (pubkey is not the published
card-attestation key) even though it is perfectly self-consistent.

## One source of truth

- Tool definitions: `functions/mcp/gspc-tools.json` — shared byte-for-byte with
  the HTTP endpoint (`functions/mcp/[[path]].ts`). Neither surface defines
  these tools anywhere else.
- Card verification: `public/signed/verify-card.mjs` — the published CLI
  verifier, imported and run as-is.
- In a repo checkout the canonical files are read directly; `npm run prepack`
  (`pack.mjs`) copies them into the tarball and refuses to pack on drift.

Apache-2.0. CSOAI Ltd (UK 16939677).
