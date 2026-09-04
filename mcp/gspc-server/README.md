# csoai-gspc-mcp

[![22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certificate. Three states only: VALID · INVALID · UNCHECKABLE.](https://councilof.ai/badge/gspc.svg)](https://councilof.ai/gspc-scoreboard)

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

Seven free tools above; five metered ones below. `tools/list` returns all twelve, and
`wired-tools.test.mjs` fails if a listed tool does not run or a running tool is not listed.

The same seven free tools, from the same definitions file
(`functions/mcp/gspc-tools.json`), are served over HTTP at
`https://councilof.ai/mcp` (streamable HTTP, JSON-RPC 2.0 POST). Use whichever
transport your client speaks; the contracts are identical.

### The five x402-metered tools — carried here since 0.2.0

| tool | route | free path |
|---|---|---|
| `commission_card` | `/api/request-attestation` | — (a payment never mints a MEASURED cell) |
| `art50_marking_evidence` | `/api/art50/marking-evidence` | `preview: true` |
| `rwa_evidence` | `/api/rwa/evidence` | `preview: true` (unsigned state) |
| `witness_hash` | `/api/witness` | — |
| `receipts_batch` | `/api/receipts/batch` | `preview: true` (count, span, roots, batch sha256) |

Payment travels as the **`x_payment` argument**, not as a transport header — so stdio carries these
exactly as the HTTP door does. Up to 0.1.1 this README said the opposite ("stdio has no payment header to
forward"); that was a statement about the transport, and it was wrong about the mechanism. The server
forwards your `x_payment` verbatim as the `X-PAYMENT` header on one request to `councilof.ai` and never
inspects, signs or invents a receipt. Settlement is the route's job, fail-closed.

Four honest statuses, and no fifth:

- **`PAYMENT_REQUIRED`** — the route answered 402. The full challenge (`accepts[]`, the `PAYMENT-REQUIRED`
  header) comes back as `structuredContent`. Nothing was charged. A challenge is an answer, not a failure.
- **`DELIVERED`** — the route answered 2xx, with the settle echo when the route sent one.
- **`NOT_DEPLOYED`** — the route answered 404 on this origin. Said plainly, never a fabricated result.
- **`UNREACHABLE`** / **`BAD_ARGUMENTS`** — the call could not be made. Nothing was charged.

**Known limitation, stated rather than hidden (2026-09-04):** the free `preview` paths and the 402
challenge work today, but **settlement on the live rail is failing** — a genuine signed EIP-3009
authorization is rejected by the facilitator with HTTP 400 after the buyer signs, because the facilitator
now advertises two x402 dialects for Base and the wrong one is being selected. The fix is written and
tested but not merged. Until it is, treat the paid paths as: challenge yes, delivery no. This server
reports what the route actually said and never converts a failed settlement into a result.

Every paid deliverable is measurement, not certification; no tool on either transport carries a trust
label; amounts appear only inside a 402 challenge.

## Install

Published on npm as [`csoai-gspc-mcp`](https://www.npmjs.com/package/csoai-gspc-mcp). No checkout required:

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
