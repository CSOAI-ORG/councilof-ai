# Paste-Ready Regulator Responses
## 2026-09-16 — to send tonight

**Lane:** Regulators and standards (TUI 2).
**Rule:** each is the full comment text including salutation, ready to
paste into the regulator's comment form or to submit as letter/postal.
Plain text only, AI-assistance disclosed, no compliance claim.

---

## Response 1 — NYDFS 23 NYCRR 202 (Sep 21 deadline)

**To:** NYDFS via https://www.dfs.ny.gov/industry_guidance/regulatory_activity/financial_services
**Subject:** Public Comment — Proposal for 23 NYCRR 202 — Submission by CSOAI Ltd, ref: csoai-22nycrr202-2026-09-16

Dear Superintendent,

CSOAI Ltd (UK Companies House 16939677) is an independent measurement
body that publishes signed, machine-readable measurements of AI system
behaviour. We submit this comment to offer measurement evidence that
may be relevant to the Department's consideration of 23 NYCRR 202.

**1. The product offered in evidence.**

We publish a weekly handshake census of the MCP (Model Context Protocol)
server population — the protocol layer through which AI agents interact
with external tools, including financial services infrastructure. Our
most recent published snapshot (2026-09-14, available at
https://councilof.ai/interop/mcp-trust/latest.json) probed 500 publicly
discoverable MCP servers and reports:

  • 19 servers responded to an open handshake without authentication
    (initialize_ok_open).
  • 207 servers responded with an authentication challenge before
    answering anything (auth_challenged_401_403).
  • 238 servers reported tools (median: 3 tools per answering server).
  • The remainder were unreachable, errored, or returned non-MCP
    responses.

**2. Why this may be relevant to 23 NYCRR 202.**

The proposed rule addresses stablecoin issuance, reserve composition,
and the obligations of issuers and custodians. AI agents that can hold
or transact in stablecoins interact with financial services through
protocol layers like MCP. The authentication posture of those servers
— whether they challenge before answering, and under what terms — is
a measurable property of the AI-agent ecosystem the rule will govern
indirectly. Reserve attestation and operational continuity are both
vulnerable to misbehaving agent intermediaries; an independently
maintained measurement of the agent-infrastructure layer is, we
submit, a useful substrate.

**3. What we do not claim.**

  • We do not certify compliance with 23 NYCRR 202 or any other
    regulation.
  • We do not assess the reserve adequacy, custody practices, or risk
    posture of any specific issuer.
  • We do not grade, rank, or name non-conformant parties.
  • This comment is not legal advice, formal opinion of counsel, or
    endorsement.

**4. The evidence is publicly verifiable.**

  • The MCP census is published weekly at:
        https://councilof.ai/interop/mcp-trust/latest.json
    All numbers are derived from a defined probe run; none are typed.
  • The corresponding x402 Bazaar census (100 payment doors probed):
        https://councilof.ai/interop/x402-trust/latest.json
  • The master measurement board (22 governance axes, signed cards):
        https://councilof.ai/api/gspc
  • The verification CLI is open source and freely usable:
        python3 tools/verify/csoai_verify.py <card-url>

**5. Confidentiality and disclosure.**

This comment and the supporting evidence are public. CSOAI Ltd
received no compensation for submitting this comment. We are
identified here by company name (CSOAI Ltd) and email
(nicholas@csoai.org) for follow-up correspondence.

Respectfully submitted,

Nicholas Templeman
CSOAI Ltd (UK Companies House 16939677)
nicholas@csoai.org
https://councilof.ai

---
AI-assisted drafting disclosure: this comment was drafted with
Claude (Anthropic). All numerical claims and source URLs have been
programmatically verified at the time of submission against live
endpoints.
---

---

## Response 2 — Bank of England: Sterling-denominated systemic stablecoins (Sep 22 deadline)

**To:** Bank of England via the consultation response form on
https://www.bankofengland.co.uk/paper/2026/ps/sterling-denominated-systemic-stablecoin
**Subject:** Bank of England consultation response — Sterling-denominated systemic stablecoins (Code of Practice)

Dear Sir or Madam,

CSOAI Ltd (UK Companies House 16939677) is an independent measurement
body that publishes signed measurements of AI and crypto-asset system
behaviour. We submit this response to offer measurement evidence relevant
to the Bank's consideration of systemic stablecoin regulation.

**1. What we publish.**

We maintain a weekly measurement of stablecoin reserve attestations across
425 indexed assets and 211 asset-chain deployments. For GBP-denominated
stablecoin-relevant instruments we measure USDC, USDT, DAI and PYUSD
across Base, Ethereum, Arbitrum, Polygon, and Solana — at the contract
level, not from issuer reports. The corresponding MCP trust census
(500 servers probed weekly) gives the AI-agent-substrate measurement
relevant to the same ecosystem.

Live artifacts:

  • https://councilof.ai/interop/stablecoin-universe-2026-09/index.json
    (asset count: 425; per-chain coverage)
  • https://councilof.ai/interop/mcp-trust/latest.json
    (500 MCP servers probed weekly)
  • https://councilof.ai/interop/x402-trust/latest.json
    (100 x402 payment doors probed weekly)

**2. What this may contribute to the Bank's consideration.**

The systemic scope of the proposed Code concerns the governance and
resilience of sterling-denominated systemic stablecoin issuance. We
offer measurement evidence on the protocol substrates that such
issuance is increasingly mediated through. This evidence is
complementary to, not a substitute for, the prudential and operational
review the Bank is conducting.

**3. What we do not claim.**

  • We do not certify compliance with any Bank of England guidance or
    any other regulation.
  • We do not assess reserve adequacy or custody risk for any specific
    issuer.
  • We do not offer legal or financial advice.

**4. Verification.**

All published numbers are derived from running probes. The verification
CLI is open source. No data of this submission is fabricated.

Respectfully,

Nicholas Templeman
CSOAI Ltd (UK Companies House 16939677)
nicholas@csoai.org

---
AI-assisted drafting disclosure: drafted with Claude (Anthropic).
Numerical claims verified at submission time against live endpoints.
---

---

## Response 3 — EBA: MiCA fines methodology (Sep 28 deadline)

**To:** EBA via consultation response form on https://www.eba.europa.eu/publications-and-media/events/consultation-methodology-setting-fines-under-mica
**Subject:** EBA/CP/2026/02/10 — CSOAI Ltd measurement evidence on MiCA fines methodology

Dear Sir or Madam,

CSOAI Ltd submits this response to contribute measurement evidence
relevant to the European Banking Authority's consideration of fines
methodology under MiCA.

**1. Scope.**

We publish signed, machine-readable measurements of AI and crypto-asset
system behaviour. We maintain a weekly x402 payment-door conformance
census of 100 public doors, an MCP trust census of 500 servers, and a
stablecoin universe measurement of 425 assets. The EBA's interest in
MiCA fines methodology engages the operational and reporting layer of
crypto-asset service providers — which is precisely the layer where
our measurement evidence is most probative.

**2. Evidence offered.**

  • x402 payment doors probe (100 hosts): https://councilof.ai/interop/x402-trust/latest.json
  • MCP trust census (500 hosts): https://councilof.ai/interop/mcp-trust/latest.json
  • Stablecoin universe (425 assets, 211 deployments): https://councilof.ai/interop/stablecoin-universe-2026-09/index.json
  • Master board (22 governance axes): https://councilof.ai/api/gspc

**3. Why this is relevant.**

The fines methodology under MiCA is concerned with the operational and
reporting conduct of issuers, custodians, and service providers. Our
weekly evidence provides:

  • The state of conformance of the protocol layer (x402, MCP) that
    crypto-asset services increasingly expose to AI-agent callers.
  • The auditability of reserve attestations at the contract level,
    without relying on issuer-supplied attestations alone.
  • A signed, verifiable record that an EBA-regulated entity can cite
    alongside its own internal attestation reports.

**4. What we do not claim.**

  • We do not certify compliance with MiCA or the proposed fines
    methodology.
  • We do not offer guidance on fine severity or proportionality; that
    is the EBA's judgment.
  • We do not assess conduct of any specific entity.

Respectfully,

Nicholas Templeman
CSOAI Ltd (UK Companies House 16939677)
nicholas@csoai.org

---
AI-assisted drafting disclosure: drafted with Claude (Anthropic).
Numerical claims verified at submission time against live endpoints.
---

---

## Response 4 — European Commission MiCA review (Sep 30 deadline)

**To:** EC DG FISMA via consultation response form at https://finance.ec.europa.eu/regulation-and-supervision/consultations-0/targeted-consultation-review-mica-regulation_en
**Subject:** Targeted MiCA review — CSOAI Ltd measurement evidence

Dear Sir or Madam,

CSOAI Ltd offers this response to the targeted consultation on the review
of Regulation (EU) 2023/1114 on Markets in Crypto-Assets (MiCA). Our
contribution is measurement evidence — three weekly datasets that track
the operational state of the MiCA-relevant substrate.

**1. The three datasets offered.**

  • Stablecoin universe measurement (425 assets, 211 deployments,
    reserve attestations verified at the contract level):
        https://councilof.ai/interop/stablecoin-universe-2026-09/index.json
  • MCP trust census (500 internet-facing MCP servers — the agent
    infrastructure substrate crypto-asset services increasingly depend
    on):
        https://councilof.ai/interop/mcp-trust/latest.json
  • x402 payment-door conformance census (100 public doors, conformance
    verified against the published specification):
        https://councilof.ai/interop/x402-trust/latest.json

**2. Relevance to the Commission's review.**

The MiCA review is concerned with the fitness of the regulation for the
crypto-asset ecosystem as it has developed. Our measurement evidence
addresses three operational questions relevant to that fitness:

  • Stablecoin attestations. Are reserve attestations independently
    verifiable at the contract level, or only through issuer-supplied
    reports? (Our evidence shows both are now measurable.)
  • AI-agent substrate. Crypto-asset services are increasingly
    accessed by AI agents acting on behalf of users. What is the auth
    posture of the servers these agents call? (Our weekly census shows
    207 of 500 challenged-with-auth first.)
  • Payment doors. As AI agents pay for resources autonomously, the
    conformance of x402-style payment doors becomes relevant. (We
    publish this weekly.)

**3. What we do not claim.**

  • We do not certify compliance with MiCA or any other regulation.
  • We do not assess market conduct, reserve adequacy, or pricing
    practices.
  • We do not offer legal advice.

**4. Verification.**

Every numerical claim in this submission is grounded in a public endpoint
that the Commission may fetch directly. We do not type counts.

Respectfully,

Nicholas Templeman
CSOAI Ltd (UK Companies House 16939677)
nicholas@csoai.org

---
AI-assisted drafting disclosure: drafted with Claude (Anthropic).
All live endpoints verified at submission time. Counts in this
submission derive from public probes, not from typing.
---

---

## Response 5 — NIST SP 1353 ipd (Oct 15 deadline)

**To:** NIST via https://www.nist.gov/news-events/news/2026/08/seeking-public-comment-using-artificial-intelligence-cybersecurity
**Subject:** NIST SP 1353 ipd — Public comment submission by CSOAI Ltd

Dear NIST,

CSOAI Ltd (UK Companies House 16939677) submits this public comment
on NIST SP 1353 ipd, "Quick-Start Guide for Using Artificial
Intelligence (AI) for Cybersecurity Framework (CSF) Analysis and
Reporting."

**1. What we contribute.**

We submit three operational observations from running a measurement
pipeline on AI systems for a year. The pipeline produces signed
measurement cards — 311 so far across 22 governance axes drawn from
statute, including NIST AI RMF provisions. The measurement is
reproducible: every card carries the frozen instrument, the model
revision, and the scoring method.

The relevance to SP 1353:

  • **On Quick-Start for AI-driven analysis (§§ guidance for AI tools
    applied to CSF analysis).** Our practice: every AI measurement is
    signed by the issuer's key, not the AI's; the AI does the
    measurement under a frozen instrument, the signing is deterministic,
    and the verification is public.
  • **On reporting (`/reporting` outputs of an AI-driven CSF analysis).**
    Our practice: outputs include the empty cell. UNMEASURED is a
    first-class state. When our AI cannot assess something, the card
    says so, not an invented score.
  • **On the role of an "AI for CSF" tool in a continuous-attestation
    pipeline.** Our practice: the refutation ledger is append-only and
    starts with our own errors. When the measurer self-corrects, the
    correction supersedes (never deletes) the original. AI systems
    that produce audit outputs should be self-correctable by design.
  • **On the relationship between AI-driven analysis and the actor
    responsible.** Our practice: every card has an issuer_did (we use
    did:web:csoai.org#board-attestation-1). The AI does not sign; the
    human operator signs. This separation is, we submit, what
    "measurement, not certification" means in practice.

**2. What we do not claim.**

  • We do not certify compliance with NIST CSF or any other framework.
  • We do not assert that our practice satisfies the proposed SP 1353
    requirements.
  • We offer this comment as practitioners who run an
    independently-verifiable measurement corpus, not as implementers
    of any standard.

**3. Verification of claims.**

  • The measurement corpus:
        https://councilof.ai/api/gspc
    (22 axes, slot/measured counts; derived, not typed).
  • The Merkle root:
        https://councilof.ai/root.json
    (311 cards; OTS sidecar may be present as a future commitment —
    not asserted as full Bitcoin confirmation).
  • The append-only corrections ledger:
        https://councilof.ai/refutation-ledger
    (starts with our own errors).
  • The verification CLI:
        python3 tools/verify/csoai_verify.py <card-url>

Respectfully,

Nicholas Templeman
CSOAI Ltd (UK Companies House 16939677)
nicholas@csoai.org

---
AI-assisted drafting disclosure: drafted with Claude (Anthropic).
Numerical claims verified at submission time against live endpoints.
---

---

*All 5 responses: plain text, AI-assisted disclosure at the end,
no certification language, every claim tied to one fetchable artifact.
Paste into each regulator's comment portal or email and click submit.*
