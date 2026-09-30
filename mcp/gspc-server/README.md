# csoai-gspc-mcp

[![npm version](https://img.shields.io/npm/v/csoai-gspc-mcp)](https://www.npmjs.com/package/csoai-gspc-mcp)
[![npm downloads](https://img.shields.io/npm/dm/csoai-gspc-mcp)](https://www.npmjs.com/package/csoai-gspc-mcp)
[![license](https://img.shields.io/npm/l/csoai-gspc-mcp)](https://github.com/CSOAI-ORG/councilof-ai/blob/master/LICENSE)


[![Live GSPC board badge — the counts are drawn live; read them from GET https://councilof.ai/api/gspc. Not a certificate. Three states only: VALID · INVALID · UNCHECKABLE.](https://councilof.ai/badge/gspc.svg)](https://councilof.ai/gspc-scoreboard)

<!-- No board totals or tool counts are typed in this README: they go stale between releases. The live board is GET https://councilof.ai/api/gspc (totals.public_count); the live tool list is tools/list. tools-match-door.test.ts fails if a count is typed here again. -->

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
| `x402_trust` | Latest x402 catalog trust snapshot: counts of correct challenges and phantom resources. A 402 is a challenge, not delivery. |
| `mcp_trust` | Latest MCP handshake census snapshot: counts only. `partial: true` whenever the enumeration did not complete — a cap-limited read is a slice, never the population. |
| `evidence_bundle_preview` | For one obligation (`article-50`, `article-53`, `dora`, `cra`) and an optional subject: the already-signed cards relevant to it and the counsel gate, answered by the HTTP door. Relevant-to, never a determination; EMPTY is an answer. Article 53 output is evidence for review, not a legal determination. |

The free tools above and the metered ones below are exactly what `tools/list` returns — ask it for
the current set rather than trusting a number in a README. `wired-tools.test.mjs` fails if a listed
tool does not run or a running tool is not listed. Axis names are resolved case-insensitively through
one alias table (`axis-aliases.json`): `governance`, `gov` and `gspc-governance` are the same axis.

The same free tools, from the same definitions file
(`functions/mcp/gspc-tools.json`), are served over HTTP at
`https://councilof.ai/mcp` (streamable HTTP, JSON-RPC 2.0 POST). Use whichever
transport your client speaks; the contracts are identical.

### The x402-metered tools

| tool | route | free path |
|---|---|---|
| `commission_card` | `/api/request-attestation` | — (a payment never mints a MEASURED cell) |
| `art50_marking_evidence` | `/api/art50/marking-evidence` | `preview: true` |
| `rwa_evidence` | `/api/rwa/evidence` | `preview: true` (unsigned state) |
| `receipts_batch` | `/api/receipts/batch` | `preview: true` (count, span, roots, batch sha256) |
| `evidence_bundle` | `/api/evidence-bundle` | `preview: true` (relevant-card count and first cards), or the free tool `evidence_bundle_preview` |

Payment travels as the **`x_payment` argument**, not as a transport header — so stdio carries these
exactly as the HTTP door does. Up to 0.1.1 this README said the opposite ("stdio has no payment header to
forward"); that was a statement about the transport, and it was wrong about the mechanism. The server
forwards your `x_payment` verbatim as the `X-PAYMENT` header on one request to `councilof.ai`. It never
authenticates, signs or invents a receipt; it only classifies the opaque response's receipt shape.
Settlement is the route's job, fail-closed.

Top-level statuses describe delivery, not settlement:

- **`PAYMENT_REQUIRED`** — the route answered 402. Following the x402 MCP transport
  (`specs/transports-v2/mcp.md`), the tool result has `isError: true`, `structuredContent` carries the
  route's `PaymentRequired` object at the top level (`x402Version`, `resource`, `accepts[]`, `extensions`)
  alongside this wrapper's fields (`status`, `settlement_state`, …), and `content[0].text` is that same
  object as JSON; the human summary is `content[1].text`. With no `x_payment`, nothing was charged by that
  request. If an authorization was presented, settlement remains `UNCONFIRMED`; inspect before signing or
  retrying. `isError` marks "not delivered yet" — it is a payment challenge, not a fault. Payment is still
  read from the `x_payment` argument; `_meta["x402/payment"]` is not read yet, so a client that sends only
  that gets the same challenge back and is charged nothing.
- **`DELIVERED`** — the route answered 2xx and returned a deliverable. Inspect `delivery_kind`:
  `PREVIEW_OR_FREE`, `DELIVERED_SETTLEMENT_UNCONFIRMED`, `DELIVERED_RECEIPT_GAP`, or
  `DELIVERED_WITH_ROUTE_RECEIPT`. `receipt_state: PRESENT_UNVERIFIED` means a JWS-shaped receipt was
  present in the route's opaque response; this wrapper has not verified it.
- **`NOT_DEPLOYED`** — the route answered 404 on this origin. Said plainly, never a fabricated result.
- **`UNREACHABLE`** / **`BAD_ARGUMENTS`** — the call could not be made. After an authorization is
  presented, a transport failure makes delivery and settlement unknown; never retry blindly.

The package does not infer settlement from a challenge, a 2xx, or its own request. It reports delivery
and the route's settlement evidence separately: a 402 is `PAYMENT_REQUIRED`, a 2xx is `DELIVERED`,
and a transport failure remains `UNREACHABLE`. A settle echo is `REPORTED_BY_ROUTE`, not independent
chain verification; a missing or unreadable signed receipt is a named gap and never a silent success.
`settlement_state` is exactly `NOT_REQUESTED`, `UNCONFIRMED`, or `REPORTED_BY_ROUTE`.
`receipt_state` on a delivered result is exactly `NOT_REQUESTED`, `ABSENT`, `MISSING`, `UNREADABLE`,
or `PRESENT_UNVERIFIED`.

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

MCP Registry name: `ai.councilof/gspc` (canonical, domain-verified). `io.github.CSOAI-ORG/gspc` is its
deprecated alias for the same door.

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

Every `tools/call` result carries a human text summary and a machine
`structuredContent` object (a payment challenge puts the challenge JSON first, see
above). Protocol versions accepted: 2024-11-05, 2025-03-26, 2025-06-18,
2025-11-25; an unknown requested version is answered with 2025-11-25.

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

- Axis aliases: `functions/mcp/axis-aliases.json` — one table for this server, the
  HTTP endpoint and the `csoai-gspc` Python client.
- Tool definitions: `functions/mcp/gspc-tools.json` — shared byte-for-byte with
  the HTTP endpoint (`functions/mcp/[[path]].ts`). Neither surface defines
  these tools anywhere else.
- Card verification: `public/signed/verify-card.mjs` — the published CLI
  verifier, imported and run as-is.
- In a repo checkout the canonical files are read directly; `npm run prepack`
  (`pack.mjs`) copies them into the tarball and refuses to pack on drift.

## Data, corrections, verification

- Live board (the data): <https://councilof.ai/api/gspc>
- Corrections ledger: <https://councilof.ai/corrections/> (JSON: <https://councilof.ai/api/corrections>)
- Verify a card, free: <https://councilof.ai/gspc-verify/>

Apache-2.0. CSOAI Ltd (UK 16939677).
