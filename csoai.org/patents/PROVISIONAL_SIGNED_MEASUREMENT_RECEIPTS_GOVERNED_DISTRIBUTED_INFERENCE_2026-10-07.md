# PROVISIONAL PATENT APPLICATION

**Title:** Signed Measurement Receipts and Governance-Aware Tier Routing for Distributed LLM Inference

**Applicant:** CSOAI Ltd (UK 16939677)
**Inventor:** Nicholas Templeman
**Priority Date:** 2026-10-07
**Filing Route:** UK IPO Form 1 (provisional) → PCT at 12 months → national phases at 30 months

---

## 1. Field of the Invention

Relates generally to distributed machine-learning inference, and more specifically to
methods and systems for attesting and routing large-language-model inference across
heterogeneous distributed node clusters with signed, hash-chained measurement receipts
and governance-aware response gating.

## 2. Background

Distributed LLM inference over heterogeneous devices is established prior art: Parallax
(Gradient, 2025) shards models pipeline-parallel across consumer devices; Petals
(BigScience, 2022) performs collaborative inference over the Internet; Exo and
distributed-llama cluster home devices. Routing of inference across model providers is
also established (LLM routers select on cost and latency).

Two unmet needs exist. First, **regulated deployments cannot evidence what their
inference did.** The EU AI Act (Regulation 2024/1689) Article 12 requires automatic
record-keeping of events relevant to identifying risks and serious incidents, and
Article 50 requires transparency. Serving stacks that execute inference produce outputs
but no tamper-evident, verifiable record of (prompt, response, model, node) tuples.
Logs are mutable and unsigned. Second, **fallback routing silently degrades sovereignty.**
When a local cluster is saturated, routers dispatch to external frontier APIs with no
durable marking that the data left the governed boundary, breaking data-protection
accountability (GDPR Art. 5(2)) and any sovereignty commitment.

No existing system combines: (a) per-inference Ed25519-signed receipts hash-chained
into an append-only measurement chain, (b) semantic governance-axis response gating,
and (c) mandatory non-sovereign labelling of fallback inference tiers.

## 3. Summary — Claims

1. **A method for attesting distributed language-model inference**, comprising:
   receiving an inference request at a gateway of a distributed node cluster;
   executing the inference on a selected node; computing a cryptographic hash of the
   combined prompt and response payload; issuing a receipt data structure comprising
   an actor identifier, an action identifier, a model identifier, a node identifier,
   said payload hash, a timestamp, and a previous-receipt hash; signing said receipt
   with an Ed25519 private key; and appending said signed receipt to an append-only
   chain wherein each receipt's previous-receipt hash references its predecessor,
   such that any deletion or reordering of receipts is detectable by chain
   verification. *(independent)*

2. **A method for governance-aware routing of inference** across tiers of a
   distributed system, comprising: classifying each inference request by a governance
   probe axis selected from a set including care, governance, prohibited-practice and
   safety axes; selecting a specialist model by said axis from a routing policy table;
   scoring the model response with a semantic gate that returns a minimum score for
   refusal-pattern responses and empty responses and an axis-marker-weighted score
   otherwise; and recording the score in a signed receipt according to claim 1.
   *(independent)*

3. **A method for tiered fallback of inference** wherein a sovereign local tier and an
   external frontier tier are both available, comprising: routing to said external tier
   only when said sovereign tier is unavailable; attaching to every external-tier
   response a mandatory non-sovereign label in the response metadata, said label being
   non-removable by downstream consumers; and issuing a signed receipt per claim 1
   whose action identifier records that the inference left the governed boundary.
   *(independent)*

4. **A distributed inference system** comprising: a pipeline-parallel sharding engine
   executing models across heterogeneous nodes including Apple-silicon GPU nodes and
   discrete-GPU nodes; a policy gateway according to claims 1-3 interposed at the
   inference entry point, wherein the gateway measures and attests outputs without
   mutating them; and a verification interface operable to validate an entire receipt
   chain offline against a public key. *(independent)*

5. **The system of Claim 4**, wherein a quorum of heterogeneous model voters adjudicates
   disputed gate scores by byzantine-fault-tolerant vote before the receipt is issued.
   *(dependent — integrates governance voting)*

## 4. Detailed Description — Reduction to Practice

Implemented as the `meok_council` module of the MEOK Mesh distributed serving stack
(Python 3.11+, `cryptography` 49.0.0), functional and tested 2026-10-07.

- **Receipt chain** — `src/meok_council/sigil.py`, classes `SigilChain`, `Receipt`.
  `SigilChain.issue(action, model, node, payload)` computes
  `payload_sha256 = SHA-256(payload)`, builds a canonical-JSON body
  (sorted keys, compact separators), signs with `Ed25519PrivateKey.sign()` per RFC 8032,
  and sets `hash = SHA-256(canonical_body || sig)` with `prev_hash` referencing the
  prior receipt (genesis = 64 zeros). `SigilChain.verify()` re-derives the signature
  and hash and checks the prev-hash link; `verify_chain()` validates an entire chain.
  Tampering with `payload_sha256` and chain reordering are both detected (tests below).
- **Governance-aware routing** — `src/meok_council/policy_router.py`, class
  `PolicyRouter`. `PROBE_MARKERS` maps governance axes (care, gov, art5, safety) to
  semantic marker sets (e.g. care: "consent", "dignity", "safeguard"). The
  `semantic_gate()` scorer returns 0.0 for responses under 20 characters and for
  refusal-pattern responses (regex over "I cannot…", "I'm sorry…"), and
  `min(1.0, 0.5 + 0.1·hits)` for marker-bearing responses. `route()` selects
  `TIER_MESH` (sovereign) when available, else `TIER_ORI` with the fixed label
  "external-fallback: NON-SOVEREIGN" in `labelled()` response headers
  (`x-meok-tier`, `x-meok-label`, `x-meok-sovereign`, `x-meok-receipt`).
- **PDCA gate** — `src/meok_council/gate.py`, class `PDCAGate.gate(probe, prompt,
  complete)`: Plan (route), Do (execute), Check (semantic gate), Act (issue receipt).
- **Fallback attestation** — `src/meok_council/fallback.py`, class `OriFallback`:
  external frontier calls carry the non-sovereign label and emit receipts with
  `action="inference:external-fallback"`, recording the boundary crossing.
- **Relay sovereignty patch** — `src/parallax/cli.py::_get_relay_params()`: public
  discovery relays (which observe node IP information) are opt-in
  (`MEOK_ALLOW_PUBLIC_RELAY=1`); default is self-organised LAN operation.

**Tests:** `tests/test_meok_council.py` — 9/9 passing (0.24s, 2026-10-07):
sign/verify round-trip; 5-receipt chain verification; tamper detection; reorder
detection; refusal scores 0.0; substantive care response scores ≥ gate threshold;
mesh tier preferred; external fallback always labelled NON-SOVEREIGN; PDCA gate emits
signed receipt with required-receipt header.

**Prior art comparison:**

| System | Distributed sharding | Signed per-call receipts | Governance-axis gating | Sovereignty labelling |
|---|---|---|---|---|
| Parallax (arXiv 2509.26182) | ✅ | ❌ | ❌ | ❌ |
| Petals (arXiv 2209.01188) | ✅ | ❌ | ❌ | ❌ |
| distributed-llama | ✅ | ❌ | ❌ | ❌ |
| LLM routers (cost/latency) | ❌ | ❌ | ❌ | ❌ |
| vLLM Semantic Router (arXiv 2603.04444) | ❌ | ❌ | modality routing only | ❌ |
| **Present invention** | ✅ | ✅ Ed25519 hash-chain | ✅ care/gov/art5/safety | ✅ mandatory labels |

## 5. Prior Art References

- Gradient, "Parallax: Efficient LLM Inference Service over Decentralized Environment," arXiv:2509.26182, 2025 — pipeline-parallel sharding across heterogeneous devices; no receipts, no governance gating.
- Borisov et al. (BigScience), "Petals: Collaborative Inference and Fine-tuning of Large Models," arXiv:2209.01188 / NeurIPS 2023 — Internet-scale collaborative inference; no attestation layer.
- RFC 8032 (Ed25519 signatures), 2017 — the signature primitive used; novel in combination.
- NIST FIPS 180-4 (SHA-256) — the hash primitive used.
- Castro & Liskov, "Practical Byzantine Fault Tolerance," OSDI 1999 — BFT voting, cited for Claim 5's dependent integration.
- vLLM Semantic Router, arXiv:2603.04444, 2026 — signal-driven modality routing; routes on signal classes, does not gate responses on governance axes and issues no signed receipts.
- C2PA Specification 2.x, 2024 — content provenance manifests for media; no inference-call granularity, no chain of prev-hash links per call.
- Regulation (EU) 2024/1689 (EU AI Act), Art. 12 (record-keeping), Art. 50 (transparency); GDPR Art. 5(2) (accountability) — regulatory drivers.

## 6. Abstract

A method and system for governed distributed language-model inference. Inference
executed across a heterogeneous sharded node cluster is attested by per-call receipts:
a payload hash, model and node identifiers, timestamp and previous-receipt hash,
canonically serialised and Ed25519-signed, forming an append-only chain in which
deletion or reordering is detectable offline. Requests are routed by governance probe
axis (care, governance, prohibited-practice, safety) to specialist models, with
responses scored by a semantic gate that zeroes refusals and weights axis markers.
Fallback to external frontier tiers occurs only when the sovereign tier is
unavailable, and every such response carries a mandatory non-sovereign label with a
receipt recording the boundary crossing. The combination provides tamper-evident
AI-record-keeping evidence and sovereignty transparency for regulated deployments.

## 7. Filing Instructions

1. **UK IPO Form 1** — file this provisional (~£60-100 online). Priority date 2026-10-07.
2. **PCT** within 12 months (by 2027-10-07); enter national phases within 30 months.
   Target jurisdictions: UK, EP, US, JP, AU, CA.
3. **Public disclosure warning:** priority date must precede any public demonstration
   or publication of `meok_council`. The code is committed to a PRIVATE repository and
   must NOT be made public until the provisional is filed. (Grace period UK 12 months,
   but file first.)
4. **OIN 2.0 scope check (recorded):** this invention covers inference-measurement
   receipts and governance routing — it is NOT Linux-kernel-adjacent and NOT within
   the OIN "Linux System" definition. The OIN Sec 1.2 grant-back does NOT apply.
   No Limitation Election required. Clean — record filed 2026-10-07.
5. Related filings for cross-reference: BFT Governance patent (Claim 5 integration),
   Provenance Passport (receipt format family).

## 8. Novelty Statement

The novelty is the **combination**: Ed25519 (RFC 8032), SHA-256 hash-chaining, and
distributed pipeline-parallel inference are each established individually. No prior
art combines per-inference signed hash-chained measurement receipts with
governance-axis semantic response gating and mandatory non-sovereign labelling of
fallback inference tiers. The prior-art table in Section 4 shows each cited system
missing at least two of the three elements. The invention converts a distributed
serving stack from "executes inference" to "produces verifiable evidence about
inference," which is the artifact regulated deployments require under EU AI Act
Art. 12/50.

---

*Prepared for CSOAI Ltd (UK 16939677). Inventor: Nicholas Templeman. This document
constitutes a reduction to practice of the claimed inventions via the `meok_council`
module of the MEOK Mesh distributed serving stack (9/9 tests passing, tsc
type-checked provider integration). Operational as of 2026-10-07.*
