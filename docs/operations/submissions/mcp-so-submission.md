# mcp.so Submission — Council of AI

**To:** support@mcp.so
**Subject:** MCP Server Submission — Council of AI (councilof-ai)

## Server Details

- **Name:** Council of AI — GSPC Measurement Tools
- **Repository:** https://github.com/CSOAI-ORG/councilof-ai
- **npm package:** csoai-gspc-mcp (v0.2.4)
- **MCP endpoint:** https://councilof.ai/mcp (streamable-http)
- **Free door (no payment tool):** https://councilof.ai/mcp/free
- **stdio:** npx -y csoai-gspc-mcp@0.2.4

## Description

Independent AI-governance measurement body. 52 MCP tools:

- **47 free readers:** the 14 board readers (`board_totals`, `get_axis`, `verify_card`, `list_cards`, `get_root`, `get_card`, `verify_inclusion`, `x402_trust`, `mcp_trust`, `measurement_index`, `verify_capsule`, `server_evidence`, `evidence_bundle_preview`, `route`) plus one named reader per declared axis (`axis_<axis-id>` — 33 of them), so a caller can ask for one axis by name and get that axis's own board row back, or UNMEASURED where no published run sits behind it.
- **5 x402-metered:** `commission_card`, `art50_marking_evidence`, `rwa_evidence`, `receipts_batch`, `evidence_bundle`

Frozen item banks, published scoring code, OTS-anchored Merkle root, Rekor inclusion proofs. Measurement, not certification.

## Links

- **Live board:** https://councilof.ai/api/gspc
- **Well-known:** https://councilof.ai/.well-known/mcp.json
- **Agent card:** https://councilof.ai/.well-known/agent-card.json
- **llms.txt:** https://councilof.ai/llms.txt

## Provider

CSOAI Ltd (UK company 16939677)
https://councilof.ai

## Before sending

This is a staged draft. Nothing here has been sent. Three gates, in order:

1. `npm publish csoai-gspc-mcp@0.2.4` must succeed and `npm view csoai-gspc-mcp@0.2.4` must resolve. The stdio line installs that exact version, and only that version carries the 52 tools. **Resolving the version is not enough**: download the published tarball and compare its own manifests to the live door's `tools/list`, because a version number can resolve while carrying a different payload. That is exactly what happened to `0.2.3`, which was published 2026-10-26T07:21:23.715Z with 19 tools (14 free + 5 metered, measured from the published tarball on 2026-10-28) and resolves to this day; `0.2.3` is taken, so the fix is a new version, not a re-publish.
2. `POST https://councilof.ai/mcp` with `tools/list` must return 52 tools (47 free + 5 metered). If the live route and this draft disagree, the live route wins and this draft is wrong.
3. The counts and the tool names above are held against `functions/mcp/gspc-tools.json` and `functions/mcp/paid-tools.json` by `functions/mcp/tool-counts.test.ts`, and the npm version above is held against `mcp/gspc-server/package.json`. A fleet change turns that test red, and this draft has to be updated in the same commit.

Sending goes through the outward gate. Nothing leaves in Nick's name without it.
