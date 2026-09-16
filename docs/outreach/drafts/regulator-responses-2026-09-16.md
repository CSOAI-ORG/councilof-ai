# Regulators & Standards — Five Prepared Responses
## 2026-09-16

**Lane:** Regulators and standards (TUI 2 allocation)
**Prepared by:** Claude (cross-lane execution)
**Rule:** each response offers measurement evidence, not compliance advice.
CSOAI measures, never certifies. These are prepared drafts for Nick to
review and submit under his name.

---

## Response 1 — NYDFS 23 NYCRR 202 (comment deadline: 2026-09-21)

**Regulator:** New York State Department of Financial Services
**Instrument:** Proposal for 23 NYCRR 202 — stablecoin rulemaking
**Source:** https://www.dfs.ny.gov/industry_guidance/regulatory_activity/financial_services
**Deadline:** September 21, 2026
**Days remaining:** 5

### Prepared comment

**Re: Notice of Proposed Rulemaking for 23 NYCRR 202 — Public Comment**

Dear Superintendent,

CSOAI Ltd (UK Companies House 16939677) is an independent measurement
body that publishes signed, machine-readable measurements of AI system
behaviour. We write to offer measurement evidence that may be relevant
to the Department's consideration of 23 NYCRR 202.

**What we measure (not what we recommend):**

We run a weekly handshake census of internet-facing MCP (Model Context
Protocol) servers — the protocol layer through which AI agents interact
with external tools, including financial services infrastructure. Our
most recent census (2026-09-14) probed 500 servers and found:

- 19 answered an open handshake (no authentication challenge)
- 207 responded with an authentication challenge before answering
- 238 reported tools (median: 3 tools per server)
- The remainder were unreachable or returned errors

**Why this may be relevant to 23 NYCRR 202:**

The proposed rule addresses stablecoin issuance and reserve requirements.
AI agents that can hold stablecoins interact with financial infrastructure
through protocol layers like MCP. The authentication posture of the
servers these agents call — whether they challenge before answering, and
under what terms — is a measurable property of the ecosystem the rule
governs.

**What we do not claim:**

- We do not certify compliance with any regulation
- We do not grade or rank the servers we probe
- We do not name non-conformant parties
- We do not offer legal advice or compliance assessments

**Evidence (publicly verifiable):**

- MCP trust census: https://councilof.ai/interop/mcp-trust/latest.json
- Trust board: https://councilof.ai/trust
- Verification: https://councilof.ai/gspc-verify (free, no account)

We offer this evidence in the spirit of informed rulemaking. The
Department's judgment on the regulatory implications is, of course,
its own.

Respectfully,
Nicholas Templeman
CSOAI Ltd

---

## Response 2 — Bank of England: Sterling-denominated systemic stablecoins (deadline: 2026-09-22)

**Regulator:** Bank of England
**Instrument:** Sterling-denominated systemic stablecoins — policy statement and draft Code of Practice
**Source:** https://www.bankofengland.co.uk/paper/2026/ps/sterling-denominated-systemic-stablecoin
**Deadline:** September 22, 2026
**Days remaining:** 6

### Prepared comment

**Re: Consultation on Sterling-denominated systemic stablecoins — Code of Practice**

Dear Sir/Madam,

CSOAI Ltd is an independent measurement body that publishes signed
measurements of AI system behaviour. We write to offer measurement
evidence relevant to the Bank's consideration of systemic stablecoin
regulation.

**What we measure:**

We maintain a weekly measurement of stablecoin reserve attestations
across 425 indexed assets and 211 asset-chain deployments. For
GBP-denominated stablecoins, our measurement covers:

- Reserve composition at the contract level (on-chain data)
- Attestation frequency and methodology
- Cross-chain deployment consistency

**What we observe in the AI-agent-stablecoin intersection:**

Our MCP trust census (500 servers probed weekly) shows that AI agents
increasingly interact with financial infrastructure through protocol
layers. The authentication posture of these servers — whether they
challenge before answering — is a measurable property of the ecosystem
that systemic stablecoin regulation may wish to account for.

**What we do not claim:**

- We do not certify compliance with any regulation
- We do not assess reserve adequacy
- We do not offer legal or financial advice

**Evidence (publicly verifiable):**

- Stablecoin universe: https://councilof.ai/interop/stablecoin-universe-2026-09/index.json
- MCP trust census: https://councilof.ai/interop/mcp-trust/latest.json
- Board: https://councilof.ai/api/gspc

We offer this evidence in the spirit of informed consultation.

Respectfully,
Nicholas Templeman
CSOAI Ltd

---

## Response 3 — EBA: Methodology for setting fines under MiCA (deadline: 2026-09-28)

**Regulator:** European Banking Authority
**Instrument:** Consultation on methodology for setting fines under MiCA (EBA/CP/2026/02/10)
**Source:** https://www.eba.europa.eu/publications-and-media/events/consultation-methodology-setting-fines-under-mica
**Deadline:** September 28, 2026
**Days remaining:** 12

### Prepared comment

**Re: EBA/CP/2026/02/10 — Consultation on methodology for setting fines under MiCA**

Dear Sir/Madam,

CSOAI Ltd is an independent measurement body that publishes signed,
machine-readable measurements of AI and crypto-asset system behaviour.
We write to offer measurement evidence relevant to the EBA's
consideration of MiCA fines methodology.

**What we measure:**

We maintain a public measurement corpus of 311 signed cards across
22 governance axes drawn from statute, including EU AI Act provisions.
Our regulatory crosswalk maps these axes to MiCA, DORA, and other
EU frameworks.

**What we observe in the MiCA ecosystem:**

Our x402 trust census probes 100 public payment doors weekly, checking
whether they return a correct 402 challenge with the right schema.
This is a conformance measurement, not a compliance assessment.

**What we do not claim:**

- We do not certify compliance with MiCA or any other regulation
- We do not assess fine severity or proportionality
- We do not offer legal advice

**Evidence (publicly verifiable):**

- x402 trust census: https://councilof.ai/interop/x402-trust/latest.json
- Board: https://councilof.ai/api/gspc
- Regulatory crosswalk: https://councilof.ai/api/state (regulatory section)

We offer this evidence in the spirit of informed consultation.

Respectfully,
Nicholas Templeman
CSOAI Ltd

---

## Response 4 — European Commission: Targeted consultation on MiCA review (deadline: 2026-09-30)

**Regulator:** European Commission (DG FISMA)
**Instrument:** Targeted consultation on the review of Regulation on the Markets in Crypto-Assets (MiCA)
**Source:** https://finance.ec.europa.eu/regulation-and-supervision/consultations-0/targeted-consultation-review-mica-regulation_en
**Deadline:** September 30, 2026
**Days remaining:** 14

### Prepared comment

**Re: Targeted consultation on the review of MiCA**

Dear Sir/Madam,

CSOAI Ltd is an independent measurement body that publishes signed
measurements of crypto-asset and AI system behaviour. We write to
offer measurement evidence relevant to the Commission's review of MiCA.

**What we measure:**

1. **Stablecoin reserve attestations** — 425 assets indexed, deep
   measurements at the contract level for major deployments (USDC,
   USDT, DAI across Base, Ethereum, Arbitrum, Polygon, XRPL).
2. **Payment door conformance** — 100 public x402 doors probed weekly
   for correct challenge schema.
3. **MCP ecosystem posture** — 500 internet-facing MCP servers probed
   weekly for authentication posture.

**What we observe:**

The intersection of AI agents, stablecoins, and protocol layers is
growing. Agents that can hold stablecoins interact with financial
infrastructure through MCP and x402. The authentication posture of
the servers these call — and the conformance of the payment doors
they settle through — are measurable properties of the MiCA ecosystem.

**What we do not claim:**

- We do not certify compliance with MiCA
- We do not assess market conduct or reserve adequacy
- We do not offer legal advice

**Evidence (publicly verifiable):**

- Stablecoin universe: https://councilof.ai/interop/stablecoin-universe-2026-09/index.json
- x402 trust census: https://councilof.ai/interop/x402-trust/latest.json
- MCP trust census: https://councilof.ai/interop/mcp-trust/latest.json
- Board: https://councilof.ai/api/gspc

We offer this evidence in the spirit of informed consultation.

Respectfully,
Nicholas Templeman
CSOAI Ltd

---

## Response 5 — NIST SP 1353: AI for CSF Analysis and Reporting (deadline: 2026-10-15)

**Regulator:** NIST
**Instrument:** NIST SP 1353 ipd — Quick-Start Guide for Using AI for Cybersecurity Framework (CSF) Analysis and Reporting
**Source:** https://www.nist.gov/news-events/news/2026/08/seeking-public-comment-using-artificial-intelligence-cybersecurity
**Deadline:** October 15, 2026
**Days remaining:** 29

### Prepared comment

**Re: NIST SP 1353 ipd — Quick-Start Guide for Using AI for CSF Analysis and Reporting**

Dear NIST,

CSOAI Ltd is an independent measurement body that publishes signed,
machine-readable measurements of AI system behaviour. We write to
offer measurement evidence and practical experience relevant to
NIST SP 1353.

**What we measure:**

We measure AI systems across 22 governance axes drawn from statute,
including NIST AI RMF provisions. Our measurement corpus contains
311 signed cards, each Ed25519-signed and Merkle-anchored. The
measurement is reproducible: every card carries the frozen instrument,
the model revision, and the scoring method.

**What we observe in AI-for-CSF practice:**

1. **Automated measurement produces signed artifacts.** Our measurement
   pipeline runs on frozen instruments, produces signed cards, and
   anchors them to a Merkle root. The AI does the measurement; the
   signing is deterministic; the verification is public.

2. **Corrections are append-only.** Our refutation ledger starts with
   our own errors. When an AI measurement is wrong, the correction
   supersedes (never deletes) the original.

3. **UNMEASURED is a first-class state.** When we cannot measure
   something, we publish the gap. This is relevant to CSF analysis:
   an AI system that cannot assess a control should say so, not
   fill the gap with an invented score.

**What we do not claim:**

- We do not certify compliance with NIST CSF or any other framework
- We do not offer compliance assessments
- We do not claim our measurement satisfies NIST SP 1353 requirements

**Evidence (publicly verifiable):**

- Board: https://councilof.ai/api/gspc (22 axes, live counts)
- Root: https://councilof.ai/root.json (311 cards, Merkle-anchored)
- Verification CLI: https://github.com/CSOAI-ORG/councilof-ai/tree/master/tools/verify
- Refutation ledger: https://councilof.ai/refutation-ledger

We offer this evidence and experience in the spirit of informed
public comment.

Respectfully,
Nicholas Templeman
CSOAI Ltd

---

*Each response offers measurement evidence, not compliance advice.
Every artifact cited is publicly verifiable. CSOAI measures, never certifies.*
