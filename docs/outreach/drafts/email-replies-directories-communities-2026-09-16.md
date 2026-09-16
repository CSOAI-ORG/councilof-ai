# Paste-Ready Directory & Community Outreach (TUI 6)
## 2026-09-16

**Each block below is a complete submission note or message — paste-ready.**

---

## 11. Glama MCP directory — refresh request

**To:** Glama submission form / hello@glama.ai
**Channel:** email or web form

Subject: Refresh csoai/gspc-mcp listing — tool count is 13, not 7

Hi Glama team,

Our listing for csoai/gspc-mcp shows 7 tools. That's stale. The live
server now serves 13 tools (9 free, 4 x402-metered). The current
tools/list response from our HTTP endpoint at https://councilof.ai/mcp
confirms it.

Could you re-walk our server so the listing reflects the actual tool
count? Each tool has a one-line description in the live response.

For reference:

    curl -s -X POST https://councilof.ai/mcp \
      -H 'Content-Type: application/json' \
      -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
      | jq '.result.tools | length'
    # → 13

Tools include: board_totals, get_axis, verify_card, list_cards,
get_root, get_card, verify_inclusion, x402_trust, mcp_trust,
commission_card, art50_marking_evidence, rwa_evidence,
receipts_batch.

Thank you,
Nicholas

---
Drafted with Claude (Anthropic).
---

---

## 12. MCPMeta — new listing submission

**Channel:** MCPMeta submission form at mcpmeta.com/servers

Subject: Submit csoai/gspc — 13 MCP tools, zero dependencies

Server: csoai/gspc (npm: csoai-gspc-mcp)
Category: AI governance / measurement
URL: https://councilof.ai/mcp
Source: github.com/CSOAI-ORG/councilof-ai/tree/master/mcp/gspc-server
Description:

> An independent AI-governance measurement server: 13 tools (9 free,
> 4 x402-metered) that publish signed Ed25519 cards against 22 axes
> drawn from statute. Zero runtime dependencies. Pairs with the public
> board at https://councilof.ai/api/gspc.

Tools listed at https://councilof.ai/mcp (POST tools/list).

Verification: python3 tools/verify/csoai_verify.py <card-url> (free,
no account).

---
Drafted with Claude (Anthropic).
---

---

## 13. aiverse-ai.org — community directory submission

**Channel:** aiverse-ai.org/add-server form

Server name: CSOAI GSPC
Endpoint: https://councilof.ai/mcp
Description: Independent AI measurement body. 311 signed cards, 22
governance axes drawn from statute. Open verification at councilof.ai/gspc-verify.
Tags: governance, measurement, signed, mcp, x402, public

Submission is non-commercial. We offer measurement evidence, not AI
products.

---
Drafted with Claude (Anthropic).
---

---

## 14. Anthropic MCP community directory

**To:** forms/anthropic.com/mcp-community-directory

Subject: Submit csoai/gspc-mcp — MCP Registry ID available

MCP Registry entry: io.github.CSOAI-ORG/gspc (v1.4.x)
HTTP endpoint: https://councilof.ai/mcp
WebSocket: wss://councilof.ai/mcp
Source: https://github.com/CSOAI-ORG/councilof-ai/tree/master/mcp/gspc-server
Tools: 13 (9 free, 4 x402-metered)
Zero runtime dependencies.
Ed25519-signed response cards under did:web:csoai.org#board-attestation-1.

---
Drafted with Claude (Anthropic).
---

---

## 15. Claude Skills (Anthropic)

**To:** anthropic.com/skills/submit

Submit a CSOAI Skills manifest:

    {
      "name": "csoai-gspc-mcp",
      "version": "1.4.2",
      "endpoint": "https://councilof.ai/mcp",
      "auth": "none",
      "tools_count": 13,
      "free_tools": ["board_totals","get_axis","verify_card","list_cards","get_root","get_card","verify_inclusion","x402_trust","mcp_trust"],
      "metered_tools": ["commission_card","art50_marking_evidence","rwa_evidence","receipts_batch"],
      "source_url": "github.com/CSOAI-ORG/councilof-ai/tree/master/mcp/gspc-server",
      "license": "CC0-1.0",
      "verification": "python3 tools/verify/csoai_verify.py <card-url>"
    }

---
Drafted with Claude (Anthropic).
---

---

## 16. PulseMCP directory — list request

**To:** listing@pulsemcp.com
**Channel:** list request form

Subject: Please index csoai/gspc-mcp — 13 tools, 311 signed cards

Server: csoai/gspc-mcp
Tools: 13
Free tools: 9
Metered (x402) tools: 4
Signatures: every response is Ed25519-signed under did:web:csoai.org#board-attestation-1
License: CC0-1.0 (measurement body, not certifier)

Open verification: https://councilof.ai/gspc-verify (free, no account)

---
Drafted with Claude (Anthropic).
---

---

## 17. awesome-mcp-servers — PR description

**To:** sigstore/awesome-mcp-servers (or relevant community list)

Subject: Add CSOAI GSPC — 13 tools, signed cards

We're requesting inclusion of csoai/gspc-mcp:

- Server: csoai/gspc-mcp (MCP Registry ID: io.github.CSOAI-ORG/gspc)
- Tools: 13 (board_totals, get_axis, verify_card, list_cards, get_root, get_card, verify_inclusion, x402_trust, mcp_trust, commission_card, art50_marking_evidence, rwa_evidence, receipts_batch)
- Distinctive: every response carries Ed25519 signature and a per-card Merkle inclusion proof
- License: CC0-1.0 (measurement body, not certification)
- Source: github.com/CSOAI-ORG/councilof-ai

Note: this submission is not commercial. CSOAI is an independent
measurement body (CSOAI Ltd, UK Companies House 16939677). The board
itself is free; verification is free; only issuance of signed
certificates is metered.

---
Drafted with Claude (Anthropic).
---

---

## 18. TheConstruct / Reddit AI — engineering blog cross-post

**Title for the cross-post:** "How we measure MCP servers at protocol scale without a database"

Body:

We probe 500 internet-facing MCP servers weekly. The data is published.
The full methodology is here: https://councilof.ai/interop/mcp-trust/latest.json

The interesting engineering question: how do you store signed
measurements at scale without losing the verifiable property?
Our answer: every artifact is canonical JSON, signed at issuance,
and stored in plain JSON files. The Merkle root is the only
database. Re-derivation works without our involvement.

Read the full post: https://councilof.ai/blog/measure-mcp-at-protocol-scale

---
Drafted with Claude (Anthropic).
---

---

## 19. Cloudflare / Anthropic / Hugging Face founders/engineers — short note

**Channel:** engineering mailing list or personal X DM

Subject: signed MCP measurement corpus

We just crossed 311 signed measurement cards across 22 governance
axes, every one Ed25519-signed under a public DID. The board is
freely auditable at https://councilof.ai/api/gspc — no account, no key.
Setup is one npm install (`npx -y csoai-gspc-mcp`) to verify.

If your AI tooling team wants a third-party measurement layer for
their AI behaviour claims (instead of self-published model cards),
happy to share how the signed-card pipeline runs.

---
Drafted with Claude (Anthropic).
---

---

## 20. Hugging Face community — dataset card cross-link

**Channel:** HF Community tab on https://huggingface.co/csoai

Subject: Cross-link our MCP trust census and x402 trust census to HF datasets

Hi HF team,

We publish weekly MCP and x402 trust censuses at councilof.ai. These
could be cross-linked from the csoai HF datasets at:
  - https://huggingface.co/datasets/csoai/x402-bazaar-conformance
  - future MCP-trust dataset

Proposal: add a "See also" link on each csoai dataset card pointing
to councilof.ai/interop/<name>/latest.json, where the latest weekly
snapshot is. The HF dataset is the canonical mirror; councilof.ai is
the live endpoint.

Happy to coordinate.

---
Drafted with Claude (Anthropic).
---

---

*Each block above: paste-ready for its specific channel. Format
matters — MCPMeta wants a JSON manifest, an email needs a salutation,
a PR description needs prose. Match the channel.*
