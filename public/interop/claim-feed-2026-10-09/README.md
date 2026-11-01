# Claim feed — board totals (2026-10-09)

One maintained claim in the `csoai.maintained-claim/0.1` envelope:

> **board totals 23 axes · 23 measured** — source `https://councilof.ai/api/gspc`,
> as_of `2026-10-09T04:07:30Z` (readback sha256 `ea6dcbc9baaf602ff85f28c8c9668a02bf1c6f89dbf15a609921a360f022953e`).

**Measurement, never certification.** A claim is a pointer with an `as_of`, never a
permanent total. States: `FRESH`, `STALE`, `SUPERSEDED`, `WITHDRAWN`, `UNVERIFIABLE`.

## 60-second agent guide

1. `python3 track.py` — one JSON line on stdout plus an exit code.
2. **exit 0 (`FRESH`)** — a readback matched every asserted value; you may repeat the claim *with its as_of*.
3. **exit 2 (`STALE` / `SUPERSEDED` / `WITHDRAWN`)** — do not repeat it as current.
   `STALE` = a readback succeeded and no longer matches (`readback-no-longer-matches-asserted-values`).
   `SUPERSEDED`/`WITHDRAWN` = a dated record in `SUPERSEDED.jsonl` replaces it — read that record.
4. **exit 3 (`UNVERIFIABLE`)** — the readback could not be taken (`fetch-failed`). This is
   *not* `STALE`: "we could not fetch it" and "it no longer matches" are different facts.
   Never render UNVERIFIABLE as 0, null, or wrong.
5. Re-check cadence, retries and any expiry policy are **yours**: `budget`, `expiry` and
   `retry` are named **OUT OF SCOPE** for `track.py` — it takes one readback and compares
   it, and lets a claim's age alone never decide a state.

`track.py` is stdlib-only. Test hooks for hermetic runs: `--claim-json` (envelope inline),
`--observed-json` (readback bytes inline), `--source-url` (source override), `--ledger`
(ledger path; `--ledger ''` disables). Tests: `python3 test_track.py` (fresh / stale /
unreachable).

## States and exits

| State | Exit | Meaning |
| --- | --- | --- |
| FRESH | 0 | readback matches every asserted value |
| STALE | 2 | readback succeeded, values drifted from the claim |
| SUPERSEDED | 2 | dated ledger record replaces the claim |
| WITHDRAWN | 2 | dated ledger record withdraws the claim |
| UNVERIFIABLE | 3 | readback could not be taken (fetch fail, unreadable source) |

## Supersession worked example — the did.json custody claim

`SUPERSEDED.jsonl` line 1 is real estate history. A claim that the board signing key's
custody was **separated** was served publicly until internal audit caught it on
2026-09-25T12:11:43Z: the ceremony runbook already recorded that the current scheme is
three shares on ONE machine — one failure domain. Correction **C-2026-0925-01** withdrew
the separated-custody claim with dated provenance (`https://councilof.ai/api/corrections`,
custody bytes `https://councilof.ai/.well-known/did.json`) and held 5 OSAIA threads
(#18 #27 #37 #38 #66) until corrected.

The layers do not stop there: **C-2026-0926-01** then superseded the *text* of that entry
(its `what_was_wrong` field, original text sha256
`14aa9778984fdc4b1b9b972060440a6cc98a9bd948b3fef916428973ddfb3748`) for a redaction
breach — line 2. That is the pattern this feed follows: **corrections supersede with dated
provenance**; what a reader should repeat changes, and what was believed when remains
citeable. This file claims no storage property for `https://councilof.ai/api/corrections`
or for itself.

## Out of scope (named)

**budget, expiry, retry.** No time-to-live, no staleness-by-age, no retry/backoff, no
request budget: those are consumer policy. `track.py` measures one thing — does a readback
right now match what the claim asserts — and reports honestly when it cannot even take the
readback.
