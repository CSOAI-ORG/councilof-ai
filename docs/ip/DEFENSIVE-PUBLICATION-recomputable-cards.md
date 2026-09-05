# Defensive Publication — Recomputable Signed Measurement Cards for AI Governance

**Author / Assignee:** CSOAI LTD (United Kingdom, Companies House 16939677), 3rd Floor, 86–90 Paul Street, London EC2A 4NE
**Inventor of record:** Nicholas Templeman
**First public disclosure date:** 2026-09-01
**Status:** Defensive publication. Released to establish prior art. No patent is sought on the matter disclosed below; this document is intended to bar third parties from patenting it.
**Licence:** CC BY 4.0 for the text; the described public protocol is free to implement.

---

## 1. Abstract

A system and method for producing **independently recomputable, cryptographically signed measurement records ("cards")** of the behaviour of an AI model against a governance axis, such that any third party can, offline and without trusting the issuer, **recompute the record and confirm the published number**. The novelty claimed as prior art is the *combination* of: (a) a per-(model, axis) measurement atom carrying its full evidence grammar; (b) deterministic grading of that atom to a scalar with a stated confidence interval and sample size; (c) an Ed25519 signature over a canonical preimage of the card; (d) periodic anchoring of the set of card hashes into a single Merkle root published at a stable URL; and (e) a public recompute protocol that lets a verifier reproduce (a)–(d) from published inputs. The design deliberately separates the **public verification surface** (this document) from the **grading internals** (retained as a trade secret), so that trust derives from reproducibility of the *number*, not from disclosure of the *grader*.

## 2. Problem addressed

AI governance and compliance evidence today is overwhelmingly **asserted** (a vendor states its model is safe/compliant) rather than **computed** (an independent party measures and anyone can re-check). Asserted evidence cannot be audited without trusting the asserter, is not comparable across vendors, and cannot be recomputed after the fact. This publication describes an evidence format that is *computed, comparable, and recomputable*.

## 3. System overview

```
axis (governance question)                e.g. "refusal integrity", "provenance disclosure"
  └─ atom (model, axis, prompt-set, run)  the unit of measurement + its evidence grammar
       └─ deterministic grade  ────────►  scalar in [0,1] + Wilson CI + n
            └─ card             ────────►  {model, axis, value, ci, n, method_id, ts, inputs_hash}
                 └─ Ed25519 sig ────────►  signature over canonical preimage of card
                      └─ card_index       set of all current cards + their hashes
                           └─ Merkle root published at /root.json  (anchor)
                                └─ public recompute protocol (§6)
```

### 3.1 Atom (evidence grammar)
An **atom** binds a model identifier, an axis identifier, the prompt/stimulus set used, the raw model responses, and the metadata needed to reproduce the run (decoding parameters, timestamp, prompt-set hash). The atom is the durable evidence; the card is its signed summary.

### 3.2 Deterministic grade
Each atom is reduced to a scalar by a **deterministic** grading function — same atom in, same number out, on any machine, with no model-in-the-loop judgement at scoring time. Every scored cell carries a **Wilson score confidence interval** and the sample size `n`, so the result is statistically defensible and comparisons state their uncertainty. *The internals of the grading function are NOT disclosed here and are retained as a trade secret; only its determinism, its output contract (scalar + CI + n), and its reproducibility guarantee are public.*

### 3.3 Card and canonical preimage
A **card** is the signed record for one (model, axis) cell. It is serialised to a **canonical preimage** (stable key order, normalised numeric formatting, explicit `method_id` and `inputs_hash`) so that the exact byte sequence that was signed can be reconstructed by a verifier. The card is signed with **Ed25519**; the public key is published.

### 3.4 Card index and Merkle anchor
The current set of cards is assembled into a **card index**. The hashes of the cards are combined into a single **Merkle root**, published as `root.json` at a stable URL with a timestamp and the count of cards anchored. Anchoring makes the entire published board tamper-evident: changing any card changes the root.

### 3.5 Neutral-body rule
When cards are aggregated into a public leaderboard, records for models operated by the issuer are **excluded from leader positions** by an explicit, published transform (state markers such as `EXCLUDED_OWN_MODEL`), and axes whose leader lacks a signed card are shown with an explicit `NO_SIGNED_CARD` marker rather than an unverifiable claim. The measurement remains published; only the *ranking* is held to a neutrality rule. This prevents the issuer from ranking itself first on its own instrument.

## 4. What is claimed as prior art (public)

1. A per-(model, axis) signed measurement card carrying value, Wilson CI, `n`, `method_id`, `inputs_hash`, and timestamp.
2. Canonical-preimage serialisation of that card enabling byte-exact signature reconstruction by a third party.
3. Ed25519 signing of governance-measurement cards with a published verification key.
4. Merkle-root anchoring of the full card set at a stable URL to make the board tamper-evident.
5. A public recompute protocol (§6) by which a verifier reproduces the number from published inputs without trusting the issuer.
6. The neutral-body transform (§3.5) applied to a self-issued leaderboard.
7. The explicit separation of a public verification surface from trade-secret grading internals, such that trust rests on reproducibility of the number rather than disclosure of the grader.

## 5. What is expressly NOT disclosed (trade secret)

The internal construction of the deterministic grading function — its feature extraction, rubric encoding, calibration, and anti-gaming held-out design — is **not** disclosed and is retained as a trade secret. This publication does not enable a third party to reconstruct the grader; it enables a third party to *check the issuer's number*.

## 6. Public recompute protocol

A verifier, given only published artifacts, can:
1. Fetch a card and its atom inputs (or supply the same stimulus set to the same model).
2. Recompute the deterministic grade from the atom (the grading contract is stable and versioned by `method_id`).
3. Reconstruct the canonical preimage and verify the Ed25519 signature against the published key.
4. Recompute the Merkle root over the card index and confirm it matches `root.json`.
5. Conclude the published number is authentic and reproducible, or flag a discrepancy — **without trusting the issuer**.

## 7. Industrial applicability

The format produces audit-ready, recomputable evidence for AI-governance regimes that require records of measured system behaviour (for example transparency, risk-management, and incident-record obligations under contemporary AI regulation), vendor-neutral model comparison, and embedded runtime verification of models by agent platforms. Because every record is recomputable, the same artifact serves compliance filing, procurement diligence, and independent audit.

## 8. Prior-art declaration

This document is published to establish prior art as of the disclosure date above and to prevent third parties from obtaining patents over the subject matter of §4. CSOAI LTD reserves all rights in the trade-secret matter of §5 and in trademarks and branding, none of which are dedicated to the public by this publication.

---
*Cite as:* CSOAI LTD. "Recomputable Signed Measurement Cards for AI Governance — Defensive Publication." 2026-09-01. https://councilof.ai/docs/ip/DEFENSIVE-PUBLICATION-recomputable-cards
