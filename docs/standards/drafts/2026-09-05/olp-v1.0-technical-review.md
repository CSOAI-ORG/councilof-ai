# Technical review — Open Layer Protocol v1.0 (`olp-v1.0-review-1`)

**Reviewer:** Council of AI (CSOAI Ltd, UK Companies House 16939677), `did:web:csoai.org`.
**Target reviewed:** commit `877493826d673ccf9bb94e7b6b113b35141ad220` — the frozen source the
review issue names, not `main`. **Requested by:** open-trust-layer/protocol issue #17
(`olp-v1.0-review-1`, opened 2026-08-20).
**Method:** read against a deployed instrument. Every claim we make about *our own* behaviour
below resolves to a live URL a stranger can fetch without an account. Claims about OLP cite a
file and section at the frozen commit. **Status of this document: a review, not an endorsement,
and not a conformance determination — we measure; we do not certify.**

---

## 1. Where OLP is ahead of us — adopt, do not argue

**1.1 The failure taxonomy (§20.4, `0004-proofs-and-verification.md`) is finer-grained than our
three-state verdict, and it is right.** OLP requires implementations to preserve
`NONCONFORMING` / `UNSUPPORTED` / `UNAVAILABLE` / `INVALID` / `MISMATCH`, and requires dimensions
to represent `NOT_EVALUATED` (§20.3).

We publish a three-state verdict — VALID / INVALID / UNCHECKABLE
(<https://councilof.ai/signed/HOW-TO-VERIFY.md>, verifier at
<https://councilof.ai/signed/verify-card.mjs>). OLP's `UNAVAILABLE` is our UNCHECKABLE; its
`NONCONFORMING`, `UNSUPPORTED` and `MISMATCH` are three distinct things our single INVALID
currently flattens. A verifier that cannot say "your input was well-formed but I lack the
cryptosuite" pushes an implementation defect into the subject's column. **Finding: no change
requested of OLP. We intend to widen our own verdict vocabulary toward §20.4.**

**1.2 The conflict vocabulary (§31.4, `0007-status-and-lifecycle.md`) is likewise ahead.**
`STATUS_SEQUENCE_CONFLICT`, `STATUS_EVIDENCE_CONFLICT`, `STATUS_SOURCE_EQUIVOCATION`,
`STATUS_ORDERING_INDETERMINATE`. We name a single CONFLICT state, ledgered as `C-2026-0905-01`
(<https://councilof.ai/api/corrections>). `STATUS_SOURCE_EQUIVOCATION` — one source saying
different things to different askers — is the case our single word cannot express.

**1.3 "Graph structure is not truth" (§4.4, `0005-evidence-relationships.md`) is the correct
boundary**, restated at §170 (relationships "MUST NOT create protocol-defined truth, confidence,
authority, or evidentiary weight"). It matches the line our own bill of materials carries: *"A
signature is an integrity claim, not a truth claim"*
(<https://councilof.ai/interop/cards/aibom/cyclonedx.json>). Agreement here is worth recording
because it is the boundary most often lost downstream.

---

## 2. Material finding — anchoring has no declared scope

**The gap.** `0004` treats blockchain anchoring only as an evidence *model* (§917, §1795). At the
reviewed commit we find no normative requirement that an anchor **declare what it covers**, and
no requirement that a verifier **refuse to extend** an anchor beyond that. §20.4 disciplines the
verdict; nothing we found disciplines the anchor's *extent*.

**Why we raise it: we shipped this defect and had to correct it.** Our public root is a Merkle
envelope over `card_sha256[]` (<https://councilof.ai/root.json>). Our signed card index is a
**separate corpus** (<https://councilof.ai/signed/card_index.json>). They share **no members** —
`/api/state` publishes the relation as machine-readable fact
(<https://councilof.ai/api/state> → `signed_cards.corpus_relation`), read 2026-09-05:

```
relationship: SEPARATE_CORPORA   public_root_leaves: 153
separately_indexed_signed_cards: 335   identifier_overlap: 0
ots_scope: PUBLIC_ROOT_BYTES_ONLY
```

That last field exists because the honest sentence is narrow: **a valid OpenTimestamps proof over
`root.json` covers `root.json` bytes only.** It does not anchor the 335-card index and it does not
anchor a grade. Copy of the form "*N* records anchored" is false while only the root is anchored —
our own facts gate now refuses that sentence, and stamping is not anchoring: a fresh stamp carries
a `PendingAttestation` and becomes a proof only once a calendar commits it to a block.

**Recommendation (normative, small):** require an anchor to carry an explicit scope — the exact
byte-set or identifier-set it commits to — and require verifiers to report `MISMATCH` (§20.4)
rather than success when asked to extend an anchor to identifiers outside that set. Without it,
two conformant implementations can disagree about whether an anchor covers a bundle's members,
and the disagreement will be silent.

**Severity:** material, not blocking. It is a specification-completeness gap, not a break.

---

## 3. Second finding — `content_id` is not authorization

We could not locate normative text separating **content-addressed identity** from **signer
authorization**. These are routinely conflated in deployment, and the conflation reads as a
stronger claim than the bytes support.

We hold the line on our own board and publish the split rather than the flattering total: of our
8 deterministic-fact run artifacts, **1** carries an Ed25519 signature and **7** are
content-addressed and unsigned — `/api/gspc` → `totals.financial_run_attestations`
(<https://councilof.ai/api/gspc>), whose own note reads *"A content_id proves identity of bytes,
not signer authorization."*

**Recommendation:** state in `0004` that a content address establishes identity of bytes only,
and that no authorization, endorsement or authorship may be inferred from it absent a proof whose
verification method resolves (§20.2 `verificationMethodResolution`).

---

## 4. Process note

Freezing the review target to an exact SHA — and saying plainly in issue #17 that the commit
cannot contain its own eventual hash, so the reviewed snapshot still reads `preparing` — is the
correct handling of a real ordering problem, and we adopted the same discipline in reviewing it.
We reviewed the frozen commit, not `main`.

**Disposition we ask for:** §2 and §3 dispositioned with durable references, as the promotion gate
in `0015-stable-profile-promotion-and-readiness.md` requires. We claim no conformance, assert no
determination, and charge nothing for this review. Verification of our own artifacts is free and
loginless, permanently.
