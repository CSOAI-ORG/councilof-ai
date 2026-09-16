# The estate, consolidated: one index, one root, one honest set of numbers

16 September 2026. Every artifact CSOAI holds, wherever it lives, is written down once, digested,
and committed to a single Merkle root. This is the map.

Machine-readable: `/interop/master-consolidation-2026-09-16.json`, with its OpenTimestamps proof
beside it. Rendered: `/estate`. On the live API: `/api/state` → `estate_index`. For agents:
the `estate-index` skill on `/.well-known/agent-card.json`.

## The one rule that makes the rest readable

**INDEXED is not MEASURED.** A row here says we found the artifact and recorded it. It says nothing
about whether anything was measured against it. `/api/gspc` is the only surface that answers the
measurement question.

## Two kinds of digest, never added together

| Leaf class | What the digest covers | What inclusion proves |
|---|---|---|
| bytes leaf | The artifact's own bytes, which we read | Those exact bytes were in the set when the root was stamped |
| record leaf | Our canonical note about a remote artifact we did not download | We recorded that identity at that time, and nothing about the remote bytes |

5773 bytes leaves. 2167 record leaves. Their sum is never presented
as one number, because they answer different questions.

## What is in the set

| Surface | Entries |
|---|---|
| github | 400 |
| huggingface | 1,758 |
| kaggle | 20 |
| oracle object storage | 8 |
| repo | 5,754 |

Total: **7,940 entries**, in two states.

| State | Count | Meaning |
|---|---|---|
| INDEXED | 6,427 | We found the artifact and recorded it. Nothing was measured against it. |
| UNSIGNED | 1,513 | A card body that exists and carries signature: null by design. Not measured, not withdrawn, not pending: awaiting a signing decision that only the board key can make. |

## What was checked, and what each check does not settle

Every figure below is read from the artifact named beside it. None is typed.

### signed card corpus

`public/signed/cards/*.json verified against the live did:web:csoai.org document`

- bodies on disk: 335
- verify valid: 335
- signing key: d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38
- control: one byte flipped in a card that verifies -> INVALID: InvalidSignature

> That the cards are correct. A signature proves the bytes have not changed since signing, never that they were worth signing. On 14 September 44 signed results were withdrawn whose signatures all verified.

### anchoring

`every .ots under public/, parsed and checked against the file it names`

- proofs: 85
- bitcoin attested: 56
- calendar pending: 29
- unreadable: 0

> A calendar-pending stamp is a REQUEST, not an anchor. Only the Bitcoin-attested count is evidence of a time.

### xrpl issued supply

`public/interop/xrpl-supply-2026-09-16.json`

- n: 16
- n measured: 16
- n unmeasured: 0
- n uncheckable: 0
- as of: 2026-09-16T11:06:53Z

> Obligations are what the issuing account owes on the XRP Ledger at the named validated ledger: that is the issued supply, and nothing more. It is not a reserve attestation, not a claim about backing, and not a grade.

### swift cohort

`public/interop/swift-measure.json`

- n: 17
- status all: DISCOVERED_PER_BANK_COHORT_MEMBERSHIP_MEASURED
- as of: 2026-09-16T10:30:01Z
- url provenance: GUESSED_BY_US_NOT_PRIMARY_SOURCE
- sig status: UNSIGNED_PENDING_OIDC

> Cohort membership is now MEASURED against the primary source: the seventeen names below are the seventeen Swift names, and our earlier list matched it exactly. Everything else in this file is still the HTTP state of URLs WE chose — eleven are newsroom index pages we guessed, and a 404 on a path we invented is evidence about our guess, never about the bank. No bank here has been measured on tokenisation posture and none may be quoted as such.

### cobol systems

`public/interop/cobol-measure.json`

- n: 12
- n ok: 9
- n http error: 3
- status all: DISCOVERED
- as of: 2026-09-16T10:30:16Z
- sig status: UNSIGNED_PENDING_OIDC

> DISCOVERED until public COBOL retirement / modernization disclosure is verifiable. Bank COBOL exposure is industry-known; we don't pretend to measure it from a homepage fetch.

### x402 doors

`public/interop/x402-door-census-2026-09-16.json`

- n: 11
- as of: 2026-09-16T11:40:00Z
- discovery: https://councilof.ai/.well-known/x402.json
- doors whose challenge a stdlib client never receives: 11

### stablecoin corpus

`public/interop/stablecoin-corpus-index-2026-09-16.json`

- universe asset count: 425
- assets with at least one measured deployment: 302
- still unmeasured: 123
- as of: 2026-09-16T12:06:54Z

> This counts ASSETS with at least one measured deployment. It is not a sum of supply: the universe mixes peg currencies, and one asset may be deployed on several chains, so a sum would mix units or double-count a bridged token.

## What this root does not do

- **It is not signed.** No key is applied, so it records when, not who.
- **It is therefore not witnessable in Rekor** the way `public/root.json` is: that witness uploads a
  signature, and there is none here.
- **It does not replace the three card corpora.** `cards-bundle.json`, `root.json` and
  `signed/card_index.json` each commit to their own separate corpus with zero identifier overlap.
  See `council-os/CARD-CORPORA.md`.
- **It proves nothing about quality.** On 14 September we withdrew 44 signed results whose banks
  hashed perfectly and whose graders could not mark anything wrong.

bytes_leaves and record_leaves answer different questions; report both, never their sum as one number

## Identifiers withheld

21 entries carry an internal codename that may not appear on a
public surface. The entries are kept and their digests are untouched, so inclusion can still be
proved by anyone holding the real identifier. scripts/brand-gate.mjs blocks internal codenames on every public surface, and a census that quietly dropped them would understate the estate.

## Reproducing the root

leaf = sha256(bytes); pairs hashed in order; an odd node is carried up unchanged, never duplicated

```bash
python3 scripts/master_consolidation.py --selftest --inputs . --out /dev/null
python3 scripts/estate_root_gate.py
```

The first builds a seven-leaf tree, proves every leaf verifies, and proves a leaf from outside the
set is rejected. The second recomputes the published root from the artifact's own entries and
refuses to deploy if it disagrees with either published copy. Both run on every build. A check that
cannot fail is not a check.

## What is still open, and whose hand it needs

- **The board signing key.** 1,513 card bodies are ready to sign and
  cannot become MEASURED without it. Owner.
- **Anchoring in progress.** 29 proofs are calendar-pending. A job
  runs every six hours to upgrade them; it pushes a branch and never deploys.
- **SWIFT.** Cohort membership is measured; the axis is not. It needs a primary-source disclosure we
  do not yet hold.
- **Stablecoins.** 123 of
  425 assets remain unmeasured, each carrying its own
  reason.
