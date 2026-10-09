# MCP.so tool discovery readback — 23 September 2026

At 06:44–06:47 UTC, the existing [CSOAI GSPC measurement listing](https://mcp.so/servers/csoai-gspc-measurement) was opened in Chrome as a visitor. It was already **Verified** and **Featured**, with correct “measurement, never certify” copy, but its Tools section said **“No tools detected.”** The listing displayed an `npx csoai-gspc-mcp` installation command and a manually written seven-tool overview.

The public **Fetch tools** button was run once. The directory reported **“Fetched 12 tools from the server”** and displayed names and descriptions including `board_totals`, `get_axis`, `verify_card`, `list_cards`, `get_root`, `get_card`, `verify_inclusion`, `x402_trust`, `commission_card`, `art50_marking_evidence`, `rwa_evidence`, and `receipts_batch`.

After reloading the page, the public Tools section still showed **12**. An unauthenticated HTTP GET from a separate process returned 200 and HTML containing `board_totals`, `x402_trust`, and `receipts_batch`, with **no** “No tools detected” string. The readback body was 107,563 bytes, SHA-256 `e621946406d2fa5cf38b2c6e60b53de81b2e4a7aa934f83d2999b585a0b64ae3`.

Independently, an anonymous JSON-RPC `tools/list` POST to `https://councilof.ai/mcp` returned HTTP 200 and an SSE tool list. This establishes discoverable tooling, **not** tool invocation, independent use, payment, or the correctness of any paid output.

Remaining mcp.so issues: the prose overview names only seven tools, and the main install panel presents the npm/stdio route rather than the canonical remote `https://councilof.ai/mcp`. Ownership editing says “Verify ownership via GitHub”; no account claim or edit was attempted because the listing already exists and GitHub ownership state is unsettled. A fresh Chrome visit to Glama's separate [connector page](https://glama.ai/mcp/connectors/io.github.CSOAI-ORG/gspc) showed **13 HTTP tools** and a last test at **2026-09-23 06:47 UTC**. An older web-search crawl saying four tools / August 24 was stale; Glama needed no refresh or correction.
