# mcp.so Submission — Council of AI

**To:** support@mcp.so
**Subject:** MCP Server Submission — Council of AI (councilof-ai)

## Server Details

- **Name:** Council of AI — GSPC Measurement Tools
- **Repository:** https://github.com/CSOAI-ORG/councilof-ai
- **npm package:** csoai-gspc-mcp (v0.2.6)
- **MCP endpoint:** https://councilof.ai/mcp (streamable-http)
- **Free door (no payment tool):** https://councilof.ai/mcp/free
- **stdio:** npx -y csoai-gspc-mcp@0.2.6

## Description

Independent AI-governance measurement body. 55 MCP tools:

- **50 free readers:** the 15 board readers (`board_totals`, `board_counts`, `get_axis`, `verify_card`, `list_cards`, `get_root`, `get_card`, `verify_inclusion`, `x402_trust`, `mcp_trust`, `measurement_index`, `verify_capsule`, `server_evidence`, `evidence_bundle_preview`, `route`), one named reader per declared axis (`axis_<axis-id>` — 34 of them), so a caller can ask for one axis by name and get that axis's own board row back, or UNMEASURED where no published run sits behind it, and the `framework_readiness` checklist (deterministic evidence-planning over eu-ai-act, dora, nis2, gdpr, iso-27001, nist-csf, soc2, pci-dss and cra; preparation, never a determination).
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

<<<<<<< HEAD
1. `npm publish csoai-gspc-mcp@0.2.6` must succeed and `npm view csoai-gspc-mcp@0.2.6` must resolve. The stdio line installs that exact version, and only that version carries the 55 tools (the `prepack` step re-copies `functions/mcp/gspc-tools.json` at pack time, so the tarball carries the door's current list). **Resolving the version is not enough**: download the published tarball and compare its own manifests to the live door's `tools/list`, because a version number can resolve while carrying a different payload. That is exactly what happened to `0.2.4`, published 2026-10-28T16:48:34.768Z with 52 tools (47 free + 5 metered, measured from the published tarball on 2026-11-01) — it resolves to this day and is one tool short of the door, because `axis_watchdog-ingest` landed after it was published; `0.2.4` is taken, so the fix is a new version, not a re-publish. `0.2.5` is the current instance of the same trap: published 2026-11-01T15:07:36.724Z with 53 names (48 free + 5 metered, measured from the published tarball on 2026-11-03), one name short of the door's 54, because ``framework_readiness`` landed after it was published. `0.2.3` is the older instance of the same trap: published 2026-10-26T07:21:23.715Z with 19 tools (14 free + 5 metered, measured from the published tarball on 2026-10-28) and still resolves.
=======
1. The dated capture at `distribution/npm/npm-publish-check.json`, checked **2026-11-04T04:35:27.971Z**, records published `0.2.6` (published 2026-11-03T07:47:12.182Z), not deprecated, with 54 tool names (49 free + 5 metered) matching the captured HTTP door. This is a name-set comparison; it does not establish installation or runtime behaviour. **Recheck the registry and download the pinned tarball before sending**, compare its manifests with the current door's `tools/list`, and run a local install/stdio smoke check. If any check differs, update this staged draft before submission. The repository's prepared version is a separate fact and must not replace the published pin without a fresh registry capture.
>>>>>>> origin/master
2. `POST https://councilof.ai/mcp` with `tools/list` must return 54 tools (49 free + 5 metered). If the live route and this draft disagree, the live route wins and this draft is wrong.
3. The counts and the tool names above are held against `functions/mcp/gspc-tools.json` and `functions/mcp/paid-tools.json` by `functions/mcp/tool-counts.test.ts`. The npm pin and capture date are held against `distribution/npm/npm-publish-check.json`, including the captured name-set match. A new capture or fleet change requires this draft to be reviewed in the same change.

Sending goes through the outward gate. Nothing leaves in Nick's name without it.
