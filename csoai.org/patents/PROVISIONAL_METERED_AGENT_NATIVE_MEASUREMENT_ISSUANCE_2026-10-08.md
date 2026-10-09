# PROVISIONAL PATENT APPLICATION

**Title:** Metered Agent-Native Issuance of Independent AI Measurement Credentials over HTTP 402 with First-Class Unmeasured Semantics

**Applicant:** CSOAI Ltd (UK 16939677)
**Inventor:** Nicholas Templeman
**Priority Date:** 2026-10-08
**Filing Route:** UK IPO Form 1 (provisional) → PCT at 12 months → national phases at 30 months
**Companion provisionals (differentiated):** Signed Measurement Receipts & Governance-Aware Tier Routing for Distributed LLM Inference (2026-10-07 — per-inference receipts, inference-side); Deterministic Transparency-Obligation Probing with Evidence-Carrying Verdicts and Public Self-Inclusive Measurement Boards (2026-10-08 same-day companion — probe instrument + verdict tuples; the present invention claims the payment-metered commission, agent-native discovery and signed-card issuance/inclusion loop, NOT probe semantics); Provenance Passport (2026-07 — content credential format); BFT Governance (2026-07 — voting method); Agentic Threat Defense (2026-07); Organic World Model (2026-07).

---

## 1. Field of the Invention

Relates generally to computer-implemented measurement and commerce systems, and specifically to methods and systems by which an independent measurement body serves payment-metered, agent-discoverable measurement commissions to autonomous software agents, issuing cryptographically signed measurement credentials that carry an explicit first-class *unmeasured* state and are offline-verifiable without the issuer.

## 2. Background

Autonomous agents increasingly transact without humans in the loop: HTTP 402 with the x402 scheme set machine-payable endpoints (USD micropayments in stablecoin, exact-scheme offers in the `PAYMENT-REQUIRED` challenge), and agent discovery standards (A2A agent cards, llms.txt, MCP server cards) let agents locate services programmatically. Concurrently, the EU AI Act (Regulation 2024/1689) creates demand for evidence of AI-system properties (Art. 12 record-keeping; Art. 50 transparency) and buyers want *independent* assessment rather than vendor self-claim.

Two unmet needs exist. First, **existing benchmark and leaderboard services publish scores on web pages or queryable APIs, but do not issue per-request, cryptographically signed, offline-verifiable measurement credentials that an agent can purchase per-call and quote as evidence.** Leaderboard aggregation (LMArena-style arenas; HELM-style benchmark suites; commercial benchmark APIs) returns mutable, unsigned aggregates; nothing an agent can carry, re-verify offline, or anchor. Second, **the prevailing failure mode of scoring systems is fabrication**: when an instrument has not measured a subject, systems either omit the subject or emit a coerced default score. Regulated buyers are harmed by pseudo-precision; there is no established commercial pattern in which *refusal to measure* is a first-class, signed, positively-issued result that is contractually and cryptographically distinguishable from both a passing and a failing score.

No existing system combines: (a) HTTP 402 metered access to a *measurement commission* endpoint of an independent body; (b) agent-native discovery surfaces (agent card, machine-readable capability index, payment well-known) co-located with the measurement API; (c) issuance of a signed per-subject measurement card containing a first-class UNMEASURED state with enumerated causes; and (d) inclusion of issued cards under a published append-only merkle root so offline verification needs no live issuer.

## 3. Summary — Claims

1. **A method for metered issuance of independent AI measurement credentials to autonomous agents**, comprising: publishing an agent-native service surface comprising a signed agent capability card, a machine-readable language-model index, and a payment-terms well-known document; receiving, at a measurement-commission endpoint, an unpaid request from an agent client; responding with an HTTP 402 challenge containing machine-readable payment terms comprising scheme, network, asset, amount and recipient address; receiving said payment proof; executing a deterministic measurement of a named subject on frozen published instruments; and returning a measurement card comprising a subject identifier, an instrument set identifier, per-axis measured values or an explicit unmeasured state with enumerated causes, an Ed25519 signature over the canonicalised card, and a public key, wherein said agent client verifies said signature offline without contacting the issuer.

2. **The method of Claim 1, wherein** said measurement card, when a deterministic instrument has not been run for a subject or axis, encodes a first-class UNMEASURED state carrying the enumerated cause and the limits of what was not measured, such that no numeric score is emitted for unmeasured content, and said UNMEASURED card is signed, issued, and stored identically to a measured card.

3. **A system for independent, payment-metered AI measurement**, comprising: a commission interface configured to answer unpaid requests with an HTTP 402 challenge; a payment verifier configured to accept proof of a stablecoin transfer to a recipient address specified in said challenge; a measurement engine configured to execute frozen, version-published instruments producing deterministic results including an explicit unmeasured outcome; a signer configured to sign canonicalised measurement cards with an Ed25519 private key held by the measurement body; and an inclusion service configured to append said cards to an append-only card index and publish a merkle root of said index, wherein any third party verifies a card by (i) checking the Ed25519 signature against the published public key and (ii) checking a merkle inclusion proof against a published root, both performed offline against previously fetched artifacts.

4. **The system of Claim 3, further comprising** an economic separation control wherein the measurement body publishes a standing rule that it accepts no money from any subject it measures, and wherein said commission endpoint prices measurement access uniformly per call irrespective of subject identity, such that payment cannot influence measured values.

5. **The method of Claim 1, further comprising** re-measurement on a published cadence such that each newly issued card supersedes a predecessor for the same subject under a content-addressed identifier, and stale cards remain verifiably authentic while being identifiable as superseded, whereby an agent quoting an old card can detect currency without re-running measurement.

## 4. Detailed Description — Reduction to Practice

The invention is implemented in the CSOAI/Council of AI production estate (operational as of 2026-10-08):

- **Agent-native surface (Claim 1 preamble):** `https://councilof.ai` serves the full discovery stack simultaneously — `/.well-known/agent-card.json` (signed agent capability card), `/.well-known/mcp/server-card.json` (MCP server card), `/.well-known/x402.json` (payment well-known), `/llms.txt`, `/openapi.json`, `/robots.txt`, `/sitemap.xml` — a 7/7 Layer-0 surface. An audit on 2026-10-08 probing 17 competing AI-governance and measurement surfaces found only two at 7/7 (councilof.ai and lmarena.ai); every governance-platform competitor scored ≤3/7, none exposing an agent card, MCP card, x402 well-known or API contract (matrix: layer0_competitor_matrix.json).
- **402 commission (Claim 1):** `POST/GET https://councilof.ai/api/request-attestation` returns HTTP 402 with body `{"x402Version":2,"error":"Payment required",...,"accepts":[{"scheme":"exact","network":"eip155:8453",...,"amount":"<atomic USDC>","payTo":"0x2126…"}]}` — an exact-scheme stablecoin offer on Base with promo/normal price tiers and a campaign window.
- **Signed card issuance (Claims 1, 3):** paid commissions produce card-v0 receipts (schema `https://councilof.ai/schema/card-v0.json`) carrying `sig_ed25519` over the canonicalised card; the public index `/signed/card_index.json` held 335 of 336 labelled entries at audit time; verification instructions at `/signed/HOW-TO-VERIFY.md`; per-card artifacts at `/signed/cards/{id}.json`.
- **First-class UNMEASURED (Claim 2):** the live board `GET /api/gspc` (schema `csoai.gspc-axes/0.3`) reports 23 axes with explicit UNMEASURED/UNTESTED categories: at 2026-10-08, 23/23 axes declared, 14 model-comparison axes of which 7 TIE and 7 UNTESTED — untested axes are reported as untested, never coerced to a score; commission responses observed in-test carried `"fresh_run":"UNMEASURED","status":"COMMISSIONED"` rather than a fabricated value.
- **Offline verification (Claim 3(ii)):** the estate publishes a merkle root (`GET /root.json` — VALID root prefix `47277a6f2034e80b` at audit) and the MCP `gspc` toolset (registry listing `ai.councilof/gspc` v1.4.4, 19 tools = 14 free + 5 metered) exposes `get_card`, `verify_card`, `verify_inclusion`, `list_cards`, `get_root` — inclusion proofs verified against the published root.
- **Economic separation (Claim 4):** standing published rule: "We measure, never certify… we take no money from anything we rank" (Glama registry listings, honesty registers, 2026-09-02 and current); pricing is per-call uniform on the commission endpoint irrespective of subject.
- **Re-measurement cadence (Claim 5):** cards are content-addressed; re-measurement issues a new card that supersedes prior identifiers while old cards remain signature-valid; standing measurement cycle runs on a published cadence.

Prior-art comparison:

| Dimension | Leaderboards (LMArena/HELM) | Benchmark APIs (commercial) | C2PA/Sigstore | **This invention** |
|---|---|---|---|---|
| Per-request paid issuance to agent | no | no | no | **yes (402 exact-scheme)** |
| Offline-verifiable signed per-subject card | no | no | content creds / log entries (different domain) | **yes (Ed25519 + merkle inclusion)** |
| First-class UNMEASURED as signed output | no (omit or default) | no | n/a | **yes** |
| Agent-native discovery co-located | partial | partial | n/a | **yes (7/7 surface)** |
| Published payee-separation rule | n/a | often undisclosed | n/a | **yes** |

## 5. Prior Art References

- RFC 8032 (Ed25519 signature scheme); RFC 6962 (Certificate Transparency merkle format) — used as primitives; the novelty is the combination, not these primitives.
- HTTP 402 / x402 protocol materials (IETF draft-bb-httpbis-http-status-402; x402 v2 exact scheme) — establishes machine-payable endpoints generally; not applied to independent measurement issuance.
- C2PA specification (2024) — content provenance credentials for media; not payment-metered, not measurement-body issuance with unmeasured semantics.
- Sigstore transparency logs — public append-only logs; not per-subject measurement credentials.
- LMArena (Zheng et al., 2023, MT-Bench/Chatbot Arena) and HELM (Liang et al., 2023) — crowdsourced/static benchmark aggregation; unsigned, non-transactional, no offline-verifiable per-subject credential.
- EU AI Act (Regulation 2024/1689) Arts. 12, 50 — regulatory demand context, not prior art to the method.
- Companion provisional 2026-10-07 (signed receipts for distributed inference) — covers per-inference attestation inside a serving cluster; the present invention covers commerce-and-issuance at the *measurement body's* boundary (commission endpoint, unmeasured semantics, merkle-published card index, payee separation) and does not claim inference receipting or tier routing.
- Same-day companion provisional 2026-10-08 (Deterministic Transparency-Obligation Probing) — covers the probe instrument, evidence-bound verdict tuples and self-inclusive boards; the present invention covers the 402-metered commission interface, agent-native discovery, uniform-pricing/payee-separation economics and card issuance/inclusion — the commerce and distribution layer that sits downstream of (and is claim-disjoint from) the probe.

## 6. Abstract

A method and system by which an independent AI measurement body exposes an agent-native service surface (signed agent card, machine-readable index, payment well-known), answers unpaid measurement requests with an HTTP 402 exact-scheme stablecoin offer, executes deterministic frozen instruments upon payment, and issues Ed25519-signed per-subject measurement cards that are offline-verifiable and merkle-included under a published root — where axes not actually measured are issued as a first-class signed UNMEASURED state with enumerated causes rather than any numeric score, and where the body maintains published price-uniformity and payee-separation from every subject it measures. Combines machine-payable endpoints, agent discovery standards, signed measurement credentials and honest-unmeasured semantics into a single issuance loop that no prior leaderboard, benchmark API, or provenance system performs.

## 7. Filing Instructions

UK IPO Form 1 provisional (~£60–100) → PCT within 12 months (priority 2026-10-08) → national phases by 2030-10-08. **Public-disclosure warning:** parts of the surface are publicly probeable already (agent card, openapi, cards index) — file promptly; UK 12-month grace exists but file-first is safer. **OIN 2.0 scope check (mandatory gate):** NOT Linux-kernel-adjacent — this is a measurement/commerce/credential surface; OIN Sec 1.2 Linux-System grant-back does not apply; clean to file (record: no Limitation Election needed). Target jurisdictions: UK, US, EU, plus defense-adjacent jurisdiction strategy per DEFONEOS positioning (measurement only, no certification claims).

## 8. Novelty Statement

The novelty is not in any individual primitive (HTTP 402, Ed25519, merkle trees, leaderboards are each known) but in the sovereign combination: a *measurement body* that (i) meters commission access per call over an exact-scheme 402 offer, (ii) issues offline-verifiable signed per-subject cards under a published root, (iii) elevates "not measured" to a signed, positively-issued, cause-enumerated first-class state indistinguishable in provenance but distinguishable in content from scored cards, and (iv) binds the whole commerce loop to published price-uniformity and subject-payee separation — such that an autonomous agent can purchase, carry, and re-verify independent evidence, and can detect both fabrication (signature/root failure) and pseudo-precision (unmeasured-state cards) without trusting the issuer at verification time.

---

*Prepared for CSOAI Ltd (UK 16939677). Inventor: Nicholas Templeman. Reduction to practice via the GSPC measurement engine, card-v0 issuance pipeline, and councilof.ai Layer-0 agent surface of the CSOAI sovereign substrate (estate operational 2026-10-08; board 23 axes with UNMEASURED first-class; card index 335/336 labelled; root 47277a6f2034e80b VALID; 7/7 Layer-0 vs 17-surface audit). Differentiated against same-portfolio companion provisional 2026-10-07 (inference receipts) in §5.*
