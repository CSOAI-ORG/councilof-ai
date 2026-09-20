# Ceremony rehearsal (item 6) — fixtures only, no secrets

`ceremony_rehearsal.py` rehearses the corrected release loop with every external
dependency injected as a fixture: signer (throwaway in-process Ed25519 key, never
persisted), mirror (in-memory bytes), transparency service (in-memory states).

It exists to prove FAIL-CLOSED behaviour before any real ceremony is designed:

- signer down → refuse, `UNSIGNED_DECLARED`, no signature field, no partial artifact
- mirror down → `UNREACHABLE`, never a publication claim
- mirror up but wrong bytes → `PUBLISHED_READBACK_MISMATCH` (HTTP 200 ≠ correct bytes)
- transparency service down → `UNCHECKABLE`
- unconfirmed stamp → stays `PENDING`; a confirmed stamp must bind the exact manifest bytes

Transcript: `rehearsal-transcript.txt` — 9/9 PASS, exit 0 (2026-09-20).

Development note: the first run FAILED the happy path because the signer set
`signature_state: SIGNED` *before* computing the preimage, so the signed bytes included a
field the verifier strips. The verifier caught it — the same defect class as
RECON-2026-0920-01 on the live board (signed bytes ≠ reconstructable bytes). Fixed by
computing the preimage before any signature field exists; this ordering rule is now part
of the rehearsal contract.

This rehearsal is not a ceremony. It uses no production keys, no network, no public
writes, and proves nothing about any real release.
