# 21 — Circle Developer Grants (FORM, not email)

segment: B / D — x402 rail settling in USDC on Base; witness-my-hash; stablecoin cadence public good
status: DRAFT — HOLD until endpoint 200 · submit only AFTER one real settlement exists · nothing submitted

**Door:** https://www.circle.com/grant (read 2026-09-02): rolling; portal https://circle.questbook.app/ (page is script-rendered; form fields not read — UNVERIFIED, expect Questbook's standard project name / description / milestones / team / links); priority use cases include "Agentic economic activity (AI agent coordination and settlement)" and treasury; USDC grants in the range published on the page, milestone-based; criteria: platform alignment (USDC, Wallets, CCTP), team, traction, expanding USDC utility.
**Owner gates:** (1) do not submit until `GET https://councilof.ai/api/x402` returns 200 with `rail.mode: "live"` and one non-owner settlement exists on Base to `0x2126…ae31`; (2) USDC grant = trading income at sterling value on receipt (accountant).

## Form answers (drafted)

- **Project name:** Council of AI — signed measurement artefacts for agents, settled in USDC via x402
- **Description:** CSOAI LTD is an independent measurement body. Every read is free (board, cards, verifier, MCP tools). What an agent can buy, over HTTP 402 settled in USDC on Base, is the signed evidence of a read: a per-request evidence pack, a commissioned point-in-time attestation, a windowed slice of signed history, or inclusion of the agent's own sha256 in the next witnessed public root. No account, no API key, no subscription; the USDC lands in a self-custody wallet within one block. Never a score, rank or certificate; a payment never changes a board cell.
- **How USDC / Circle products are used:** USDC on Base is the only settlement asset (EIP-3009 `transferWithAuthorization` carried in the x402 header; facilitator settles and pays gas). USDC and EURC also appear as subjects in the free stablecoin disclosure-cadence record (https://councilof.ai/interop/stablecoin-attestation-2026-09/) — issuers are subjects, never charged.
- **Milestones:** M1 rail live with facilitator + `REVENUE_KV` and one third-party settlement published with tx hash and card sha; M2 `witness-my-hash` and the archive slice as paid x402 artefacts + paid MCP tools; M3 Bazaar/agent-directory discovery listings and a public monthly report of settled artefact counts (never revenue projections).
- **Traction:** live free surfaces (https://councilof.ai/api/gspc, /root.json, /mcp), 335 signed cards, hourly witnessed roots.
- **Team:** Nicholas Templeman, CSOAI LTD (UK 16939677), open source.
- **Links:** https://councilof.ai · https://councilof.ai/.well-known/x402.json · https://github.com/CSOAI-ORG
**Words that must not appear:** token, credit, yield, oracle, risk score, "x402 live" before it is.
