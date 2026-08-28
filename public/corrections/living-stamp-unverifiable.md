# Living board stamp = UNVERIFIABLE

**Correction C-2026-0826-08** · restated 2026-08-28 · CC-BY-4.0  
Council of AI (CSOAI Ltd, UK Companies House 16939677)

This is the citeable file. Hiding it is the defect.

## Finding

The living board stamp on `GET /api/gspc` (`measured_on.living_stamp`) and in `/signed/board_living.json` **does not verify**. 58,184 readings. 0 verified.

It is **UNVERIFIABLE**, not VALID, not quietly deleted. We do not claim INVALID. Uncheckable is the same outcome for a relying party.

## Three faults

1. Two signatures for one stamp (`53aa09fa…` vs `bd199fd3…`).
2. Signer `8f9a00a2…` is not in `did:web:csoai.org`.
3. Axes were re-snapshotted six days after the signature date — signed bytes ≠ published bytes.

## Close (owner, not this file)

One preimage rule. One signature. Anchor the signer or re-sign with a published key. Do not mint a new key here.

## Do not

- Fill the 7 UNMEASURED slots (`reserve-attestation`, `regulatory-framework`, `distribution-integrity`, `custody-disclosure`, `ai-economy-index`, `human-labour-index`, `humanoid-labour-index`).
- Treat `site_attestation` as proving this stamp.
- Float a ticker. XRP / ETH / RWA are subjects to measure.

## What does verify

Measurement cards under `#card-attestation-1`. Site attestation on `/api/gspc` under `#board-attestation-1` (payload integrity, not this stamp).

Ledger: https://councilof.ai/api/corrections (signature currently **STALE** — also published, not hidden).  
Machine copy: `/corrections/living-stamp-unverifiable.json`
