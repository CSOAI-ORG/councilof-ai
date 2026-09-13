# TUI 4 — x402, MCP and Agent-Economy Interoperability
## Status: ACHIEVED
## Date: 2026-09-13

## Deliverables
- x402 payment executed: tx 0xeaaafb8a... on Base, 0.01 USDC, INTERNAL_SELF_FUNDED
- 14 live endpoints verified (MCP, A2A, x402, AG-UI, DID)
- 12 MCP tools (8 free + 4 paid), server v1.4.2
- A2A Agent Card v1.1.0, 7 skills
- 9 x402 resources on Base mainnet
- Layer 0 interop map (363+ surfaces)
- Settlement ledger reconciled
- OTS loop flush
- Corrections: C-2026-0913-01 (flashbots silent-index)
- Latency measurement reader

## State
- x402 e2e: COMPLETE (discovery → challenge → sign → settle → deliver → verify → receipt)
- MCP Registry: io.github.CSOAI-ORG/gspc (v1.4.0)
- npm: csoai-gspc-mcp (v0.2.1)
- External payer: 1 (0.02 USDC)

## Blockers
- npm publish: needs OIDC workflow trigger
- MCP Registry update: needs owner token

## npm Publish Attempt (2026-09-13T13:40Z)

**Triggered:** `gh workflow run npm-gspc-release.yml --ref master -f version=0.2.2`
**Result:** FAILED — E404 "not found or you do not have permission"
**Cause:** Package `csoai-gspc-mcp` may not exist on npm yet, or OIDC token lacks publish permission.
**Fix needed:** Nick must create the package on npm first, or grant publish permission to the GitHub Actions OIDC token.
**Workflow:** https://github.com/CSOAI-ORG/councilof-ai/actions/runs/34760467114
