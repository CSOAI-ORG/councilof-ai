# Cold-start stranger paths — every published artefact, checked in 60 seconds

**Doc ID:** `csoai.cold-start-stranger-paths/0.1` · work-plan row **W9** · survey run 2026-11-03T02:47:13Z
**Method:** `tools/sites/cold_start_survey.py` (committed beside this file — the survey is
re-runnable, not a one-off). The script IS the stranger: it carries no estate context, only
the public URLs, and it measures what a first-time reader gets.

**Result: 18 artefacts · 18 PASS · 0 FAIL · 0 UNCHECKABLE · slowest 1.0s of the 60s budget.**

| # | artefact | stranger command (60s budget) | verdict | secs | detail |
|---|---|---|---|---|---|
| 1 | public root | `curl -s https://councilof.ai/root.json | jq '.merkle_root, .card_count, .as_of'` | **PASS** | 0.11s | merkle 4e57607854be… · 428 cards · as_of 2026-11-01T15:09:42Z |
| 2 | GSPC board | `curl -s https://councilof.ai/api/gspc | jq '.totals.public_count, (.axes | length)'` | **PASS** | 0.14s | totals: 34 axes · 34 measured · rows with status MEASURED: 34 |
| 3 | corrections register | `curl -s https://councilof.ai/api/corrections | jq 'length'` | **PASS** | 0.23s | 93 entries · latest id present=True |
| 4 | signed card index | `curl -s https://councilof.ai/signed/card_index.json | jq '.n_cards == .n_cells'` | **PASS** | 0.14s | n_cards=335 == n_cells=335 is True |
| 5 | cards bundle | `curl -s https://councilof.ai/cards-bundle.json | jq '.card_count'` | **PASS** | 0.97s | card_count=6074 (build aggregate, signs nothing) |
| 6 | DID document | `curl -s https://councilof.ai/.well-known/did.json | jq '[.verificationMethod[].id] | length'` | **PASS** | 0.1s | 7 verification methods · board-attestation-1 present=True |
| 7 | OTS manifest | `curl -s https://councilof.ai/interop/ots/manifest.json | jq '.counts'` | **PASS** | 0.47s | 677 proofs · sampled 3 subjects present beside: 3 |
| 8 | witness pointer | `curl -s https://councilof.ai/interop/root-witness-pointer.json | jq '.drift.status, .drift.checked_at'` | **PASS** | 0.07s | drift.status=MATCH · sidecar present |
| 9 | capsule latest | `curl -s https://councilof.ai/measurement-capsules/latest.json | jq '.as_of, .index'` | **PASS** | 0.06s | as_of 2026-10-28T08:30:40Z · named index reachable |
| 10 | presence ledger | `curl -s https://councilof.ai/interop/nsite-presence-ledger.json | jq '.counts.rows == (.rows | length)'` | **PASS** | 0.22s | counts.rows=2202 == actual 2202 is True |
| 11 | state surface | `curl -s https://councilof.ai/api/state | jq 'keys'` | **PASS** | 0.13s | answered and self-describing |
| 12 | living card registry | `curl -s https://councilof.ai/api/cards | jq 'length'` | **PASS** | 0.2s | answered and self-describing |
| 13 | hub cards | `curl -s https://councilof.ai/api/hub-cards | jq 'length'` | **PASS** | 0.16s | answered and self-describing |
| 14 | worker ledger | `curl -s https://councilof.ai/api/worker/ledger | jq '.records | length'` | **PASS** | 0.09s | answered and self-describing |
| 15 | receipts aggregate | `curl -s https://councilof.ai/api/receipts/latest | jq '.status, .count'` | **PASS** | 0.92s | answered and self-describing |
| 16 | sitemap | `curl -s https://councilof.ai/sitemap.xml | grep -c '<loc>'` | **PASS** | 0.11s | 73462 bytes, expected structure present=True |
| 17 | security.txt | `curl -s https://councilof.ai/.well-known/security.txt` | **PASS** | 0.06s | 185 bytes, expected structure present=True |
| 18 | openapi | `curl -s https://councilof.ai/openapi.json | jq '.openapi, (.paths | length)'` | **PASS** | 0.23s | answered and self-describing |

## What a PASS means, and what it does not

A PASS records that the artefact answered a cold HTTPS request and was **internally
self-describing at read time** (declared counts match payload counts; named companions —
sidecars, named indexes, subjects beside proofs — exist). It is not certification of the
underlying measurement, not an endorsement, and not a claim that the artefact's content is
current — one PASS above (capsule latest) is explicitly 5 days behind the root it indexes,
and the observation saying so is filed separately
(`CAPSULE-STALENESS-OBSERVATION-2026-11-02.md`).

## Findings for the next pass (Tuesday's fixes row)

- First run found 3 FAILs — all three were **probe bugs** (the survey script read the board's
  top-level shape wrong, and handed an empty dict to XML/plain-text checks instead of the raw
  bytes). Fixed before publication: the artefacts were right, the stranger was wrong. Recorded
  because a survey that hides its own false positives would be a scoreboard.
- `cards-bundle.json` is a **6,074-row build aggregate** and grows with every spray lane; the
  file is ~25 MiB-adjacent, which is the same size class that already forced the fact-table
  shard (#3704). Watch its size on the next survey pass.
- The board's `totals` block moved to **34 axes · 34 measured** (2026-11-03 consolidation) —
  the survey's expectation is derived from the payload, not typed, so the next re-run needs no
  edit.

## Re-run

    python3 tools/sites/cold_start_survey.py --out /tmp/cold-start-$(date +%F).json

Exit 0 iff zero FAIL and zero UNCHECKABLE. Runs offline of any estate context.

— claude lane, Track B (Monday), 2026-11-03T02:47:13Z
