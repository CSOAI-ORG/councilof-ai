# CSOAI Targeted Outreach Contacts

**Generated:** 2026-09-12
**Rule:** Evidence-first contacts. No bulk email, automated DMs, or promotional bot replies. Each contact has a distinct attribution ID. Max 15 contacts.

---

## Financial Risk (5 contacts)

| ID | Sector | Target Class | Evidence Hook | Offer | Channel | State |
|----|--------|-------------|---------------|-------|---------|-------|
| CON-001 | Stablecoin risk | Exchange compliance team | RLUSD XRPL measurement (9,198 trust lines, $60.5M) | OFFER-001 + OFFER-002 | Email | PREPARED |
| CON-002 | Stablecoin risk | Custody/compliance officer | USDC/USDT/DAI on-chain measurements (5 assets) | OFFER-001 | Email | PREPARED |
| CON-003 | Tokenized funds | Fund operations team | BENJI and tokenized treasury index | OFFER-002 | Email | PREPARED |
| CON-004 | Financial data | Market data vendor | Signed correction feed, machine-readable | OFFER-001 + OFFER-006 | Email | PREPARED |
| CON-005 | Insurance | PI/cyber underwriter | 22-axis governance evidence, signed cards | OFFER-002 | Email | PREPARED |

## Data and Standards (5 contacts)

| ID | Sector | Target Class | Evidence Hook | Offer | Channel | State |
|----|--------|-------------|---------------|-------|---------|-------|
| CON-006 | Standards | BSI ART/1 contact | EU AI Act crosswalk (Art 5, 9, 15, 17, 50) | OFFER-002 | Email | PREPARED |
| CON-007 | Standards | IETF SCITT contributor | SCITT framing space draft, signed evidence | OFFER-003 | Email | PREPARED |
| CON-008 | Open data | Hugging Face dataset user | 100 datasets, 25K downloads | OFFER-FREE | HF message | PREPARED |
| CON-009 | Research | AI governance researcher | NIST AI RMF crosswalk, 417 frozen provisions | OFFER-002 | Email | PREPARED |
| CON-010 | Audit | Big 4 AI audit practice | Signed measurement cards, verification tools | OFFER-005 | Email | PREPARED |

## Agent Infrastructure (5 contacts)

| ID | Sector | Target Class | Evidence Hook | Offer | Channel | State |
|----|--------|-------------|---------------|-------|---------|-------|
| CON-011 | MCP platform | MCP registry operator | 12 tools, csoai-gspc-mcp v1.4.2 | OFFER-003 | GitHub issue | PREPARED |
| CON-012 | x402 facilitator | x402 foundation | 9 resources, Base mainnet, USDC | OFFER-003 | GitHub | PREPARED |
| CON-013 | A2A platform | A2A protocol team | Agent Card v1.1.0, signed-receipts extension | OFFER-003 | GitHub | PREPARED |
| CON-014 | AI platform | LLM provider governance team | 22-axis measurement, frozen banks, deterministic grading | OFFER-004 | Email | PREPARED |
| CON-015 | Financial infra | SWIFT/ISO 20022 contact | SWIFT 26-institution census, ISO 20022 families | OFFER-002 | Email | PREPARED |

---

## Contact Rules

1. **Evidence-first:** Every contact includes a specific, verifiable measurement or finding.
2. **No mass outreach:** Each contact is targeted to a specific person or team.
3. **No promotional language:** Technical, factual, evidence-backed.
4. **Attribution:** Every contact has a distinct ID linked to an offer and channel.
5. **Follow-up:** Only after a reply. No repeated outreach without response.
6. **Owner gate:** Do NOT send any contact without owner approval.

## Draft Messages

### CON-001 (Stablecoin risk — Exchange compliance)

**Subject:** RLUSD measurement — 9,198 trust lines on XRPL, signed evidence

**Body:**
We measured RLUSD across XRPL deployments and published signed, independently verifiable evidence. Key findings:
- 9,198 trust lines on XRPL
- ~$60.5M in circulation
- Measurement signed Ed25519, included in Merkle root, Rekor-witnessed

The measurement is available at https://councilof.ai/api/gspc and independently verifiable at https://councilof.ai/gspc-verify.

If your compliance or risk team reviews stablecoin evidence, our correction feed can track changes and corrections automatically.

[CSOAI Ltd, UK 16939677 | https://councilof.ai | Measurement, not certification]

### CON-011 (MCP platform)

**Subject:** CSOAI MCP server — 12 tools, live on councilof.ai/mcp

**Body:**
The CSOAI MCP server (csoai-gspc-mcp v1.4.2) is live at https://councilof.ai/mcp with 12 tools: 8 free (board, verify, root, cards) and 4 paid (commission, evidence, receipts).

It's listed in the MCP Registry. Server card: https://councilof.ai/.well-known/agent-card.json

[CSOAI Ltd | Measurement, not certification]

---

## Monitoring Plan

| Metric | Source | Frequency |
|--------|--------|-----------|
| HF dataset downloads | HuggingFace API | Daily |
| Kaggle dataset downloads | Kaggle API | Daily |
| x402 challenges | /api/revenue | Real-time |
| RSS subscribers | Feed analytics | Weekly |
| GitHub stars/watchers | GitHub API | Daily |
| MCP tool invocations | Server logs | Real-time |
| External citations | Web search | Weekly |
| Reply rate | Email tracking | Per contact |
