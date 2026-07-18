# Fleet Dedup + "What Else To Do" — 2026-06-06
343 *-mcp packages · ~282 on PyPI · ~400 GitHub repos. (Kimi bridge was offline — KIMI_API_KEY unset — so done locally from the cluster map.)

## The "multiples" = functional overlaps to consolidate
(openmcp and mcp-scorecard are SINGLETONS — no dedup there. The real redundancy:)

| Overlap | Packages | Recommendation | Keep |
|---|---|---|---|
| **Watermarking ×3** | agent-content-watermark-mcp · meok-watermark-attest-mcp · watermarking-authenticity-mcp | Merge into one; redirect the others' READMEs to it | **meok-watermark-attest-mcp** (C2PA + HMAC, the flagship) |
| **Generic governance ×4** | a2a-governance-bridge-mcp · bft-governance-mcp · csoai-governance-crosswalk-mcp · meok-governance-engine-mcp | Consolidate the *generic* governance logic into one; keep a2a-bridge if it's genuinely A2A-specific | **meok-governance-engine-mcp** |
| **Agent-commerce ×2** | agent-commerce-payments-mcp · agent-commerce-protocol-mcp | Assess: likely merge under one AP2/x402 commerce MCP, or clearly split "payments" vs "protocol" | TBD (assess) |
| **x402 ×3** | the three x402-* payment MCPs | Assess for overlap with agent-commerce-payments; consolidate the rail | TBD (assess) |

## NOT duplicates — KEEP each (distinct value)
- **13 compliance MCPs** = distinct regulations (cqc, cra, csrd, dora, eu-ai-act, gdpr, hipaa, nis2, iso-42001, llm-compliance-comparison…). Each is its own product — KEEP all.
- **Verticals** (care/home, haulage, optometry, aquaponics, drone-airspace) = distinct markets — KEEP.
- **A2A pack** (delegation, handoff-certified, data-residency, cost-allocator, identity-trust, router, etc.) = distinct functions — KEEP.
- **Audit ×3** (agent-audit-logger vs ai-self-audit vs meok-tacho-audit/haulage) = distinct — KEEP.

## WHAT ELSE TO DO — whole fleet → top-3 standard (priority order)
1. **HYGIENE** (local gate harness + Ralph): strip the "Buy Pro" docstring injection (~260 pkgs) · fix the 6 broken-source pkgs · execute the **dedup above** (merge/redirect/deprecate).
2. **SECURITY**: extend CodeQL + Dependabot + OpenSSF Scorecard to the long tail (done on 16 flagships) · branch-protection · cosign signed-releases.
3. **METADATA / AEO**: `server.json` + `llms.txt` fleet-wide (missing on ~90%) · per-tool "## Tools" README sections · fix H1 acronym casing ("Gdpr"→"GDPR").
4. **DISTRIBUTION**: Glama + Smithery + Anthropic-registry listings · OpenMCP automation · awesome-mcp-servers PR #6285.
5. **REVENUE**: working buy links + PAYG + attestation across the sellable tier.
6. **RE-SCORE** (Scorecard) → iterate to 100 by tier: flagship 100 · mid-tier climbing · long-tail clean+importable+listed.

## Mechanism
Scorecard (measure) → gate-publisher (republish, LOCAL) → Ralph (long-tail grind) → daily routine (GitHub-side + regression guard). **Kimi bridge can be the bulk worker once `KIMI_API_KEY` is set** (set it to offload the per-package grind cheaply).
