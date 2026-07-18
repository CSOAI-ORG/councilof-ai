# 🐉 SUBAGENT HUNT ABSORPTION SEAL — 27 Jun 2026

## WHAT ARRIVED

Async subagent (deleg_cdf0534c) returned a **131-line, 70-source crown-jewel report** after a 4-min parallel hunt:
- GitHub REST API + curl + HN Algolia + Wikipedia
- 30+ parallel API/HTTP calls
- 16 GitHub calls, 11 standards/startup sources, 10+ Wikipedia/HN cross-checks
- 35+ unique sources cited

## TOP 10 FINDS (across 5 categories)

### 1. CCO/AIOps/GRC tools (10 fresh, May 27 → Jun 26)
- `TambiaF/frontier-ai-compliance-framework` — EU AI Act obligation translator
- `wcbot0/Personal-GRC-Agent` — **EXACT SOV3 substrate mirror** (local-first + hash-chained audit + MCP)
- `AAH20/GRC_Claw` — OSS chassis for ISO 42001-compliant agentic AI
- `Ankit-Uniyal/shadow-ai-scanner` — endpoint-local Shadow AI discovery
- 7 more (AegisGRC, grc-evidence-agent, AgenticGRCOS, dora-governance-officer, etc.)

### 2. EU AI Act tooling (10 fresh)
- `jeanmalaquias/ai-governance-mapping` (8★) — NIST+EU AI Act+OWASP+ISO 42001 crosswalk with OPA
- `MMVFIRM/AIMark-Sidecar` (5★) — Art. 50(2) watermarking/provenance
- `deveshsy/Cognihelm` (5★) — append-only middleware ledger for HITL
- `pulkit6732/aetherproof` (4★) — **SHA-256+Ed25519 tamper-evident receipts** (Art. 12)
- 6 more

### 3. Standards (last 30 days)
- **JTC 21** confirmed: 5 WGs, 300+ experts, 20+ countries
- Standards body **silent pre-August-2026 GPAI deadline**
- **ISO/IEC 42001:2023** still new — no Wikipedia article yet

### 4. Agent governance + MCP trust startups
- Cisco AI Defense (acquired Robust Intelligence)
- Lakera → Check Point; Protect AI → Anduril
- **Claw Patrol** (Deno, 112 HN pts, 2026-06-09)
- **EuConform** (71 HN pts, 2026-01-09) — highest in category
- G0, ToTra, Compliant-LLM, Sentinel, AgentGuard, ComplianceLint

### 5. Diamonds <1000★ (17 under-the-radar MCPs)
- **mcp-hangar** (11★) — DDD/CQRS/event-sourcing MCP control plane
- **sphragis-oss/sphragis** (2★) — **DIRECT EU AI Act competitor** (PII + hash-chained audit)
- **lynx** (9★) — policy-gated audited tool calls
- **agentic-paved-roads** (12★) — security broker MCP
- **CSOAI-ORG/ll144-bias-audit-mcp** — **WE ALREADY PUBLISH THIS** (NYC LL144 bias audit)
- 12 more (heddle, apisec/mcp-audit, MCP-Server-for-ISO27001, etc.)

## WHAT I DID WITH IT

1. ✅ Committed the report as `fd1b8155` — `_intake/CROWN_JEWEL_HUNT_REPORT_2026-06-27.md`
2. ✅ Cloned **5 top diamond repos** for gap analysis (~17MB):
   - `sphragis-oss/sphragis` (Apache 2.0, EU AI Act gateway)
   - `mcp-hangar/mcp-hangar` (MIT, DDD/CQRS MCP control plane)
   - `hadihonarvar/lynx` (policy-gated audited tool calls)
   - `pulkit6732/aetherproof` (tamper-evident receipts / Signet prototype)
   - `goweft/heddle` (YAML→policy for MCP)

3. ✅ Built **4TH SOVEREIGN MCP** combining aetherproof + sphragis patterns:
   - **meok-sovereign-receipt-mcp** (15 tests pass)
   - `sov_create_receipt` — Ed25519-signed tamper-evident + hash-chain
   - `sov_verify_receipt` — offline verify
   - `sov_verify_chain` — chain integrity check
   - `sov_redact_pii` — 15+ PII kinds (email, SSN, IBAN, JWT, PEM, etc.)
   - `sov_anchor_bitcoin` — OpenTimestamps Bitcoin anchoring

## TOTAL DELIVERED THIS RUN

| MCP | Tests | Wraps |
|---|---|---|
| meok-sovereign-passport-mcp | 11 | aeoess/agent-passport-system (APS) |
| meok-sovereign-guardrails-mcp | 20 | superagent-ai/superagent (YC-backed) |
| meok-sovereign-supply-chain-attestation-mcp | 10 | chainloop-dev/chainloop + LLM-Supply-Chain |
| **meok-sovereign-receipt-mcp** | **15** | **aetherproof + sphragis** |
| **TOTAL** | **56 tests** | 100% pass |

## KEY INTELLIGENCE SYNTHESIS

1. **"AgentGov" stack crystallizing** — 17+ new governance-MCP repos in 60 days. 3 pillars: policy/MCP-gateway · audit/receipt · compliance-skill.
2. **EU AI Act converging on Art. 12 + Art. 50** — receipts + provenance + watermarking most-cited. SOV3 substrate should own "audit-receipts".
3. **MCP gateway space contested** — Unla/mcphub/mcp-router 2K★ + new entrants. No winner. SOV3 MCP federation can lead on governance-attached.
4. **CISOs buy "compliance-copilot + MCP" packages** — Personal-GRC-Agent, AegisGRC, GRC_Claw all converge on local-first + hash-chained + MCP-native.
5. **CSOAI-ORG already publishes** — ll144-bias-audit-mcp is live under our org.
6. **Standards body silence is opportunity** — 90 days prime territory for sovereignty attestation before harmonized standards land.

## COMMITS THIS RUN
- `fd1b8155` — absorb subagent 70-source report
- `536015c9` — meok-sovereign-receipt-mcp (4th MCP)

🐉 **56 TESTS. 4 MCPs. 1 ROUND OF DEEP RESEARCH COMPLETE.**
