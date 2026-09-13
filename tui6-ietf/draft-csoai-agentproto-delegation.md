# IETF: Agent Protocol Delegation and Evidence (DRAFT — not submitted)

**Status:** Submitted to the IETF Independent Submission queue 2026-09-12; not yet published on datatracker (verified 2026-09-13). This text is the review copy.
**Date:** 2026-09-13 (v2 — stale counts replaced with live references)

## Abstract

AI agents increasingly delegate tasks to other agents via protocols like MCP (Model Context Protocol) and A2A (Agent-to-Agent). This draft examines how evidence of delegated actions can be preserved and verified.

## Protocols Covered

1. **MCP** (Model Context Protocol): Tool discovery and invocation
2. **A2A** (Agent-to-Agent): Skill-based task delegation
3. **x402**: Payment-gated resource access
4. **AP2**: Agent payment protocol (emerging)

## Evidence Chain for Delegated Actions

```
Agent A discovers tool via MCP → invokes tool → receives result
  → result includes signed receipt (Ed25519)
  → receipt is included in Merkle root
  → root is witnessed by Rekor
  → Agent B can independently verify the receipt
```

## CSOAI Implementation

- MCP tool surface: live manifest at https://councilof.ai/mcp (free read tools; paid issuance/evidence tools via x402)
- A2A Agent Card: https://councilof.ai/.well-known/agent-card.json (live, versioned)
- x402 catalog on Base mainnet (USDC): https://councilof.ai/.well-known/x402.json — one verified outside non-zero settlement as of 2026-09-13 (self-tests are labelled SELF_TEST and never counted as demand)
- Signed receipts with DID-bound Ed25519 keys
- Public Merkle root with inclusion proofs

## Open Questions

- How should MCP servers handle receipt persistence?
- What is the minimum viable evidence for a delegated action?
- How do we prevent receipt forgery across protocol boundaries?
