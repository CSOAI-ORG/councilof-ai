# Board card-index ruling — CORRECTED 2026-08-26

## What I got wrong (and am correcting)
On 2026-08-26 I ruled the 150↔335 dispute as "150 ⊂ 335, union = 335" and restored the
335 index. That was **structurally** true but **not a measurement of the 185 extra cards**:
- `"signed": true` in each card entry is a **boolean flag, not a signature**.
- Neither the core 150 nor the extra 185 have backing card files in this repo — every
  `card` value is a content-hash that only verifies against the external card store
  (the harness / HF), which this repo cannot see.
- The extra 185 are all **benchmark/candidate axes** (arc-30, mmlu-30, gsm8k-30,
  swarm-candidates, jail-escape-detection, care-refusal-*, duplicated gspc-* names).

So I could not, and did not, verify the 185 are real measured cards. Claiming 335 on that
basis is exactly the overclaim this estate exists to refuse. **UNMEASURED before measured.**

## The ruling (freeze)
1. Board card-index is **frozen at the verifiable floor (150)** until the 185 candidate
   cards are verified against the real card store — each hash must resolve to a signed
   card whose bytes recompute. Whatever number actually verifies (150, 335, or between)
   becomes the board.
2. **All auto-restoring board workflows are removed** (honest-board-floor, reject-335-board,
   protect-verified-335, protect-verified-board, sticky335-land-atomic). No bot fights.
   `signed-json-guard` remains the only gate (header count == array length, structurally valid).
3. Any change to the card index goes through a PR + the verification in (1) — never a
   counter-push. This is the HIVE-HARMONY escalation working: measure → could-not-verify →
   freeze at the honest floor → owner re-rules with the real fact.

## To settle it for real
Verify the 185 candidate-card hashes against the card store the harness produced them from.
That is a real measurement, not a count argument — and it belongs to whoever holds the store.
