# DOC: RFC / standards-lane alignment — 7 October 2026

**Purpose:** align M4 (measurement + durability) with the standards lane's live work.
Nothing is submitted or claimed here beyond what exists.

## What the standards lane owns (verified on the Datatracker)

- **draft-templeman-scitt-framing-space** — "Measuring the CBOR Framing Space of
  COSE_Sign1 Data-Hash Pre-images". Individual submission, Nicholas Templeman
  (ORCID 0009-0001-3869-1068). Submitted to the IETF Datatracker 2026-09-05T04:48:10Z,
  expires 2027-03-09. Open standards work; **no working-group adoption is claimed.**
  Scope: a signed statement conveyed as COSE_Sign1 may serialize into many distinct
  byte sequences that decode to the same data item — data-hash identifiers are
  framing-sensitive.
- Related canon already in the estate: **RFC 6962** domain-separated batch hashing
  (closed-loop integrity patch), **RFC 8785 / JCS** (canon:jcs-rfc8785, pinned),
  **C2SP tlog-witness** (witness cosigning spike, 2026-09-17).

## Where M4's instruments are direct implementation evidence for the draft

1. **The dual-preimage rule (catapult, 2026-10-07).** The catapult's envelope
   normalizer verifies `payload_sha256` under BOTH named serialization rules —
   house `json.dumps(sort_keys, separators, ensure_ascii=True)` vs JS
   `JSON.stringify` (`ensure_ascii=False`) — and names which rule matched. This is
   the draft's thesis living in production JSON-land: **one logical object, two
   byte-serializations, one pinned preimage**. Candidate implementation-evidence
   paragraph if the draft is revised.
2. **The n-semantics fix (2026-10-07).** One concept (`n`) with two spellings
   (attempted vs graded) across two producers — the same equivocation class the
   draft measures in COSE framing. The fix (`n_semantics` + named denominators)
   is the discipline the draft argues for.
3. **Verification chain** proven end-to-end from a plain script: DID → card index →
   card body → canonical preimage → Ed25519. The naive-raw-file-hash failure mode
   documented in the correction ledger is exactly framing sensitivity.

## Proposed M4 contributions to the standards lane (not yet made)

| Contribution | Shape | Status |
|---|---|---|
| Framing-space enumeration counts for JSON canonicalization pairs (house vs JCS vs JS-stringify) over our 3,207-card corpus | measurement appendix / dataset | DESIGNED — M4 can run this on the existing corpus (no new fetches) |
| Implementation-evidence paragraph (dual-preimage catapult rule) | draft revision input | READY as text — owner decides whether to revise |
| csoai.observation/0.1 → SCITT statement-profile mapping | schema crosswalk | DEFERRED — parent vocabulary csoai.evidence-object/0.1 must land first (m4-integrity branch) |
| Witness cosigning (tlog-witness) spike → REJECTED/ACCEPTED feedback to C2SP | experience report | SPIKED (2026-09-17 doc) — shaping deferred to owner |

## Alignment rules (standing)

- **Never claim WG adoption.** "Individual submission" is the only true label.
- The draft's expiry (2027-03-09) is a calendar fact — a revision before then keeps
  the priority; after it, re-submission loses the original date. Owner decision point.
- M4 measures and records; the standards lane authors and submits. No cross-editing.
